import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryInfo, CATEGORIES } from "@/lib/grievanceAI";
import { motion } from "framer-motion";
import { PieChart } from "lucide-react";

interface CategoryChartProps {
  categoryBreakdown: Record<string, number>;
}

export function CategoryChart({ categoryBreakdown }: CategoryChartProps) {
  const total = Object.values(categoryBreakdown).reduce((sum, val) => sum + val, 0);
  const sortedCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1]);

  const colors = [
    'bg-primary',
    'bg-accent',
    'bg-priority-high',
    'bg-priority-medium',
    'bg-priority-low',
    'bg-muted-foreground',
  ];

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-accent" />
          Complaints by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedCategories.map(([category, count], index) => {
          const categoryInfo = getCategoryInfo(category);
          const isFallback = categoryInfo === CATEGORIES.administrative && category.toLowerCase() !== "administrative";
          const displayName = isFallback ? category : categoryInfo.name;
          const displayIcon = isFallback ? "📄" : categoryInfo.icon;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{displayIcon}</span>
                  <span className="font-medium">{displayName}</span>
                </div>
                <span className="text-muted-foreground">{count} ({percentage}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                  className={`h-full ${colors[index % colors.length]} rounded-full`}
                />
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
