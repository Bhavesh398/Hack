import { Complaint, clusterComplaints, getCategoryInfo } from "@/lib/grievanceAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Layers, AlertTriangle, MapPin, TrendingUp } from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";

interface ClusteredComplaintsProps {
  complaints: Complaint[];
}

export function ClusteredComplaints({ complaints }: ClusteredComplaintsProps) {
  const clusters = clusterComplaints(complaints.filter(c => c.status !== 'resolved'));
  const significantClusters = Array.from(clusters.entries())
    .filter(([_, items]) => items.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  if (significantClusters.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          Clustered Issues
          <Badge variant="secondary" className="ml-2">
            {significantClusters.length} clusters detected
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI has identified multiple complaints from the same area about similar issues
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {significantClusters.slice(0, 5).map(([clusterKey, items], index) => {
          const category = items[0].category;
          const location = items[0].location;
          const categoryInfo = getCategoryInfo(category);
          const highestPriority = items.reduce((max, item) => 
            item.priorityScore > max.priorityScore ? item : max
          , items[0]);
          const totalAffected = items.reduce((sum, item) => sum + item.estimatedAffected, 0);

          return (
            <motion.div
              key={clusterKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{categoryInfo.icon}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{categoryInfo.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {items.length} complaints
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </p>
                  </div>
                </div>
                <PriorityBadge priority={highestPriority.priority} size="sm" />
              </div>

              <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-priority-high" />
                  ~{totalAffected} people affected
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-priority-medium" />
                  Escalation likely if unresolved
                </span>
              </div>

              <div className="mt-2 p-2 rounded-lg bg-priority-high/5 border border-priority-high/20">
                <p className="text-xs text-priority-high font-medium">
                  ⚠️ Multiple reports indicate systemic issue requiring immediate attention
                </p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
