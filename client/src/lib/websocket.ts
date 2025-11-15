import { useEffect, useRef } from "react";
import { queryClient } from "./queryClient";

export function useWebSocket(onMessage?: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Invalidate queries based on update type
        if (data.type === "ticket_update") {
          queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
          queryClient.invalidateQueries({ queryKey: [`/api/tickets/${data.ticketId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/ticket-analysis/${data.ticketId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/ticket-messages/${data.ticketId}`] });
        }

        if (data.type === "message_update") {
          queryClient.invalidateQueries({ queryKey: [`/api/messages/${data.conversationId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/kb-suggestions/${data.conversationId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/conversation-ticket/${data.conversationId}`] });
        }

        if (onMessage) {
          onMessage(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onMessage]);

  return wsRef;
}
