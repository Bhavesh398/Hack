import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to analyze complaints locally without AI
function analyzeComplaintsLocally(complaints: any[]) {
  console.log('Analyzing complaints locally without AI...');
  
  // Group by location + category combination
  const byLocationCategory: Record<string, any[]> = {};
  const byCategory: Record<string, any[]> = {};
  const byLocation: Record<string, any[]> = {};
  
  complaints.forEach(c => {
    const cat = c.category || 'Other';
    const loc = c.location || 'Unknown';
    const key = `${loc}|${cat}`; // Unique key combining location and category
    
    if (!byLocationCategory[key]) byLocationCategory[key] = [];
    if (!byCategory[cat]) byCategory[cat] = [];
    if (!byLocation[loc]) byLocation[loc] = [];
    
    byLocationCategory[key].push(c);
    byCategory[cat].push(c);
    byLocation[loc].push(c);
  });
  
  // Find hotspots by location + category combination
  const hotspots = Object.entries(byLocationCategory)
    .map(([key, items]) => {
      const [location, category] = key.split('|');
      const avgScore = items.reduce((sum, c) => sum + (c.priorityScore || 0), 0) / items.length;
      const criticalCount = items.filter(c => c.priority === 'critical').length;
      const urgentCount = items.filter(c => c.priority === 'urgent').length;
      const highCount = items.filter(c => c.priority === 'high').length;
      const mediumCount = items.filter(c => c.priority === 'medium').length;
      const highPriorityCount = criticalCount + urgentCount + highCount;
      
      // Risk score calculation weighted by criticality
      let riskScore = 50;
      riskScore += items.length * 3; // Base count factor
      riskScore += criticalCount * 30; // Critical complaints weighted heavily
      riskScore += urgentCount * 20; // Urgent complaints
      riskScore += highCount * 10; // High priority
      riskScore += (avgScore / 10); // Average priority score factor
      riskScore = Math.min(riskScore, 100); // Cap at 100
      
      return {
        location,
        category,
        issue: category,
        count: items.length,
        avgPriority: avgScore,
        criticalCount,
        urgentCount,
        highCount,
        highPriorityCount,
        description: `${items.length} ${category.toLowerCase()} complaint(s) in ${location}`,
        riskScore
      };
    })
    .sort((a, b) => {
      // Sort by: critical complaints first, then urgent, then high, then high priority ratio, then count
      if (a.criticalCount !== b.criticalCount) return b.criticalCount - a.criticalCount;
      if (a.urgentCount !== b.urgentCount) return b.urgentCount - a.urgentCount;
      if (a.highCount !== b.highCount) return b.highCount - a.highCount;
      const ratioA = a.highPriorityCount / a.count;
      const ratioB = b.highPriorityCount / b.count;
      if (ratioA !== ratioB) return ratioB - ratioA;
      if (a.count !== b.count) return b.count - a.count;
      return b.avgPriority - a.avgPriority;
    })
    .slice(0, 3)
    .map(h => {
      let prediction = `${h.description} - requires attention.`;
      if (h.criticalCount > 0) {
        prediction += ` ⚠️ CRITICAL: ${h.criticalCount} critical priority complaint(s)`;
      } else if (h.urgentCount > 0) {
        prediction += ` 🔴 ${h.urgentCount} urgent complaint(s)`;
      } else if (h.highCount > 0) {
        prediction += ` 🟠 ${h.highCount} high priority complaint(s)`;
      } else {
        prediction += ` ${h.highPriorityCount}/${h.count} are high priority`;
      }
      
      let timeToResolve = 'immediate';
      if (h.criticalCount > 0) {
        timeToResolve = 'immediate';
      } else if (h.urgentCount > 0) {
        timeToResolve = 'immediate';
      } else if (h.avgPriority > 100) {
        timeToResolve = 'immediate';
      } else if (h.avgPriority > 75) {
        timeToResolve = '24h';
      } else {
        timeToResolve = '1week';
      }
      
      return {
        location: h.location,
        issue: h.issue,
        riskScore: h.riskScore,
        prediction,
        recommendedAction: `${h.criticalCount > 0 ? '🚨 ESCALATE: ' : ''}Address ${h.issue.toLowerCase()} issues in ${h.location} - ${h.highPriorityCount} urgent/critical case(s)`,
        estimatedImpact: h.count * 20,
        timeToResolve
      };
    });
  
  // Find trends by category (considering location distribution)
  const trends = Object.entries(byCategory)
    .map(([category, cats]) => {
      const urgentCount = cats.filter(c => c.priority === 'urgent' || c.priority === 'high').length;
      const locations = new Set(cats.map(c => c.location || 'Unknown')).size;
      const direction = urgentCount > cats.length * 0.5 ? 'rising' : cats.length > 5 ? 'stable' : 'falling';
      
      return {
        category,
        direction,
        count: cats.length,
        urgentCount,
        locations,
        reason: `${urgentCount}/${cats.length} high priority, affecting ${locations} location(s)`
      };
    })
    .sort((a, b) => {
      const urgencyA = a.urgentCount / a.count;
      const urgencyB = b.urgentCount / b.count;
      return urgencyB - urgencyA || b.count - a.count;
    })
    .slice(0, 3)
    .map(t => ({
      category: t.category,
      direction: t.direction as 'rising' | 'falling' | 'stable',
      percentChange: Math.round((t.urgentCount / t.count) * 100),
      reason: t.reason,
      priority: t.direction === 'rising' ? 'high' : t.direction === 'stable' ? 'medium' : 'low'
    }));
  
  // SLA risks - by location + category combination
  const slaRisks = Object.entries(byLocationCategory)
    .map(([key, items]) => {
      const [location, category] = key.split('|');
      const atRisk = items.filter(c => c.status === 'escalated' || (c.priority === 'urgent' && c.status === 'open')).length;
      return {
        locationCategory: key,
        location,
        category,
        count: atRisk,
        totalCount: items.length,
        priority: items[0]?.priority || 'medium'
      };
    })
    .filter(r => r.count > 0)
    .sort((a, b) => {
      // Sort by: count, then by urgency
      if (b.count !== a.count) return b.count - a.count;
      return (b.count / b.totalCount) - (a.count / a.totalCount);
    })
    .slice(0, 3)
    .map(r => ({
      category: `${r.category} (${r.location})`,
      count: r.count,
      urgency: r.priority === 'urgent' ? 'immediate' : r.priority === 'high' ? 'within_24h' : 'within_week' as const,
      recommendedResolution: `Prioritize ${r.count} escalated ${r.category.toLowerCase()} issues in ${r.location}`
    }));
  
  // Resource recommendations - by location + category
  const resources = Object.entries(byLocationCategory)
    .map(([key, items]) => {
      const [location, category] = key.split('|');
      const avgScore = items.reduce((sum, c) => sum + (c.priorityScore || 0), 0) / items.length;
      return {
        location,
        category,
        count: items.length,
        avgScore
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore || b.count - a.count)
    .slice(0, 3)
    .map((r, i) => ({
      department: `${r.category} Department (${r.location})`,
      priority: r.avgScore >= 80 ? 'urgent' : r.avgScore >= 60 ? 'high' : 'medium' as const,
      reason: `${r.count} ${r.category.toLowerCase()} complaints in ${r.location} with avg priority ${Math.round(r.avgScore)}`,
      estimatedCost: 5 + i * 2,
      suggestedAction: `Deploy resources to handle ${r.count} pending ${r.category.toLowerCase()} issues in ${r.location}`
    }));
  
  // Affected categories and locations
  const allCategories = Object.keys(byCategory);
  const allLocations = Object.keys(byLocation);
  
  return {
    hotspots,
    trends,
    slaRisks: slaRisks.length > 0 ? slaRisks : [
      { category: "General", count: 1, urgency: "within_24h" as const, recommendedResolution: "Review pending issues" }
    ],
    seasonalAlert: {
      active: false,
      type: "monitoring",
      affectedCategories: allCategories.slice(0, 3),
      priority: "medium",
      recommendation: `Monitoring ${allCategories.length} complaint categories across ${allLocations.length} locations`,
      timeline: "ongoing"
    },
    resourceRecommendation: resources,
    citizenSentiment: {
      overall: Object.values(byLocationCategory).some(c => c.some((x: any) => x.priority === 'urgent')) ? 'negative' : 'neutral' as const,
      trend: "stable" as const,
      topConcern: Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'General',
      priority: "medium"
    }
  };
}

// Helper function to generate fallback predictions
function generateFallbackPredictions() {
  return {
    hotspots: [],
    trends: [],
    slaRisks: [],
    seasonalAlert: {
      active: false,
      type: "none",
      affectedCategories: [],
      priority: "low",
      recommendation: "No data available for predictions",
      timeline: "pending"
    },
    resourceRecommendation: [],
    citizenSentiment: {
      overall: "neutral" as const,
      trend: "stable" as const,
      topConcern: "No complaints data available",
      priority: "low"
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Predict-issues function called');
    const requestBody = await req.json();
    const { complaints, timeRange } = requestBody;
    console.log('Received request with', complaints?.length || 0, 'complaints');

    // Validate input
    if (!complaints || !Array.isArray(complaints)) {
      console.error('Invalid complaints data:', complaints);
      return new Response(
        JSON.stringify({ error: 'Invalid complaints data - expected array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (complaints.length === 0) {
      console.log('No complaints provided, returning fallback predictions');
      // Return fallback predictions for empty data
      const fallbackPredictions = generateFallbackPredictions();
      return new Response(
        JSON.stringify(fallbackPredictions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY not configured, using local analysis');
      const predictions = analyzeComplaintsLocally(scoredComplaints);
      return new Response(
        JSON.stringify(predictions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to use Gemini API for enhanced analysis
    console.log('Attempting to use Gemini API for analysis...');

    // Sort complaints by priority score before processing
    const scoredComplaints = complaints.map((c: any) => {
      try {
        const priorityWeights = { 'urgent': 100, 'high': 75, 'medium': 50, 'low': 25 };
        const statusWeights = { 'open': 30, 'escalated': 50, 'pending': 20, 'resolved': 0 };
        
        // Safe date calculation with fallback
        let ageScore = 0;
        if (c.created_at) {
          try {
            const ageInDays = (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
            ageScore = Math.min(Math.max(ageInDays * 5, 0), 50);
          } catch (dateError) {
            console.warn('Date parsing error for complaint:', c.id, dateError);
            ageScore = 0;
          }
        }
        
        const priorityScore = (priorityWeights[c.priority as keyof typeof priorityWeights] || 25) + 
                             (statusWeights[c.status as keyof typeof statusWeights] || 20) + 
                             ageScore + 
                             (c.affected_people ? Math.min(c.affected_people * 2, 40) : 0);
        
        return { ...c, priorityScore };
      } catch (error) {
        console.error('Error scoring complaint:', c.id, error);
        return { ...c, priorityScore: 0 };
      }
    }).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 20);

    const complaintsData = JSON.stringify(scoredComplaints.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      location: c.location,
      priority: c.priority,
      status: c.status,
      created_at: c.created_at,
      affected_people: c.affected_people,
      priorityScore: c.priorityScore
    })), null, 2);

    console.log(`Processing ${scoredComplaints.length} complaints for AI analysis`);
    console.log('Sample complaint data:', complaintsData.substring(0, 500));

    const systemPrompt = `You are an advanced AI analytics engine for a government grievance redressal system called "Samadhan".
Analyze the ACTUAL complaint data provided and generate SPECIFIC predictions based on the real data patterns.

CRITICAL: Use the actual locations, categories, and issues from the complaints data provided. Do NOT use generic examples.

PRIORITY SCORING GUIDELINES:
- Consider both priority level (urgent > high > medium > low)
- Factor in status (escalated > open > pending)
- Account for age of complaint (older = more urgent)
- Weight by affected population (more people = higher urgency)
- Focus on quick-win resolutions with high impact

Based on the ACTUAL complaint patterns in the data, generate the following predictions and insights as a JSON object:

1. hotspots: Array of top 3 REAL emerging problem areas from the data with:
   - location: ACTUAL location from complaints data
   - issue: ACTUAL main problem type from complaints
   - riskScore: 1-100 (calculated based on frequency and priority)
   - prediction: what will happen if not addressed
   - recommendedAction: specific action to take
   - estimatedImpact: number of people affected (from data)
   - timeToResolve: "immediate" | "24h" | "1week"

2. trends: Array of 3 ACTUAL trend predictions from the data with:
   - category: REAL complaint category from data
   - direction: "rising" | "falling" | "stable" (based on data patterns)
   - percentChange: number (calculated from data)
   - reason: explain the trend based on actual complaints
   - priority: "critical" | "high" | "medium"

3. slaRisks: Array of ACTUAL categories at risk based on data with:
   - category: REAL category name from complaints
   - count: ACTUAL number at risk from data
   - urgency: "immediate" | "within_24h" | "within_week"
   - recommendedResolution: action to prevent breach

4. seasonalAlert: Object with:
   - active: boolean (true if seasonal patterns detected in data)
   - type: inferred from complaint patterns and dates
   - affectedCategories: ACTUAL categories from data
   - priority: "critical" | "high" | "medium"
   - recommendation: preventive measure based on data
   - timeline: when to implement

5. resourceRecommendation: Array of top 3 ACTUAL resource needs from data with:
   - department: REAL department based on complaint categories
   - priority: "urgent" | "high" | "medium"
   - reason: based on ACTUAL complaint data
   - estimatedCost: relative scale (1-10)
   - suggestedAction: specific action based on complaints

6. citizenSentiment: Object with:
   - overall: "positive" | "neutral" | "negative" | "critical" (inferred from data)
   - trend: "improving" | "declining" | "stable"
   - topConcern: ACTUAL main issue from most complaints
   - priority: "critical" | "high" | "medium"

IMPORTANT: Analyze the provided complaint data carefully. Use actual locations, categories, and issues from the data. Make predictions based on patterns, frequencies, and priorities in the REAL data provided.

Return ONLY valid JSON, no markdown or explanation.`;

    const userPrompt = `Analyze these ${scoredComplaints.length} recent government complaints and generate predictions based on the ACTUAL data patterns:

COMPLAINT DATA:
${complaintsData}

Time range: ${timeRange || 'last 7 days'}

Generate specific predictions using the real complaint locations, categories, and issues from the data above.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n${userPrompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      console.log('Falling back to local analysis due to API error');
      
      // Use local analysis instead of crashing
      const predictions = analyzeComplaintsLocally(scoredComplaints);
      return new Response(
        JSON.stringify(predictions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error('No content in AI response');
      console.log('Using local analysis due to empty AI response');
      const predictions = analyzeComplaintsLocally(scoredComplaints);
      return new Response(
        JSON.stringify(predictions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response received, length:', content.length);

    let predictions;
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      predictions = JSON.parse(cleanedContent);
      console.log('Successfully parsed AI predictions');
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Using local analysis instead');
      predictions = analyzeComplaintsLocally(scoredComplaints);
    }

    console.log('Predictions generated:', predictions);

    return new Response(
      JSON.stringify(predictions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in predict-issues function:', error);
    
    // Return fallback predictions instead of error
    const fallbackPredictions = generateFallbackPredictions();
    return new Response(
      JSON.stringify(fallbackPredictions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
