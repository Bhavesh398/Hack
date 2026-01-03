import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComplaints, DbComplaint } from "@/hooks/useComplaints";
import { StatsCards } from "@/components/StatsCards";
import { CategoryChart } from "@/components/CategoryChart";
import { DepartmentPerformance } from "@/components/DepartmentPerformance";
import { GovernmentIntegration } from "@/components/GovernmentIntegration";
import { AdvancedPredictions } from "@/components/AdvancedPredictions";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
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
  Brain
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function ComplaintCardReal({ complaint, onStatusChange, getDepartmentName }: { 
  complaint: DbComplaint; 
  onStatusChange: (id: string, status: DbComplaint['status']) => void;
  getDepartmentName: (id: string | null) => string;
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
    <Card className="border-border/50 hover:border-accent/50 transition-all hover:shadow-lg bg-card group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{CATEGORY_ICONS[complaint.category] || '📋'}</span>
            <div>
              <p className="font-mono text-xs text-muted-foreground">{complaint.complaint_id}</p>
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
          {nextStatus && (
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { complaints, loading, stats, updateComplaintStatus, getDepartmentName, refetch } = useComplaints();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  const criticalComplaints = complaints.filter(c => c.priority === 'critical' && c.status !== 'resolved');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo size="sm" showText={true} className="text-foreground" />
            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
              Authority Dashboard
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
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
            {criticalComplaints.length > 0 && (
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
            <Tabs defaultValue="complaints" className="space-y-6">
              <TabsList className="bg-muted/50 p-1 flex-wrap">
                <TabsTrigger value="complaints" className="gap-2 text-foreground data-[state=active]:text-foreground">
                  <LayoutDashboard className="w-4 h-4" />
                  Complaints ({complaints.length})
                </TabsTrigger>
                <TabsTrigger value="predictions" className="gap-2 text-foreground data-[state=active]:text-foreground">
                  <Brain className="w-4 h-4" />
                  AI Predictions
                </TabsTrigger>
                <TabsTrigger value="government" className="gap-2 text-foreground data-[state=active]:text-foreground">
                  <Building2 className="w-4 h-4" />
                  Govt. Integration
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2 text-foreground data-[state=active]:text-foreground">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

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
                {filteredComplaints.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredComplaints.map((complaint, index) => (
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

              <TabsContent value="predictions" className="space-y-6">
                <AdvancedPredictions complaints={complaints} />
              </TabsContent>

              <TabsContent value="government" className="space-y-6">
                <GovernmentIntegration />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {complaints.length > 0 ? (
                  <div className="grid lg:grid-cols-2 gap-6">
                    <CategoryChart categoryBreakdown={stats.categoryBreakdown} />
                    <DepartmentPerformance departmentPerformance={stats.departmentPerformance as Record<string, { total: number; resolved: number; avgTime: number }>} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      No data yet. Submit some complaints to see analytics.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
