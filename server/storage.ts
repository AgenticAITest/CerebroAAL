import {
  type Ticket,
  type InsertTicket,
  type Message,
  type InsertMessage,
  type KBArticle,
  type InsertKBArticle,
  type LogAnalysis,
  type InsertLogAnalysis,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Tickets
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicket(id: string): Promise<Ticket | undefined>;
  getTickets(): Promise<Ticket[]>;
  updateTicketStatus(id: string, status: string): Promise<Ticket | undefined>;
  getTicketByConversationId(conversationId: string): Promise<Ticket | undefined>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(conversationId: string): Promise<Message[]>;
  getTicketMessages(ticketId: string): Promise<Message[]>;

  // KB Articles
  searchKB(query: string, application?: string): Promise<KBArticle[]>;
  getKBArticle(id: string): Promise<KBArticle | undefined>;

  // Log Analysis
  createLogAnalysis(analysis: InsertLogAnalysis): Promise<LogAnalysis>;
  getLogAnalysisByTicketId(ticketId: string): Promise<LogAnalysis | undefined>;

  // Similar tickets
  findSimilarTickets(description: string): Promise<Ticket[]>;
}

export class MemStorage implements IStorage {
  private tickets: Map<string, Ticket>;
  private messages: Map<string, Message>;
  private kbArticles: Map<string, KBArticle>;
  private logAnalyses: Map<string, LogAnalysis>;
  private conversationToTicket: Map<string, string>;
  private ticketCounter: number;

  constructor() {
    this.tickets = new Map();
    this.messages = new Map();
    this.kbArticles = new Map();
    this.logAnalyses = new Map();
    this.conversationToTicket = new Map();
    this.ticketCounter = 48200;

    this.seedKBArticles();
    this.seedDemoTickets();
  }

  private seedKBArticles() {
    const articles: InsertKBArticle[] = [
      {
        title: "Daily Sales Report fails with Error 1203",
        application: "Sales App",
        problem: "Cannot generate daily sales report",
        cause: "Yesterday's data sync is incomplete",
        solution: "Force a manual data sync to complete the missing data",
        steps: [
          "Go to Admin → Sync Status",
          "Tap Force Sync",
          "Wait 1 minute and retry generating the report",
        ],
      },
      {
        title: "Payroll summary blank - missing period settings",
        application: "Payroll App",
        problem: "Payroll summary isn't loading or shows blank",
        cause: "The payroll period hasn't been created yet",
        solution: "Create the missing payroll period",
        steps: [
          "Go to Payroll Settings",
          "Click Create Period",
          "Choose the appropriate month/year",
          "Save and refresh the summary",
        ],
      },
      {
        title: "Data import fails - CSV encoding issue",
        application: "Data Import",
        problem: "CSV import keeps failing",
        cause: "CSV file is not UTF-8 encoded",
        solution: "Convert the file to UTF-8 encoding",
        steps: [
          "Open your CSV in a text editor",
          "Save As and select UTF-8 encoding",
          "Retry the import with the converted file",
        ],
      },
      {
        title: "Invoice Approval Timeout after deployment",
        application: "Finance App",
        problem: "Invoice approval fails with APPROVAL_SERVICE_TIMEOUT",
        cause: "Misconfigured database connection after deployment",
        solution: "Verify and fix the connection string configuration",
        steps: [
          "Check approval-service configuration",
          "Verify approval-db connection string",
          "Restart the service if needed",
        ],
      },
      {
        title: "Employee Import Guide",
        application: "HR App",
        problem: "How to import employees from CSV file",
        cause: "User needs guidance on importing employee data",
        solution: "Follow the employee import process step by step",
        steps: [
          "Go to HR → Employees",
          "Click Import Employees",
          "Download the Template CSV",
          "Fill it in with employee data (name, email, department, start date)",
          "Upload the completed CSV file",
          "Review the preview and confirm import",
        ],
      },
      {
        title: "Operations Dashboard - No Data Showing",
        application: "Operations Dashboard",
        problem: "Dashboard shows no data or blank charts",
        cause: "ETL job failure or data pipeline issue",
        solution: "Check ETL job status and data source configuration",
        steps: [
          "Go to Admin → Data Pipeline Status",
          "Check recent ETL job logs",
          "Verify data source connection settings",
          "Retry the ETL job if it failed",
          "Contact data team if issue persists",
        ],
      },
      {
        title: "Session Timeout on Mobile Devices",
        application: "Inventory App",
        problem: "Getting logged out frequently on mobile",
        cause: "Session timeout configuration issue for mobile clients",
        solution: "Update session timeout settings for mobile app",
        steps: [
          "Contact IT Support to update session timeout",
          "Clear app cache and data",
          "Log out and log back in",
          "Verify the issue is resolved",
        ],
      },
    ];

    articles.forEach((article) => {
      const id = randomUUID();
      this.kbArticles.set(id, { ...article, id });
    });
  }

