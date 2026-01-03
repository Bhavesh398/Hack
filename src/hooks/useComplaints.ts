import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DbComplaint {
  id: string;
  complaint_id: string;
  citizen_name: string;
  citizen_email: string | null;
  citizen_phone: string | null;
  description: string;
  location: string | null;
  category: string;
  sub_category: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  priority_score: number | null;
  status: 'received' | 'assigned' | 'in_progress' | 'resolved';
  department_id: string | null;
  assigned_officer: string | null;
  sentiment_score: number | null;
  urgency_keywords: string[] | null;
  impact_prediction: string | null;
  affected_people: number | null;
  sla_hours: number | null;
  media_urls?: string[]; // optional media attachments for the complaint
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  avg_resolution_hours: number | null;
  created_at: string;
}

export function useComplaints() {
  const [complaints, setComplaints] = useState<DbComplaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchComplaints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch complaints');
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchComplaints(), fetchDepartments()]);
      setLoading(false);
    };
    loadData();
  }, [fetchComplaints, fetchDepartments]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('complaints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            setComplaints(prev => [payload.new as DbComplaint, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setComplaints(prev => 
              prev.map(c => c.id === payload.new.id ? payload.new as DbComplaint : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setComplaints(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const submitComplaint = async (data: {
    citizenName: string;
    citizenEmail?: string;
    citizenPhone?: string;
    description: string;
    location: string;
    affectedPeople?: number;
    attachedFiles?: File[];
  }) => {
    try {
      // Generate complaint ID first
      const complaintId = `SMD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Upload media files to Supabase storage
      const mediaUrls: string[] = [];
      if (data.attachedFiles && data.attachedFiles.length > 0) {
        for (const file of data.attachedFiles) {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${complaintId}/${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('complaint-media')
              .upload(fileName, file);
            
            if (uploadError) {
              console.warn('File upload error:', uploadError);
              continue;
            }
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('complaint-media')
              .getPublicUrl(fileName);
            
            mediaUrls.push(publicUrl);
          } catch (err) {
            console.warn('Failed to upload file:', err);
          }
        }
      }

      // Try to analyze with AI, but use fallback if it fails
      let analysisData;
      try {
        const { data: aiData, error: analysisError } = await supabase.functions.invoke('analyze-complaint', {
          body: {
            description: data.description,
            location: data.location,
            affectedPeople: data.affectedPeople || 1
          }
        });

        if (analysisError) {
          console.warn('AI analysis failed, using fallback:', analysisError);
          analysisData = getFallbackAnalysis(data.description);
        } else {
          analysisData = aiData;
        }
      } catch (err) {
        console.warn('AI analysis error, using fallback:', err);
        analysisData = getFallbackAnalysis(data.description);
      }

      // Find department by name
      const department = departments.find(d => d.name === analysisData.department);

      // Insert into database
      const { data: newComplaint, error: insertError } = await supabase
        .from('complaints')
        .insert({
          complaint_id: complaintId,
          citizen_name: data.citizenName,
          citizen_email: data.citizenEmail || null,
          citizen_phone: data.citizenPhone || null,
          description: data.description,
          location: data.location,
          category: analysisData.category,
          sub_category: analysisData.subCategory,
          priority: analysisData.priority,
          priority_score: analysisData.priorityScore,
          department_id: department?.id || null,
          sentiment_score: analysisData.sentiment,
          urgency_keywords: analysisData.urgencyKeywords || [],
          impact_prediction: analysisData.impactPrediction,
          affected_people: data.affectedPeople || 1,
          sla_hours: analysisData.slaHours,
          media_urls: mediaUrls.length > 0 ? mediaUrls : [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Complaint Submitted Successfully',
        description: `Your complaint ID is ${complaintId}. Track it in the dashboard.`,
      });

      return { complaint: newComplaint, analysis: analysisData };
    } catch (err) {
      console.error('Error submitting complaint:', err);
      toast({
        title: 'Submission Failed',
        description: err instanceof Error ? err.message : 'Failed to submit complaint',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const getFallbackAnalysis = (description: string) => {
    // Simple keyword-based fallback analysis
    const lowerDesc = description.toLowerCase();
    
    let category = 'Sanitation';
    let subCategory = 'General Complaint';
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let priorityScore = 50;
    
    // Category detection
    if (lowerDesc.includes('road') || lowerDesc.includes('pothole') || lowerDesc.includes('street')) {
      category = 'Roads'; subCategory = 'Road Maintenance';
    } else if (lowerDesc.includes('water') || lowerDesc.includes('leak')) {
      category = 'Water'; subCategory = 'Water Supply';
    } else if (lowerDesc.includes('electricity') || lowerDesc.includes('power') || lowerDesc.includes('light')) {
      category = 'Electricity'; subCategory = 'Power Outage';
    } else if (lowerDesc.includes('garbage') || lowerDesc.includes('waste') || lowerDesc.includes('trash')) {
      category = 'Sanitation'; subCategory = 'Garbage Collection';
    } else if (lowerDesc.includes('police') || lowerDesc.includes('crime') || lowerDesc.includes('safety')) {
      category = 'Safety'; subCategory = 'Public Safety';
    } else if (lowerDesc.includes('hospital') || lowerDesc.includes('health') || lowerDesc.includes('doctor')) {
      category = 'Healthcare'; subCategory = 'Healthcare Services';
    }
    
    // Priority detection
    if (lowerDesc.includes('emergency') || lowerDesc.includes('urgent') || lowerDesc.includes('critical') || lowerDesc.includes('danger')) {
      priority = 'high'; priorityScore = 80;
    }
    if (lowerDesc.includes('death') || lowerDesc.includes('life') || lowerDesc.includes('fire') || lowerDesc.includes('accident')) {
      priority = 'critical'; priorityScore = 95;
    }
    
    const departmentMap: Record<string, string> = {
      'Sanitation': 'Municipal Corporation',
      'Roads': 'Public Works Department',
      'Water': 'Water Supply Department',
      'Electricity': 'Electricity Board',
      'Safety': 'Police Department',
      'Healthcare': 'Health Department',
      'Education': 'Education Department',
      'Transport': 'Transport Department',
    };
    
    const slaMap = { critical: 4, high: 12, medium: 24, low: 48 };
    
    return {
      category,
      subCategory,
      priority,
      priorityScore,
      sentiment: 0,
      urgencyKeywords: [],
      impactPrediction: 'Requires attention to resolve citizen concern.',
      department: departmentMap[category],
      slaHours: slaMap[priority],
    };
  };

  const analyzeComplaint = async (description: string, location: string, affectedPeople?: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-complaint', {
        body: { description, location, affectedPeople }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Analysis error:', err);
      throw err;
    }
  };

  const updateComplaintStatus = async (id: string, status: DbComplaint['status']) => {
    try {
      const updateData: Record<string, unknown> = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Complaint status changed to ${status.replace('_', ' ')}.`,
      });
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: 'Update Failed',
        description: 'Failed to update complaint status.',
        variant: 'destructive',
      });
    }
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'Unassigned';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown';
  };

  // Calculate stats
  const resolutionRate = complaints.length > 0 
    ? Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100) 
    : 0;

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    pending: complaints.filter(c => c.status !== 'resolved').length,
    critical: complaints.filter(c => c.priority === 'critical' && c.status !== 'resolved').length,
    high: complaints.filter(c => c.priority === 'high' && c.status !== 'resolved').length,
    avgResolutionTime: 24, // Mock for now
    resolutionRate,
    categoryBreakdown: complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    departmentPerformance: departments.reduce((acc, dept) => {
      const deptComplaints = complaints.filter(c => c.department_id === dept.id);
      const resolved = deptComplaints.filter(c => c.status === 'resolved').length;
      acc[dept.name] = {
        total: deptComplaints.length,
        resolved,
        avgTime: 24
      };
      return acc;
    }, {} as Record<string, { total: number; resolved: number; avgTime: number }>)
  };

  return {
    complaints,
    departments,
    loading,
    error,
    stats,
    submitComplaint,
    analyzeComplaint,
    updateComplaintStatus,
    getDepartmentName,
    refetch: fetchComplaints,
  };
}
