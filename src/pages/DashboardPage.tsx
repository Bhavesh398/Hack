import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplaints, DbComplaint } from "@/hooks/useComplaints";
import { useAuth } from "@/contexts/AuthContext";
import { StatsCards } from "@/components/StatsCards";
import { CategoryChart } from "@/components/CategoryChart";
import { DepartmentPerformance } from "@/components/DepartmentPerformance";
import { GovernmentIntegration } from "@/components/GovernmentIntegration";
import { AdvancedPredictions } from "@/components/AdvancedPredictions";
import { PriorityDistributionChart } from "@/components/PriorityDistributionChart";
import { ComplaintsTrendChart } from "@/components/ComplaintsTrendChart";
import { LocationHeatmap } from "@/components/LocationHeatmap";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  LayoutDashboard, 
  FileText, 
  BarChart3,
  Plus,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  Building2,
  Brain,
  LogOut,
  FileDown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function ComplaintCardReal({ complaint, onStatusChange, getDepartmentName, isAuthority, onSelect, reporterCount }: { 
  complaint: DbComplaint; 
  onStatusChange: (id: string, status: DbComplaint['status']) => void;
  getDepartmentName: (id: string | null) => string;
  isAuthority: boolean;
  onSelect?: (complaint: DbComplaint) => void;
  reporterCount?: number;
}) {
  const CATEGORY_ICONS: Record<string, string> = {
    'Sanitation': '🗑️',
    'Roads': '🛣️',
    'Water': '💧',
    'Electricity': '⚡',
    'Safety': '🚔',
    'Healthcare': '🏥',
    'Education': '📚',
    'Transport': '🚌',
  };

  const statusMap: Record<string, DbComplaint['status']> = {
    'received': 'assigned',
    'assigned': 'in_progress',
    'in_progress': 'resolved',
  };

  const nextStatus = statusMap[complaint.status];
  const statusDisplay = complaint.status.replace('_', '-') as 'received' | 'assigned' | 'in-progress' | 'resolved';

  return (
    <Card 
      className="border-border/50 hover:border-accent/50 transition-all hover:shadow-lg bg-card group cursor-pointer"
      onClick={() => onSelect?.(complaint)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{CATEGORY_ICONS[complaint.category] || '📋'}</span>
            <div>
              <p className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                {complaint.complaint_id}
                {reporterCount && reporterCount > 1 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    {reporterCount} reports
                  </Badge>
                )}
              </p>
              <p className="font-medium text-sm text-foreground">{complaint.category}</p>
            </div>
          </div>
          <PriorityBadge priority={complaint.priority} />
        </div>

        <p className="text-sm text-foreground mb-3 line-clamp-2">{complaint.description}</p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3" />
          <span>{complaint.location || 'Location not specified'}</span>
        </div>

        <div className="flex items-center justify-between">
          <StatusBadge status={statusDisplay} />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
          </div>
        </div>

        {complaint.impact_prediction && (
          <div className="mt-3 p-2 rounded bg-muted/50 border border-border/30">
            <p className="text-xs text-muted-foreground">{complaint.impact_prediction}</p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Dept: <span className="text-foreground font-medium">{getDepartmentName(complaint.department_id)}</span>
          </p>
          {isAuthority && nextStatus && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onStatusChange(complaint.id, nextStatus)}
            >
              Mark {nextStatus.replace('_', ' ')}
              <ChevronRight className="w-3 h-3" />
            </Button>
          )}
          {!isAuthority && (
            <p className="text-xs text-muted-foreground italic">
              Status: {complaint.status.replace('_', ' ')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { complaints, loading, stats, updateComplaintStatus, getDepartmentName, refetch } = useComplaints();
  const { isAuthority, departmentName, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("complaints");
  const [selectedComplaint, setSelectedComplaint] = useState<(DbComplaint & { reporterCount?: number; mergedIds?: string[] }) | null>(null);

  // Prevent non-authority users from viewing restricted tabs
  useEffect(() => {
    if (!isAuthority && (activeTab === "predictions" || activeTab === "analytics")) {
      setActiveTab("complaints");
    }
  }, [isAuthority, activeTab]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      const matchesSearch = searchQuery === "" || 
        complaint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complaint_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complaint.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === "all" || complaint.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || complaint.status === statusFilter || 
        (statusFilter === "in-progress" && complaint.status === "in_progress");
      const matchesCategory = categoryFilter === "all" || complaint.category.toLowerCase() === categoryFilter;

      return matchesSearch && matchesPriority && matchesStatus && matchesCategory;
    });
  }, [complaints, searchQuery, priorityFilter, statusFilter, categoryFilter]);

  const mergedComplaints = useMemo(() => {
    const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 } as const;
    const map = new Map<string, DbComplaint & { reporterCount: number; mergedIds: string[] }>();

    for (const c of filteredComplaints) {
      const key = `${(c.description || '').trim().toLowerCase()}|${(c.location || '').trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, { ...c, reporterCount: 1, mergedIds: [c.id], media_urls: c.media_urls || [] });
      } else {
        const existing = map.get(key)!;
        // pick higher priority
        const betterPriority = priorityRank[c.priority] > priorityRank[existing.priority] ? c.priority : existing.priority;
        const mediaCombined = [...(existing.media_urls || []), ...(c.media_urls || [])];
        map.set(key, {
          ...existing,
          reporterCount: existing.reporterCount + 1,
          mergedIds: [...existing.mergedIds, c.id],
          priority: betterPriority,
          media_urls: mediaCombined,
        });
      }
    }
    return Array.from(map.values());
  }, [filteredComplaints]);

  const criticalComplaints = complaints.filter(c => c.priority === 'critical' && c.status !== 'resolved');

  const handleDownloadReport = () => {
    if (!selectedComplaint) return;

    const complaint = selectedComplaint;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;

    const valueOrDash = (value?: string | null) => {
      if (!value || value.trim() === "") return "—";
      return value;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Grievance Report", margin, y);
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    doc.setTextColor(0);
    y += 12;

    const rows: string[][] = [
      ["Grievance Code", complaint.complaint_id],
      ["Department", getDepartmentName(complaint.department_id) || "Unassigned"],
      ["Category", `${complaint.category}${complaint.sub_category ? ` / ${complaint.sub_category}` : ""}`],
      ["Priority", complaint.priority],
      ["Current Status", complaint.status.replace("_", " ")],
      ["Date of Receipt", new Date(complaint.created_at).toLocaleString()],
      ["Resolved At", complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString() : "Pending"],
      ["Location", valueOrDash(complaint.location)],
      ["Report Count", complaint.reporterCount ? complaint.reporterCount.toString() : "1"],
      ["Impact Prediction", valueOrDash(complaint.impact_prediction)],
      ["Description", valueOrDash(complaint.description)],
    ];

    if (complaint.media_urls && complaint.media_urls.length > 0) {
      rows.push(["Attachments", complaint.media_urls.join("\n")]);
    }

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: rows,
      startY: y + 8,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6, valign: "top" },
      headStyles: { fillColor: [27, 94, 166], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 130, fontStyle: "bold" },
        1: { cellWidth: "auto" },
      },
      tableLineColor: [220, 220, 220],
      tableLineWidth: 0.5,
    });

    doc.save(`complaint-${complaint.complaint_id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo size="sm" showText={true} className="text-foreground" />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isAuthority 
                ? "bg-accent/20 text-accent" 
                : "bg-muted/50 text-muted-foreground"
            }`}>
              {isAuthority ? "Authority Dashboard" : "Complaint Tracker"}
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            {isAuthority ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                <span className="text-xs font-medium text-accent">{departmentName || "Authority"}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={logout}
                >
                  <LogOut className="w-3 h-3" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/authority-login">
                <Button variant="secondary" size="sm" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Authority Login
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
            <Link to="/file-complaint">
              <Button variant="default" size="sm">
                <Plus className="w-4 h-4" />
                New Complaint
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Info banner removed per request */}

        {/* Sticky Navigation Bar */}
        <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border/50 -mx-4 px-4 mb-6 -mt-6 pt-4 pb-0">
          <div className="flex items-center gap-1 overflow-x-auto pb-4">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setActiveTab("complaints")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "complaints" 
                    ? "bg-accent text-accent-foreground" 
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Complaints
              </button>
              {isAuthority && (
                <button 
                  onClick={() => setActiveTab("predictions")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === "predictions" 
                      ? "bg-accent text-accent-foreground" 
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  AI Prediction
                </button>
              )}
              <button 
                onClick={() => setActiveTab("government")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "government" 
                    ? "bg-accent text-accent-foreground" 
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Govt Integration
              </button>
              {isAuthority && (
                <button 
                  onClick={() => setActiveTab("analytics")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === "analytics" 
                      ? "bg-accent text-accent-foreground" 
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
              <p className="text-muted-foreground">Loading complaints...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <StatsCards stats={stats} />
            </motion.div>

            {/* Critical Alert */}
            {isAuthority && criticalComplaints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-xl bg-priority-critical/10 border border-priority-critical/30 flex items-center gap-4"
              >
                <div className="p-2 rounded-full bg-priority-critical/20">
                  <AlertTriangle className="w-6 h-6 text-priority-critical animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-priority-critical">
                    {criticalComplaints.length} Critical Complaint{criticalComplaints.length > 1 ? 's' : ''} Require Immediate Attention
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    These issues have been flagged as emergencies based on urgency, impact, and sentiment analysis.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setPriorityFilter('critical')}
                >
                  View Critical
                </Button>
              </motion.div>
            )}

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted/50 p-1 flex-wrap hidden">
                <TabsTrigger value="complaints" className="gap-2 text-foreground data-[state=active]:text-foreground">
                  <LayoutDashboard className="w-4 h-4" />
                  Complaints ({complaints.length})
                </TabsTrigger>
                {isAuthority && (
                  <TabsTrigger value="predictions" className="gap-2 text-foreground data-[state=active]:text-foreground">
                    <Brain className="w-4 h-4" />
                    AI Predictions
                  </TabsTrigger>
                )}
                <TabsTrigger value="government" className="gap-2 text-foreground data-[state=active]:text-foreground">
                  <Building2 className="w-4 h-4" />
                  Govt. Integration
                </TabsTrigger>
                {isAuthority && (
                  <TabsTrigger value="analytics" className="gap-2 text-foreground data-[state=active]:text-foreground">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                )}
              </TabsList>

              <div id="complaints-section">
                <TabsContent value="complaints" className="space-y-6">
                {/* Filters */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-4 p-4 rounded-xl bg-card border border-border/50"
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID, text, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-border/50 bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[140px] border-border/50 bg-background text-foreground">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] border-border/50 bg-background text-foreground">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[160px] border-border/50 bg-background text-foreground">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="sanitation">Sanitation</SelectItem>
                      <SelectItem value="roads">Roads</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Complaints Grid */}
                {mergedComplaints.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mergedComplaints.map((complaint, index) => (
                      <motion.div
                        key={complaint.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <ComplaintCardReal 
                          complaint={complaint} 
                          onStatusChange={updateComplaintStatus}
                          getDepartmentName={getDepartmentName}
                          isAuthority={isAuthority}
                          onSelect={setSelectedComplaint}
                          reporterCount={(complaint as any).reporterCount}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">
                      {complaints.length === 0 
                        ? "No complaints yet. File the first one!" 
                        : "No complaints match your filters."}
                    </p>
                    {complaints.length === 0 && (
                      <Link to="/file-complaint">
                        <Button variant="default">
                          <Plus className="w-4 h-4" />
                          File a Complaint
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
                </TabsContent>
              </div>

              {isAuthority && (
                <div id="predictions-section">
                  <TabsContent value="predictions" className="space-y-6">
                    <AdvancedPredictions complaints={complaints} />
                  </TabsContent>
                </div>
              )}

              <div id="government-section">
                <TabsContent value="government" className="space-y-6">
                  <GovernmentIntegration />
                </TabsContent>
              </div>

              {isAuthority && (
                <div id="analytics-section">
                  <TabsContent value="analytics" className="space-y-6">
                    {complaints.length > 0 ? (
                      <>
                        {/* Top row - Trend and Priority Distribution */}
                        <div className="grid lg:grid-cols-2 gap-6">
                          <ComplaintsTrendChart complaints={complaints} />
                          <PriorityDistributionChart complaints={complaints} />
                        </div>

                        {/* Middle row - Category and Department */}
                        <div className="grid lg:grid-cols-2 gap-6">
                          <CategoryChart categoryBreakdown={stats.categoryBreakdown} />
                          <DepartmentPerformance departmentPerformance={stats.departmentPerformance as Record<string, { total: number; resolved: number; avgTime: number }>} />
                        </div>

                        {/* Bottom row - Location Heatmap (full width) */}
                        <div className="grid grid-cols-1 gap-6">
                          <LocationHeatmap complaints={complaints} />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No data yet. Submit some complaints to see analytics.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </div>
              )}
            </Tabs>
          </>
        )}
      </main>

      {/* Complaint Detail Modal */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-3xl">
          {selectedComplaint && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-3">
                  <span className="text-lg">{getDepartmentName(selectedComplaint.department_id) || 'Unassigned Department'}</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={handleDownloadReport}
                    >
                      <FileDown className="w-4 h-4" />
                      Download report
                    </Button>
                    <PriorityBadge priority={selectedComplaint.priority} score={selectedComplaint.priority_score || undefined} />
                    <StatusBadge status={selectedComplaint.status === 'in_progress' ? 'in-progress' : selectedComplaint.status} />
                  </div>
                </DialogTitle>
                <DialogDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{selectedComplaint.category}{selectedComplaint.sub_category ? ` · ${selectedComplaint.sub_category}` : ''}</span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">ID: {selectedComplaint.complaint_id}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Complaint</h4>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.impact_prediction && (
                <div className="p-3 rounded-lg bg-muted/60 border border-border/60 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-priority-high mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Impact Prediction</p>
                    <p className="text-sm text-muted-foreground">{selectedComplaint.impact_prediction}</p>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedComplaint.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(selectedComplaint.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {selectedComplaint.media_urls && selectedComplaint.media_urls.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Attachments</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedComplaint.media_urls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block">
                        <img 
                          src={url} 
                          alt={`Complaint attachment ${idx + 1}`} 
                          className="w-full h-28 object-cover rounded-lg border border-border/60 hover:border-accent transition"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
