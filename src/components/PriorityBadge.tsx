import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PriorityBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const priorityConfig = {
  critical: {
    label: 'CRITICAL',
    className: 'bg-priority-critical text-primary-foreground',
    pulseColor: 'hsl(var(--priority-critical))',
  },
  high: {
    label: 'HIGH',
    className: 'bg-priority-high text-primary-foreground',
    pulseColor: 'hsl(var(--priority-high))',
  },
  medium: {
    label: 'MEDIUM',
    className: 'bg-priority-medium text-foreground',
    pulseColor: 'hsl(var(--priority-medium))',
  },
  low: {
    label: 'LOW',
    className: 'bg-priority-low text-primary-foreground',
    pulseColor: 'hsl(var(--priority-low))',
  },
};

const sizeConfig = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-3 py-1',
  lg: 'text-sm px-4 py-1.5',
};

export function PriorityBadge({ 
  priority, 
  score, 
  showScore = false,
  size = 'md',
  animated = true 
}: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <motion.span
      initial={animated ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full",
        config.className,
        sizeConfig[size],
        priority === 'critical' && animated && 'animate-pulse-slow'
      )}
    >
      {priority === 'critical' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground"></span>
        </span>
      )}
      {config.label}
      {showScore && score !== undefined && (
        <span className="opacity-80 font-medium">({score})</span>
      )}
    </motion.span>
  );
}
