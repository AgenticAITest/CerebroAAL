import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ticket, LogAnalysis, Message } from "@shared/schema";
import { TicketCard } from "@/components/TicketCard";
import { AALAnalysis } from "@/components/AALAnalysis";
import { ChatMessage } from "@/components/ChatMessage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Search, Ticket as TicketIcon, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { useWebSocket } from "@/lib/websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SupportDashboard() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showOnlyScriptedTickets, setShowOnlyScriptedTickets] = useState(true);
  const { toast } = useToast();
  
  useWebSocket();

  const { data: allTickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
  });

  // Filter to show only scripted tickets (#48201 and #48320) by default
  const tickets = showOnlyScriptedTickets 
    ? allTickets.filter(t => t.ticketNumber === 48201 || t.ticketNumber === 48320)
    : allTickets;

  const { data: selectedTicket } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${selectedTicketId}`],
    enabled: !!selectedTicketId,
  });

  const { data: ticketMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/ticket-messages/${selectedTicketId}`],
    enabled: !!selectedTicketId,
  });

  const { data: ticketAnalysis } = useQuery<LogAnalysis>({
    queryKey: [`/api/ticket-analysis/${selectedTicketId}`],
    enabled: !!selectedTicketId,
  });

  const applyFixMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return await apiRequest('PATCH', `/api/tickets/${ticketId}/status`, { status: 'fix_applied' });
    },
    onSuccess: () => {
      toast({
        title: "Fix Applied",
        description: "The suggested fix has been applied successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      if (selectedTicketId) {
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${selectedTicketId}`] });
      }
    },
  });

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toString().includes(searchQuery) ||
      ticket.application.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-sidebar">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <h1 className="font-semibold text-sidebar-foreground" data-testid="text-dashboard-title">IT Support</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => setStatusFilter("all")}
            data-active={statusFilter === "all"}
            data-testid="button-filter-all"
          >
            <TicketIcon className="w-4 h-4" />
            <span>All Tickets</span>
            <Badge variant="secondary" className="ml-auto">
              {tickets.length}
            </Badge>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => setStatusFilter("new")}
            data-active={statusFilter === "new"}
            data-testid="button-filter-new"
          >
            <span className="w-2 h-2 rounded-full bg-chart-4" />
            <span>New</span>
            <Badge variant="secondary" className="ml-auto">
              {tickets.filter(t => t.status === "new").length}
            </Badge>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => setStatusFilter("in_progress")}
            data-active={statusFilter === "in_progress"}
            data-testid="button-filter-in-progress"
          >
            <span className="w-2 h-2 rounded-full bg-chart-1" />
            <span>In Progress</span>
            <Badge variant="secondary" className="ml-auto">
              {tickets.filter(t => t.status === "in_progress").length}
            </Badge>
          </Button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="border-b border-border p-4">
          <div className="flex items-center gap-4">
            {selectedTicketId && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedTicketId(null)}
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setShowOnlyScriptedTickets(true);
                setSearchQuery("");
                setStatusFilter("all");
                setSelectedTicketId(null);
                toast({
                  title: "Dashboard Reset",
                  description: "Showing scripted tickets (#48201, #48320)",
                });
              }}
              data-testid="button-clear"
            >
              Clear
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {selectedTicketId && selectedTicket ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              <ScrollArea className="border-r border-border">
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-2xl font-semibold font-mono">
                        #{selectedTicket.ticketNumber}
                      </h2>
                      <StatusBadge status={selectedTicket.status as any} size="default" />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">User:</span>
                        <span className="font-medium">{selectedTicket.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Application:</span>
                        <Badge variant="secondary">{selectedTicket.application}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}</span>
                      </div>
                      {selectedTicket.errorCode && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Error Code:</span>
                          <Badge variant="outline" className="font-mono">{selectedTicket.errorCode}</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedTicket.description}</p>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Conversation History</h3>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        {ticketMessages.length > 0 ? (
                          ticketMessages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No conversation history
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>

              <ScrollArea>
                <div className="p-6 space-y-6">
                  {ticketAnalysis ? (
                    <AALAnalysis analysis={ticketAnalysis} />
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          Log analysis in progress...
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        className="w-full" 
                        data-testid="button-apply-fix"
                        onClick={() => selectedTicketId && applyFixMutation.mutate(selectedTicketId)}
                        disabled={applyFixMutation.isPending || selectedTicket?.status === 'fix_applied' || selectedTicket?.status === 'resolved'}
                      >
                        {applyFixMutation.isPending ? "Applying..." : "Apply Suggested Fix"}
                      </Button>
                      <Button variant="outline" className="w-full" data-testid="button-request-info">
                        Request More Information
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {isLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-lg" />
                    ))}
                  </>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <TicketIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tickets found</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => setSelectedTicketId(ticket.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
