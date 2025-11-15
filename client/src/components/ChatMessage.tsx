import { Message } from "@shared/schema";
import { User, Sparkles, Wrench, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  onActionClick?: (action: string, data?: any) => void;
}

export function ChatMessage({ message, onActionClick }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isCerebro = message.role === "cerebro";
  const isSystem = message.role === "system";
  const isTechnician = message.role === "technician";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2" data-testid={`message-${message.id}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
          <Info className="w-3 h-3" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 py-4",
        isUser && "flex-row-reverse"
      )}
      data-testid={`message-${message.id}`}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser && "bg-primary/10",
        isCerebro && "bg-chart-1/10",
        isTechnician && "bg-chart-2/10"
      )}>
        {isUser && <User className="w-4 h-4 text-primary" />}
        {isCerebro && <Sparkles className="w-4 h-4 text-chart-1" />}
        {isTechnician && <Wrench className="w-4 h-4 text-chart-2" />}
      </div>

      <div className={cn(
        "flex flex-col gap-1 max-w-lg",
        isUser && "items-end"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser && "bg-primary text-primary-foreground",
          isCerebro && "bg-card border border-card-border",
          isTechnician && "bg-muted border border-muted-border"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        
        <span className="text-xs text-muted-foreground px-2">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
