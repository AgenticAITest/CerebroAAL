import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zap } from "lucide-react";

interface RequestInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (message: string) => void;
  isPending?: boolean;
}

const QUICK_IT_QUESTIONS = [
  "Hi, can you share your latest SKU export file so we can verify mappings?",
  "Can you provide the exact steps you took before the error occurred?",
  "What time did you first notice this issue?",
  "Please share screenshots of the error message if possible.",
];

export function RequestInfoDialog({ open, onOpenChange, onSend, isPending }: RequestInfoDialogProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request More Information</DialogTitle>
          <DialogDescription>
            Send a message to the user requesting additional information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  data-testid="button-quick-it-questions"
                >
                  <Zap className="w-3 h-3 mr-2" />
                  Quick Fill
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel>Common Requests</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {QUICK_IT_QUESTIONS.map((question, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => setMessage(question)}
                    className="text-sm"
                    data-testid={`quick-it-question-${idx}`}
                  >
                    {question}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question or request..."
            className="min-h-[120px]"
            disabled={isPending}
            data-testid="input-it-message"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isPending || !message.trim()}
            data-testid="button-send-request"
          >
            {isPending ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
