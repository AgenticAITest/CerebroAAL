import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { ChatMessage } from "@/components/ChatMessage";
import { MessageInput } from "@/components/MessageInput";
import { KBArticleCard } from "@/components/KBArticleCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Ticket } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebSocket } from "@/lib/websocket";

export default function ChatPage() {
  const [conversationId] = useState(() => {
    const stored = sessionStorage.getItem('cerebro-conversation-id');
    if (stored) return stored;
    const newId = Math.random().toString(36).substring(7);
    sessionStorage.setItem('cerebro-conversation-id', newId);
    return newId;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useWebSocket();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${conversationId}`],
  });

  const { data: kbResults } = useQuery({
    queryKey: [`/api/kb-suggestions/${conversationId}`],
  });

  const { data: currentTicket } = useQuery({
    queryKey: [`/api/conversation-ticket/${conversationId}`],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File }) => {
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      formData.append('content', content);
      if (file) {
        formData.append('file', file);
      }
      
      return await apiRequest('POST', '/api/send-message', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${conversationId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/kb-suggestions/${conversationId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/conversation-ticket/${conversationId}`] });
    },
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async (articleId: string) => {
      return await apiRequest('POST', '/api/mark-helpful', { conversationId, articleId });
    },
    onSuccess: () => {
      toast({
        title: "Great!",
        description: "I'll close this interaction. Let me know if you need anything else.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${conversationId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/kb-suggestions/${conversationId}`] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (content: string, file?: File) => {
    sendMessageMutation.mutate({ content, file });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <h1 className="text-xl font-semibold" data-testid="text-page-title">Cerebro AI Support</h1>
              <p className="text-xs text-muted-foreground">Intelligent troubleshooting assistant</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-20 w-full max-w-lg rounded-2xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-chart-1/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-chart-1" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Hi! I'm Cerebro</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  I'm here to help you troubleshoot issues. Just describe your problem, and I'll guide you through the solution or create a support ticket if needed.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {kbResults && kbResults.articles && kbResults.articles.length > 0 && (
                <div className="space-y-3">
                  {kbResults.articles.map((article: any) => (
                    <KBArticleCard
                      key={article.id}
                      article={article}
                      onHelpful={() => markHelpfulMutation.mutate(article.id)}
                    />
                  ))}
                </div>
              )}

              {kbResults && kbResults.similarTickets && kbResults.similarTickets.length > 0 && (
                <Card className="p-4 space-y-3">
                  <p className="text-sm font-medium">I found {kbResults.similarTickets.length} similar issues in past tickets:</p>
                  <div className="space-y-2">
                    {kbResults.similarTickets.map((ticket: any, index: number) => (
                      <div 
                        key={index}
                        className="p-3 bg-muted rounded-lg text-sm hover-elevate cursor-pointer"
                        data-testid={`similar-ticket-${index}`}
                      >
                        <span className="font-medium">{index + 1}.</span> {ticket.description}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Are any of these the same issue?</p>
                </Card>
              )}

              {currentTicket && (
                <Card className="p-4 bg-chart-1/5 border-chart-1/20">
                  <div className="flex items-start gap-3">
                    <Ticket className="w-5 h-5 text-chart-1 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        Ticket <span className="font-mono">#{currentTicket.ticketNumber}</span> created
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {currentTicket.status.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        I'll update you here when I get results.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSend={handleSendMessage}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
}
