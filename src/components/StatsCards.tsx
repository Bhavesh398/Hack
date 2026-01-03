import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Users, Zap } from "lucide-react";

interface StatsCardsProps {
  stats: {
    total: number;
    resolved: number;
    pending: number;
    critical: number;
    high: number;
    avgResolutionTime: number;
    resolutionRate: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Complaints",
      value: stats.total,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-priority-medium",
      bgColor: "bg-priority-medium/10",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle2,
      color: "text-priority-low",
      bgColor: "bg-priority-low/10",
    },
    {
      title: "Critical",
      value: stats.critical,
      icon: AlertTriangle,
      color: "text-priority-critical",
      bgColor: "bg-priority-critical/10",
      pulse: stats.critical > 0,
    },
    {
      title: "High Priority",
      value: stats.high,
      icon: Zap,
      color: "text-priority-high",
      bgColor: "bg-priority-high/10",
    },
    {
      title: "Resolution Rate",
      value: `${stats.resolutionRate}%`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`border-border/50 hover:shadow-lg transition-all duration-300 ${card.pulse ? 'animate-pulse-slow' : ''}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.title}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
