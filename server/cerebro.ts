import { storage } from "./storage";
import type { Message } from "@shared/schema";

// Scripted AI logic following demo scenarios
export class CerebroAI {
  private conversationState: Map<string, ConversationState>;
  private conversationHistory: Map<string, string[]>;

  constructor() {
    this.conversationState = new Map();
    this.conversationHistory = new Map();
  }

  async processMessage(conversationId: string, userMessage: string, file?: any): Promise<string> {
    const state = this.getState(conversationId);
    const messages = await storage.getMessages(conversationId);
    
    // Store user message in history
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    this.conversationHistory.get(conversationId)!.push(userMessage);
    
    // Detect keywords and context
    const lowerMsg = userMessage.toLowerCase();

    // Handle ticket status check
    if (lowerMsg.includes("check ticket") || lowerMsg.includes("ticket status")) {
      const ticketMatch = userMessage.match(/#?(\d+)/);
      if (ticketMatch) {
        return this.handleTicketStatusCheck(ticketMatch[1]);
      }
    }

    // First interaction - ask for application
    if (messages.length <= 1 && !state.application) {
      return this.detectAndAskForApplication(userMessage, state);
    }

    // If we have application but no time yet
    if (state.application && !state.timeOccurred) {
      if (this.looksLikeTimeResponse(userMessage)) {
        state.timeOccurred = userMessage;
        state.step = "analyzing";
        return this.analyzeAndRespond(state);
      } else if (this.looksLikeApplicationName(userMessage)) {
        state.application = userMessage;
        return "Understood. When did the issue occur?";
      }
    }

    // Check for affirmative responses
    if (this.isAffirmative(userMessage)) {
      if (state.waitingForConfirmation) {
        return this.handleConfirmation(conversationId, state);
      }
    }

    // Default: ask for application if we don't have it
    if (!state.application) {
      return "Sure, I can help. Which application were you using when this happened?";
    }

    // If we're past initial questions, analyze
    return this.analyzeAndRespond(state);
  }

  private getState(conversationId: string): ConversationState {
    if (!this.conversationState.has(conversationId)) {
      this.conversationState.set(conversationId, {
        step: "initial",
      });
    }
    return this.conversationState.get(conversationId)!;
  }

  private detectAndAskForApplication(message: string, state: ConversationState): string {
    const appKeywords = {
      "Sales App": ["sales", "report", "revenue"],
      "Finance App": ["invoice", "payment", "approval", "finance"],
      "Inventory App": ["inventory", "stock", "logged out", "session"],
      "Payroll App": ["payroll", "summary", "salary"],
      "HR App": ["employee", "hr", "import"],
    };

    for (const [app, keywords] of Object.entries(appKeywords)) {
      if (keywords.some((kw) => message.toLowerCase().includes(kw))) {
        state.application = app;
        return `Got it, ${app}. When did this start happening?`;
      }
    }

    return "Sure, I can help. Which application were you using when this happened?";
  }

  private async analyzeAndRespond(state: ConversationState): Promise<string> {
    if (!state.application) {
      return "Which application are you using?";
    }

    // Try to find KB article
    const articles = await storage.searchKB("", state.application);
    
    if (articles.length > 0) {
      state.foundKBArticle = articles[0];
      state.waitingForConfirmation = "kb_helpful";
      return ""; // KB article will be shown separately
    }

    // If no KB match, indicate we'll create a ticket
    state.willCreateTicket = true;
    return "Thanks. I couldn't find a matching article in the knowledge base, so I'll log a ticket for investigation.";
  }

  private async handleTicketStatusCheck(ticketNumber: string): Promise<string> {
    const tickets = await storage.getTickets();
    const ticket = tickets.find((t) => t.ticketNumber.toString() === ticketNumber);
    
    if (!ticket) {
      return `I couldn't find ticket #${ticketNumber}. Please check the ticket number.`;
    }

    const analysis = await storage.getLogAnalysisByTicketId(ticket.id);

    if (ticket.status === "resolved") {
      return `Latest update on ticket #${ticketNumber}:\n- Fix Applied\n- Status: Resolved\n\nIs the issue fixed on your side?`;
    }

    if (ticket.status === "fix_applied" && analysis) {
      return `Latest update on ticket #${ticketNumber}:\n- Log Analysis Completed\n- Fix Applied\n- Root Cause: ${analysis.rootCause}\n- Applied at: ${new Date().toLocaleTimeString()}\n\nIs the issue fixed on your side?`;
    }

    return `Ticket #${ticketNumber} status: ${ticket.status.replace("_", " ")}`;
  }

  private handleConfirmation(conversationId: string, state: ConversationState): string {
    if (state.waitingForConfirmation === "kb_helpful") {
      return "Great! I'll close this interaction. Let me know if you need anything else.";
    }
    return "Glad to hear it! Let me know if you need help with anything else.";
  }

  private isAffirmative(msg: string): boolean {
    const affirmatives = ["yes", "yeah", "yep", "sure", "works", "fixed", "solved", "ok", "okay"];
    return affirmatives.some((word) => msg.toLowerCase().includes(word));
  }

  private looksLikeTimeResponse(msg: string): boolean {
    return (
      msg.toLowerCase().includes("now") ||
      msg.toLowerCase().includes("ago") ||
      msg.toLowerCase().includes("am") ||
      msg.toLowerCase().includes("pm") ||
      msg.toLowerCase().includes("minute") ||
      msg.toLowerCase().includes("today")
    );
  }

  private looksLikeApplicationName(msg: string): boolean {
    const apps = ["sales", "finance", "inventory", "payroll", "hr", "app"];
    return apps.some((app) => msg.toLowerCase().includes(app));
  }

  async shouldShowKB(conversationId: string): Promise<any> {
    const state = this.getState(conversationId);
    if (state.foundKBArticle) {
      return { articles: [state.foundKBArticle] };
    }
    return null;
  }

  async shouldCreateTicket(conversationId: string, userId: string, userName: string): Promise<any> {
    const state = this.getState(conversationId);
    const messages = await storage.getMessages(conversationId);
    
    // Create ticket if we've determined KB can't help
    if (state.willCreateTicket && !state.ticketCreated) {
      const userMessages = messages.filter((m) => m.role === "user");
      const description = userMessages.map((m) => m.content).join(" ");

      const ticket = await storage.createTicket({
        userId,
        userName,
        application: state.application || "Unknown",
        description: description.substring(0, 500),
        status: "new",
        severity: "medium",
      });

      storage.linkConversationToTicket(conversationId, ticket.id);
      state.ticketCreated = true;

      // Simulate AAL analysis after a moment
      setTimeout(async () => {
        await this.simulateAALAnalysis(ticket.id, state.application!);
        await storage.updateTicketStatus(ticket.id, "log_analysis");
      }, 2000);

      return ticket;
    }

    return null;
  }

  private async simulateAALAnalysis(ticketId: string, application: string) {
    // Scripted AAL analysis based on application
    const analyses: Record<string, any> = {
      "Finance App": {
        errorPattern: "APPROVAL_SERVICE_TIMEOUT",
        rootCause: "Misconfigured connection string to approval-db after deployment of approval-service v1.3.7",
        suggestedFix: "Rollback approval-service to v1.3.6 or update the connection string configuration for approval-db",
        logExcerpt: `[2025-11-15 10:15:23] ERROR approval-service: Connection refused to approval-db:5432
[2025-11-15 10:15:23] ERROR approval-service: Timeout waiting for DB response
[2025-11-15 10:15:24] WARN  approval-service: Retrying connection... (attempt 1/3)
[2025-11-15 10:15:28] ERROR approval-service: APPROVAL_SERVICE_TIMEOUT`,
        correlatedEvent: "Deployment of approval-service v1.3.7 at 10:00 AM",
      },
      "Inventory App": {
        errorPattern: "SESSION_TIMEOUT on Android clients",
        rootCause: "Session timeout misconfiguration for Android clients in the authentication service",
        suggestedFix: "Update session timeout configuration for mobile clients from 5 minutes to 30 minutes",
        logExcerpt: `[2025-11-15 10:10:15] WARN  auth-service: Session expired for user android-client-123
[2025-11-15 10:12:32] WARN  auth-service: Session expired for user android-client-123
[2025-11-15 10:15:41] WARN  auth-service: Session expired for user android-client-123`,
        correlatedEvent: "Recent authentication service update deployed 2 days ago",
      },
    };

    const analysisData =
      analyses[application] ||
      analyses["Finance App"]; // Default to Finance App scenario

    await storage.createLogAnalysis({
      ticketId,
      ...analysisData,
    });
  }
}

interface ConversationState {
  step: string;
  application?: string;
  timeOccurred?: string;
  foundKBArticle?: any;
  waitingForConfirmation?: string;
  willCreateTicket?: boolean;
  ticketCreated?: boolean;
}

export const cerebroAI = new CerebroAI();
