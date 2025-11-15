import { Badge } from "@/components/ui/badge";
import { TicketStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TicketStatus;
  size?: "sm" | "default";
}

const statusConfig = {
  new: {
    label: "New",
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
  log_analysis: {
    label: "Log Analysis",
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  },
  fix_applied: {
    label: "Fix Applied",
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  resolved: {
    label: "Resolved",
    className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new;
  
  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === "sm" && "text-xs px-2 py-0.5"
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
