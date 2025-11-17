import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageInputProps {
  onSend: (message: string, file?: File) => void;
  placeholder?: string;
  disabled?: boolean;
}

const QUICK_QUESTIONS = {
  "Scenario 1 - KB Solution": [
    "Hi, I can't generate the daily sales report.",
    "Sales App.",
    "Just now around 10:15 AM.",
    "Yes, that fixed it.",
  ],
  "Scenario 2 - Similar Ticket": [
    "The payroll summary isn't loading.",
    "Maybe #1.",
    "January 2025.",
    "Yes.",
    "It works now.",
  ],
  "Scenario 3 - No KB Match": [
    "The system logged me out 3 times in 10 minutes.",
    "Inventory App.",
    "Android.",
  ],
  "Scenario 4 - Ticket Status": [
    "Check ticket 48201.",
    "Yes, thanks.",
  ],
  "Scenario 5 - File Upload": [
    "My data import keeps failing.",
    "CSV.",
    "Not sure.",
    "It works now!",
  ],
  "Scenario 6 - Multi-step": [
    "My dashboard is showing 'No Data'.",
    "Operations Dashboard.",
    "No.",
    "Yes.",
  ],
  "Scenario 7 - IT Support": [
    "Sure, uploading.",
    "Yes.",
  ],
  "Scenario 8 - Onboarding": [
    "How do I import employees?",
    "Yes.",
  ],
  "Scenario 9 - Full Path": [
    "Every time I try to approve invoices, I get an error and it stops.",
    "Finance App.",
    "About 10 minutes ago.",
    "Yes, it says: APPROVAL_SERVICE_TIMEOUT.",
    "I just tried again. It works now — no error.",
  ],
};

export function MessageInput({ onSend, placeholder = "Type your message...", disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSend = () => {
    if (message.trim() || file) {
      onSend(message.trim(), file || undefined);
      setMessage("");
      setFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container max-w-3xl mx-auto p-4">
        {file && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 truncate">{file.name}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setFile(null)}
              data-testid="button-remove-file"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                disabled={disabled}
                data-testid="button-quick-questions"
                title="Quick demo questions"
              >
                <Zap className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
              <DropdownMenuLabel>Quick Demo Questions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(QUICK_QUESTIONS).map(([scenario, questions]) => (
                <div key={scenario}>
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                    {scenario}
                  </DropdownMenuLabel>
                  {questions.map((question, idx) => (
                    <DropdownMenuItem
                      key={`${scenario}-${idx}`}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-sm"
                      data-testid={`quick-question-${scenario}-${idx}`}
                    >
                      {question}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[44px] max-h-32 resize-none pr-10"
              data-testid="input-message"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={disabled}
              data-testid="button-attach-file"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Button
              size="icon"
              onClick={handleSend}
              disabled={disabled || (!message.trim() && !file)}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.csv,.xlsx"
          />
        </div>
      </div>
    </div>
  );
}
