import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string, file?: File) => void;
  placeholder?: string;
  disabled?: boolean;
}

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
