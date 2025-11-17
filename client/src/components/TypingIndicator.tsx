import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 py-4" data-testid="typing-indicator">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-chart-1/10">
        <Sparkles className="w-4 h-4 text-chart-1" />
      </div>

      <div className="flex flex-col gap-1 max-w-lg">
        <div className="rounded-2xl px-4 py-3 bg-card border border-card-border">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Cerebro is thinking</span>
            <div className="flex gap-1 ml-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
