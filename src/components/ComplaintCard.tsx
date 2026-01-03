import { Complaint, getCategoryInfo } from "@/lib/grievanceAI";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, AlertTriangle, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ComplaintCardProps {
  complaint: Complaint;
  onClick?: () => void;
  compact?: boolean;
}

export function ComplaintCard({ complaint, onClick, compact = false }: ComplaintCardProps) {
  const categoryInfo = getCategoryInfo(complaint.category);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden"
        onClick={onClick}
      >
        <div className={`h-1 ${
          complaint.priority === 'critical' ? 'bg-priority-critical' :
          complaint.priority === 'high' ? 'bg-priority-high' :
          complaint.priority === 'medium' ? 'bg-priority-medium' :
          'bg-priority-low'
        }`} />
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{categoryInfo.icon}</span>
              <div>
                <p className="font-semibold text-sm text-foreground">{categoryInfo.name}</p>
                <p className="text-xs text-muted-foreground">{complaint.subCategory}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <PriorityBadge priority={complaint.priority} score={complaint.priorityScore} showScore size="sm" />
              <StatusBadge status={complaint.status} size="sm" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className={`text-sm text-foreground/90 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {complaint.text}
          </p>
          
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {complaint.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(complaint.submittedAt, { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              ~{complaint.estimatedAffected} affected
            </span>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Building2 className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">{complaint.department}</span>
          </div>
          
          {!compact && complaint.impactPrediction && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/30">
              <AlertTriangle className="w-4 h-4 text-priority-high flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{complaint.impactPrediction}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              ID: {complaint.id}
            </span>
            {complaint.urgencyKeywords.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {complaint.urgencyKeywords.slice(0, 3).map(kw => (
                  <span key={kw} className="text-[10px] bg-priority-high/10 text-priority-high px-1.5 py-0.5 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
