import { Ticket } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

const severityConfig = {
  low: "bg-muted/50 text-muted-foreground border-muted-border",
  medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  return (
    <Card
      className="hover-elevate active-elevate-2 cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`card-ticket-${ticket.ticketNumber}`}
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-base" data-testid={`text-ticket-number-${ticket.ticketNumber}`}>
              #{ticket.ticketNumber}
            </span>
            <StatusBadge status={ticket.status as any} />
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm line-clamp-2">{ticket.description}</p>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {ticket.application}
          </Badge>
          
          <Badge 
            variant="outline" 
            className={severityConfig[ticket.severity as keyof typeof severityConfig]}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            {ticket.severity}
          </Badge>
          
          {ticket.errorCode && (
            <Badge variant="outline" className="text-xs font-mono">
              {ticket.errorCode}
            </Badge>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          User: {ticket.userName}
        </div>
      </CardContent>
    </Card>
  );
}
