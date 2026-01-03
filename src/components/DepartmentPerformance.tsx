import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DepartmentPerformanceProps {
  departmentPerformance: Record<string, { total: number; resolved: number; avgTime: number }>;
}

export function DepartmentPerformance({ departmentPerformance }: DepartmentPerformanceProps) {
  const sortedDepartments = Object.entries(departmentPerformance)
    .sort((a, b) => b[1].total - a[1].total);

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-accent" />
          Department Performance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track resolution rates and identify departments that need attention
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedDepartments.map(([department, data], index) => {
          const resolutionRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
          const isLow = resolutionRate < 50;

          return (
            <motion.div
              key={department}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border transition-colors ${
                isLow 
                  ? 'bg-priority-high/5 border-priority-high/20' 
                  : 'bg-muted/30 border-border/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{department}</h4>
                  <p className="text-xs text-muted-foreground">
                    {data.total} total complaints
                  </p>
                </div>
                {isLow && (
                  <span className="flex items-center gap-1 text-xs text-priority-high font-medium">
                    <AlertTriangle className="w-3 h-3" />
                    Needs attention
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Resolution Rate</span>
                  <span className={`font-medium ${isLow ? 'text-priority-high' : 'text-priority-low'}`}>
                    {resolutionRate}%
                  </span>
                </div>
                <Progress 
                  value={resolutionRate} 
                  className={`h-2 ${isLow ? '[&>div]:bg-priority-high' : '[&>div]:bg-priority-low'}`} 
                />
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-priority-low" />
                  {data.resolved} resolved
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-priority-medium" />
                  {data.total - data.resolved} pending
                </span>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
