import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { cerebroAI } from "./cerebro";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  // Broadcast helper
  function broadcastTicketUpdate(ticketId: string) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "ticket_update", ticketId }));
      }
    });
  }

  // === Message & Chat Routes ===

  // Get messages for a conversation
  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send a message
  app.post("/api/send-message", upload.single("file"), async (req, res) => {
    try {
      const { conversationId, content } = req.body;
      const file = req.file;

      console.log("Received message:", { conversationId, content, hasFile: !!file });

      if (!conversationId || !content) {
        return res.status(400).json({ error: "Missing conversationId or content" });
      }

      // Store user message
      await storage.createMessage({
        conversationId,
        role: "user",
        content,
        ticketId: null,
      });

      console.log("Calling cerebroAI.processMessage");
      // Get AI response
      const aiResponse = await cerebroAI.processMessage(
        conversationId,
        content,
        file
      );
      console.log("AI response:", aiResponse);

      // Store AI response if there is one
      if (aiResponse) {
        await storage.createMessage({
          conversationId,
          role: "cerebro",
          content: aiResponse,
          ticketId: null,
        });
      }

      // Check if we should create a ticket
      const ticket = await cerebroAI.shouldCreateTicket(
        conversationId,
        "demo-user",
        "Demo User"
      );

      if (ticket) {
        // Create system message about ticket
        await storage.createMessage({
          conversationId,
          role: "system",
          content: `Ticket #${ticket.ticketNumber} created - Status: ${ticket.status.replace("_", " ")}`,
          ticketId: ticket.id,
        });

        broadcastTicketUpdate(ticket.id);
      }

      // Broadcast message update
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "message_update", conversationId }));
        }
      });

      // Return all messages for this conversation
      const allMessages = await storage.getMessages(conversationId);
      res.json({ success: true, messages: allMessages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get KB suggestions for conversation
  app.get("/api/kb-suggestions/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const suggestions = await cerebroAI.shouldShowKB(conversationId);
      res.json(suggestions || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark KB article as helpful
  app.post("/api/mark-helpful", async (req, res) => {
    try {
      const { conversationId, articleId } = req.body;

      // Create success message
      await storage.createMessage({
        conversationId,
        role: "system",
        content: "Issue resolved! Closing this interaction.",
        ticketId: null,
      });

      // Check if there's a linked ticket and resolve it
      const ticket = await storage.getTicketByConversationId(conversationId);
      if (ticket) {
        await storage.updateTicketStatus(ticket.id, "resolved");
        broadcastTicketUpdate(ticket.id);
      }

      // Broadcast message update
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "message_update", conversationId }));
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get ticket for conversation
  app.get("/api/conversation-ticket/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const ticket = await storage.getTicketByConversationId(conversationId);
      res.json(ticket || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === Ticket Routes ===

  // Get all tickets
  app.get("/api/tickets", async (_req, res) => {
    try {
      const tickets = await storage.getTickets();
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single ticket
  app.get("/api/tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get messages for a ticket
  app.get("/api/ticket-messages/:ticketId", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const messages = await storage.getTicketMessages(ticketId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get AAL analysis for a ticket
  app.get("/api/ticket-analysis/:ticketId", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const analysis = await storage.getLogAnalysisByTicketId(ticketId);
      res.json(analysis || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Send technician message to ticket
  app.post("/api/tickets/:ticketId/message", async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { content, technicianName } = req.body;

      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Get conversation ID from ticket
      const conversationId = await storage.getConversationIdByTicket(ticketId);
      
      if (conversationId) {
        // Create technician message in the conversation
        await storage.createMessage({
          conversationId,
          role: "technician",
          content: `**${technicianName || "IT Support"}:** ${content}`,
          ticketId,
        });

        // Broadcast message update
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "message_update", conversationId }));
          }
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update ticket status
  app.patch("/api/tickets/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const ticket = await storage.updateTicketStatus(id, status);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      broadcastTicketUpdate(id);
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search KB articles
  app.get("/api/kb/search", async (req, res) => {
    try {
      const { q, app } = req.query;
      const articles = await storage.searchKB(
        (q as string) || "",
        app as string | undefined
      );
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Find similar tickets
  app.post("/api/tickets/similar", async (req, res) => {
    try {
      const { description } = req.body;
      const similar = await storage.findSimilarTickets(description);
      res.json(similar);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download converted CSV file (demo)
  app.get("/api/download-converted-file", (req, res) => {
    // Generate a simple dummy CSV file
    const csvContent = `Name,Email,Department,Start Date
John Doe,john.doe@example.com,Engineering,2025-01-15
Jane Smith,jane.smith@example.com,Marketing,2025-02-01
Bob Johnson,bob.johnson@example.com,Sales,2025-02-10`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="converted_utf8.csv"');
    res.send(csvContent);
  });

  return httpServer;
}
