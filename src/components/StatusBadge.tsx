import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Loader2, PackageCheck } from "lucide-react";

interface StatusBadgeProps {
  status: 'received' | 'assigned' | 'in-progress' | 'resolved';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  received: {
    label: 'Received',
    className: 'bg-muted text-muted-foreground border-muted',
    icon: Clock,
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-accent/20 text-accent border-accent/30',
    icon: PackageCheck,
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-priority-medium/20 text-priority-medium border-priority-medium/30',
    icon: Loader2,
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-priority-low/20 text-priority-low border-priority-low/30',
    icon: CheckCircle2,
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-1.5 gap-2',
};

const iconSizeConfig = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        config.className,
        sizeConfig[size]
      )}
    >
      <Icon 
        size={iconSizeConfig[size]} 
        className={status === 'in-progress' ? 'animate-spin' : ''} 
      />
      {config.label}
    </motion.span>
  );
}