  private seedDemoTickets() {
    // Create some past similar tickets for demonstration
    const demoTickets: InsertTicket[] = [
      {
        userId: "user-demo-1",
        userName: "Jane Smith",
        application: "Inventory App",
        description: "System logged me out 3 times in 10 minutes on Android",
        errorCode: "SESSION_TIMEOUT",
        status: "resolved",
        severity: "medium",
      },
      {
        userId: "user-demo-2",
        userName: "Bob Johnson",
        application: "Payroll App",
        description: "Payroll summary blank - missing period settings",
        status: "resolved",
        severity: "low",
      },
      {
        userId: "user-demo-3",
        userName: "Alice Wong",
        application: "Payroll App",
        description: "Payroll summary stuck loading - client cache issue",
        status: "resolved",
        severity: "low",
      },
      {
        userId: "user-demo-4",
        userName: "Carlos Martinez",
        application: "Payroll App",
        description: "Payroll summary error 503 - server outage",
        status: "resolved",
        severity: "high",
      },
    ];

    demoTickets.forEach((ticket) => {
      this.createTicket(ticket);
    });
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = randomUUID();
    const ticketNumber = ++this.ticketCounter;
    const ticket: Ticket = {
      ...insertTicket,
      id,
      ticketNumber,
      status: insertTicket.status || "new",
      errorCode: insertTicket.errorCode ?? null,
      severity: insertTicket.severity || "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateTicketStatus(id: string, status: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (ticket) {
      ticket.status = status;
      ticket.updatedAt = new Date();
      this.tickets.set(id, ticket);
      return ticket;
    }
    return undefined;
  }

  async getTicketByConversationId(conversationId: string): Promise<Ticket | undefined> {
    const ticketId = this.conversationToTicket.get(conversationId);
    if (ticketId) {
      return this.tickets.get(ticketId);
    }
    return undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      ticketId: insertMessage.ticketId ?? null,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getTicketMessages(ticketId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((msg) => msg.ticketId === ticketId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async searchKB(query: string, application?: string): Promise<KBArticle[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.kbArticles.values()).filter((article) => {
      const matchesQuery =
        article.title.toLowerCase().includes(lowerQuery) ||
        article.problem.toLowerCase().includes(lowerQuery) ||
        article.cause.toLowerCase().includes(lowerQuery);

      const matchesApp = !application || article.application === application;

      return matchesQuery && matchesApp;
    });
  }

  async getKBArticle(id: string): Promise<KBArticle | undefined> {
    return this.kbArticles.get(id);
  }

  async createLogAnalysis(insertAnalysis: InsertLogAnalysis): Promise<LogAnalysis> {
    const id = randomUUID();
    const analysis: LogAnalysis = {
      ...insertAnalysis,
      id,
      correlatedEvent: insertAnalysis.correlatedEvent ?? null,
      createdAt: new Date(),
    };
    this.logAnalyses.set(id, analysis);
    return analysis;
  }

  async getLogAnalysisByTicketId(ticketId: string): Promise<LogAnalysis | undefined> {
    return Array.from(this.logAnalyses.values()).find(
      (analysis) => analysis.ticketId === ticketId
    );
  }

  async findSimilarTickets(description: string): Promise<Ticket[]> {
    const lowerDesc = description.toLowerCase();
    const keywords = lowerDesc.split(" ").filter((word) => word.length > 3);

    return Array.from(this.tickets.values())
      .filter((ticket) => {
        const ticketDesc = ticket.description.toLowerCase();
        return keywords.some((keyword) => ticketDesc.includes(keyword));
      })
      .slice(0, 3);
  }

  // Helper to link conversation to ticket
  linkConversationToTicket(conversationId: string, ticketId: string) {
    this.conversationToTicket.set(conversationId, ticketId);
  }

  // Helper to get conversation ID from ticket
  getConversationIdByTicket(ticketId: string): string | undefined {
    for (const [conversationId, tid] of this.conversationToTicket.entries()) {
      if (tid === ticketId) {
        return conversationId;
      }
    }
    return undefined;
  }
}

export const storage = new MemStorage();
