import { storage } from "./storage";
import type { Message, Ticket } from "@shared/schema";

export class CerebroAI {
  private conversationState: Map<string, ConversationState>;
  private conversationHistory: Map<string, string[]>;

  constructor() {
    this.conversationState = new Map();
    this.conversationHistory = new Map();
  }

  async processMessage(conversationId: string, userMessage: string, file?: any): Promise<string> {
    try {
      console.log("CerebroAI.processMessage called with:", { conversationId, userMessage: userMessage?.substring(0, 50) });
      
      const state = this.getState(conversationId);
      const messages = await storage.getMessages(conversationId);
      
      if (!this.conversationHistory.has(conversationId)) {
        this.conversationHistory.set(conversationId, []);
      }
      this.conversationHistory.get(conversationId)!.push(userMessage);
      
      const lowerMsg = userMessage.toLowerCase();
      console.log("Processing message, current state:", { scenario: state.scenario, application: state.application, step: state.step });

    // Scenario 4: Ticket status check
    if (lowerMsg.includes("check ticket") || lowerMsg.includes("ticket") && /\d{5}/.test(userMessage)) {
      const ticketMatch = userMessage.match(/#?(\d+)/);
      if (ticketMatch) {
        return this.handleTicketStatusCheck(ticketMatch[1]);
      }
    }

    // Scenario 8: Onboarding/guidance flow
    if (lowerMsg.includes("how do i") || lowerMsg.includes("how to")) {
      return this.handleOnboardingQuestion(userMessage, state);
    }

    // Handle file upload (Scenario 5)
    if (file) {
      return this.handleFileUpload(file, state, userMessage);
    }

    // Handle responses in active flows
    if (state.scenario) {
      return this.handleScenarioFlow(conversationId, userMessage, state);
    }

    // First interaction - detect scenario and application
    if (messages.length <= 1 && !state.application) {
      return this.detectScenarioAndRespond(userMessage, state);
    }

    // Default fallback
    if (!state.application) {
      return "Sure, I can help. Which application were you using when this happened?";
    }

    return this.handleScenarioFlow(conversationId, userMessage, state);
    } catch (error: any) {
      console.error("Error in processMessage:", error);
      throw error;
    }
  }

  private getState(conversationId: string): ConversationState {
    if (!this.conversationState.has(conversationId)) {
      this.conversationState.set(conversationId, {
        step: "initial",
      });
    }
    return this.conversationState.get(conversationId)!;
  }

  private async detectScenarioAndRespond(message: string, state: ConversationState): Promise<string> {
    const lowerMsg = message.toLowerCase();

    // Scenario 1: Daily sales report (KB match)
    if (lowerMsg.includes("daily sales report") || lowerMsg.includes("can't generate") && lowerMsg.includes("report")) {
      state.scenario = "scenario1_kb_sales";
      state.application = "Sales App";
      return "Sure, I can help. Which application were you using when this happened?";
    }

    // Scenario 2: Payroll summary (Similar tickets)
    if (lowerMsg.includes("payroll summary") && (lowerMsg.includes("loading") || lowerMsg.includes("not loading"))) {
      state.scenario = "scenario2_similar_payroll";
      state.application = "Payroll App";
      state.step = "searching_similar";
      return await this.handlePayrollSimilarTickets(state);
    }

    // Scenario 3: Logged out multiple times (Ticket creation)
    if (lowerMsg.includes("logged") && lowerMsg.includes("out") && (lowerMsg.includes("times") || lowerMsg.includes("minutes"))) {
      state.scenario = "scenario3_session_timeout";
      return "That sounds frustrating. Which application are you on?";
    }

    // Scenario 5: Data import failing (File upload flow)
    if (lowerMsg.includes("import") && lowerMsg.includes("fail")) {
      state.scenario = "scenario5_import";
      state.step = "ask_file_type";
      return "Which file type are you uploading? CSV, XLSX, or JSON?";
    }

    // Scenario 6: Dashboard showing no data (Multi-step diagnostics)
    if (lowerMsg.includes("dashboard") && lowerMsg.includes("no data")) {
      state.scenario = "scenario6_dashboard";
      state.step = "ask_which_dashboard";
      return "Understood. Let me run a few checks.\nFirst — which dashboard are you referring to?";
    }

    // Scenario 9: Invoice approval timeout (Full AAL flow)
    if (lowerMsg.includes("approve") && lowerMsg.includes("invoice") && (lowerMsg.includes("error") || lowerMsg.includes("stops"))) {
      state.scenario = "scenario9_invoice";
      return "Thanks for letting me know. I'll help you with that.\nWhich application are you using?";
    }

    // Default: Auto-detect application
    const appKeywords = {
      "Sales App": ["sales", "report", "revenue"],
      "Finance App": ["invoice", "payment", "approval", "finance"],
      "Inventory App": ["inventory", "stock", "logged out", "session"],
      "Payroll App": ["payroll", "summary", "salary"],
      "HR App": ["employee", "hr", "import"],
    };

    for (const [app, keywords] of Object.entries(appKeywords)) {
      if (keywords.some((kw) => lowerMsg.includes(kw))) {
        state.application = app;
        return `Got it, ${app}. When did this start happening?`;
      }
    }

    return "Sure, I can help. Which application were you using when this happened?";
  }

  private async handleScenarioFlow(conversationId: string, userMessage: string, state: ConversationState): Promise<string> {
    const lowerMsg = userMessage.toLowerCase();

    switch (state.scenario) {
      case "scenario1_kb_sales":
        return this.handleScenario1(userMessage, state);
      
      case "scenario2_similar_payroll":
        return this.handleScenario2(userMessage, state);
      
      case "scenario3_session_timeout":
        return this.handleScenario3(userMessage, state);
      
      case "scenario5_import":
        return this.handleScenario5(userMessage, state);
      
      case "scenario6_dashboard":
        return this.handleScenario6(userMessage, state);
      
      case "scenario9_invoice":
        return this.handleScenario9(userMessage, state);
      
      default:
        // Generic flow
        if (this.isAffirmative(userMessage) && state.waitingForConfirmation) {
          return this.handleConfirmation(conversationId, state);
        }
        return await this.genericAnalyzeAndRespond(state);
    }
  }

  // Scenario 1: Standard KB match (Daily Sales Report)
  private async handleScenario1(userMessage: string, state: ConversationState): Promise<string> {
    const lowerMsg = userMessage.toLowerCase();

    if (state.step === "initial" && lowerMsg.includes("sales")) {
      state.step = "ask_time";
      return "Understood. When did the issue occur?";
    }

    if (state.step === "ask_time" && this.looksLikeTimeResponse(userMessage)) {
      state.step = "show_kb";
      state.timeOccurred = userMessage;
      const articles = await storage.searchKB("", "Sales App");
      if (articles.length > 0) {
        const article = articles[0];
        state.foundKBArticle = article;
        state.waitingForConfirmation = "kb_helpful";
        
        const steps = article.steps.map((step, i) => `${i + 1}. ${step}`).join("\n");
        return `Thanks. Let me check the knowledge base…\nI found a relevant match: **"${article.title}"**\n\n**Possible Cause:** ${article.cause}\n**Steps to fix:**\n${steps}\n\nDid this help?`;
      }
    }

    if (this.isAffirmative(userMessage) && state.waitingForConfirmation === "kb_helpful") {
      return "Great! I'll close this interaction. Let me know if you need anything else.";
    }

    return "Let me check the knowledge base...";
  }

  // Scenario 2: Similar ticket flow (Payroll)
  private async handlePayrollSimilarTickets(state: ConversationState): Promise<string> {
    const similarTickets = await storage.findSimilarTickets("payroll summary");
    if (similarTickets.length >= 3) {
      state.similarTickets = similarTickets.slice(0, 3);
      state.step = "presenting_similar";
      const ticketList = similarTickets.slice(0, 3).map((t, i) => `${i + 1}. "${t.description}"`).join("\n");
      return `Got it. Checking… I found **3 similar issues** in past tickets:\n\n${ticketList}\n\nAre any of these the same issue?`;
    }
    return "Got it. Let me check for similar issues...";
  }

  private async handleScenario2(userMessage: string, state: ConversationState): Promise<string> {
    const lowerMsg = userMessage.toLowerCase();

    if (state.step === "presenting_similar" && (lowerMsg.includes("#1") || lowerMsg.includes("1") || lowerMsg.includes("first") || lowerMsg.includes("maybe"))) {
      state.step = "ask_payroll_period";
      state.selectedTicket = 0;
      return "Let me confirm — what payroll period are you trying to view?";
    }

    if (state.step === "ask_payroll_period") {
      state.step = "provide_solution";
      state.payrollPeriod = userMessage;
      return `Thanks. It looks like the **${userMessage} payroll period hasn't been created**.\nWould you like help creating it?`;
    }

    if (state.step === "provide_solution" && this.isAffirmative(userMessage)) {
      state.step = "show_steps";
      return "Please follow:\n1. Go to **Payroll Settings**\n2. Click **Create Period**\n3. Choose **" + (state.payrollPeriod || "the period") + "**\n4. Save";
    }

    if (state.step === "show_steps" && this.isAffirmative(userMessage)) {
      return "Issue resolved! Happy to help.";
    }

    return "Got it. Checking for similar issues...";
  }

  // Scenario 3: Session timeout (Ticket creation)
  private async handleScenario3(userMessage: string, state: ConversationState): Promise<string> {
    const lowerMsg = userMessage.toLowerCase();

    if (!state.application && lowerMsg.includes("inventory")) {
      state.application = "Inventory App";
      state.step = "ask_device";
      return "And what device?";
    }

    if (state.step === "ask_device") {
      state.device = userMessage;
      state.step = "create_ticket";
      state.willCreateTicket = true;
      return "Thanks. I couldn't find a matching article in the knowledge base, so I'll log a ticket for investigation.";
    }

    return "Which application are you on?";
  }

  // Scenario 5: File upload and analysis
  private async handleScenario5(userMessage: string, state: ConversationState): Promise<string> {
    const lowerMsg = userMessage.toLowerCase();

    if (state.step === "ask_file_type" && lowerMsg.includes("csv")) {
      state.fileType = "CSV";
      state.step = "explain_encoding";
      return "Got it. According to our Import Guide, CSV must be UTF‑8 encoded. Can you confirm your file format?";
    }

    if (state.step === "explain_encoding" && (lowerMsg.includes("not sure") || lowerMsg.includes("don't know"))) {
      state.step = "request_file";
      return "No problem — upload the file and I'll check.";
    }

    return "Which file type are you uploading? CSV, XLSX, or JSON?";
  }

  private handleFileUpload(file: any, state: ConversationState, userMessage: string): string {
    if (state.scenario === "scenario5_import" && state.step === "request_file") {
      state.step = "file_analyzed";
      return "Your file is ISO‑8859 encoded. I've converted it to **UTF‑8**.\nHere is the corrected file.\n\nTry importing this.";
    }

    return "Thanks for uploading the file. Let me analyze it...";
  }

  // Scenario 6: Multi-step diagnostics (Dashboard)
  private async handleScenario6(userMessage: string, state: ConversationState): Promise<string> {
    const lowerMsg = userMessage.toLowerCase();

    if (state.step === "ask_which_dashboard" && lowerMsg.includes("operations")) {
      state.dashboard = "Operations Dashboard";
      state.step = "checking_pipeline";
      return "Thanks. Checking your data pipeline…\nI see yesterday's ETL job failed.\nHave you recently updated your data source settings?";
    }

    if (state.step === "checking_pipeline" && lowerMsg.includes("no")) {
      state.step = "ask_data_source";
      return "Okay. Please confirm: is your data source **Warehouse A**?";
    }

    if (state.step === "ask_data_source" && this.isAffirmative(userMessage)) {
      state.step = "show_diagnostics";
      return "Thanks. Based on logs:\n- ETL job failed at 02:11 AM\n- Reason: \"missing SKU mapping\"\n\nWould you like me to create a ticket for the data team?";
    }

    if (state.step === "show_diagnostics" && this.isAffirmative(userMessage)) {
      state.willCreateTicket = true;
      return "Ticket created. I'll keep you updated.";
    }

    return "Which dashboard are you referring to?";
  }

  // Scenario 8: Onboarding/guidance
  private handleOnboardingQuestion(userMessage: string, state: ConversationState): string {
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes("import") && lowerMsg.includes("employee")) {
      state.scenario = "scenario8_onboarding";
      state.step = "showing_guide";
      return "I can help — here's the quick guide:\n1. Go to **HR → Employees**\n2. Click **Import Employees**\n3. Download the **Template CSV**\n4. Fill it in and upload\n\nWould you like a clickable walkthrough?";
    }

    return "I can help with that. What would you like to learn?";
  }

  // Scenario 9: Invoice approval (Full AAL flow)
  private async handleScenario9(userMessage: string, state: ConversationState): Promise<string> {
    const lowerMsg = userMessage.toLowerCase();

    if (!state.application && lowerMsg.includes("finance")) {
      state.application = "Finance App";
      state.step = "ask_when";
      return "Got it. When did this start happening?";
    }

    if (state.step === "ask_when" && this.looksLikeTimeResponse(userMessage)) {
      state.timeOccurred = userMessage;
      state.step = "ask_error_message";
      return "Understood. Do you see any specific error message or code on the screen?";
    }

    if (state.step === "ask_error_message" && lowerMsg.includes("approval_service_timeout")) {
      state.errorCode = "APPROVAL_SERVICE_TIMEOUT";
      state.step = "create_ticket";
      state.willCreateTicket = true;
      return "Thanks, that's helpful. You can upload a screenshot too if you'd like.\n\nI'll create a support ticket and check the application logs for you.";
    }

    return "Which application are you using?";
  }

  // Scenario 4: Ticket status check
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
    const affirmatives = ["yes", "yeah", "yep", "sure", "works", "fixed", "solved", "ok", "okay", "it works"];
    return affirmatives.some((word) => msg.toLowerCase().includes(word));
  }

  private looksLikeTimeResponse(msg: string): boolean {
    return (
      msg.toLowerCase().includes("now") ||
      msg.toLowerCase().includes("ago") ||
      msg.toLowerCase().includes("am") ||
      msg.toLowerCase().includes("pm") ||
      msg.toLowerCase().includes("minute") ||
      msg.toLowerCase().includes("today") ||
      /\d{1,2}:\d{2}/.test(msg)
    );
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
    
    if (state.willCreateTicket && !state.ticketCreated) {
      const userMessages = messages.filter((m) => m.role === "user");
      const description = userMessages.map((m) => m.content).join(" ");

      const ticket = await storage.createTicket({
        userId,
        userName,
        application: state.application || "Unknown",
        description: description.substring(0, 500),
        errorCode: state.errorCode,
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

    const analysisData = analyses[application] || analyses["Finance App"];

    await storage.createLogAnalysis({
      ticketId,
      ...analysisData,
    });
  }

  private async genericAnalyzeAndRespond(state: ConversationState): Promise<string> {
    if (!state.application) {
      return "Which application are you using?";
    }

    const articles = await storage.searchKB("", state.application);
    
    if (articles.length > 0) {
      const article = articles[0];
      state.foundKBArticle = article;
      state.waitingForConfirmation = "kb_helpful";
      
      const steps = article.steps.map((step, i) => `${i + 1}. ${step}`).join("\n");
      return `Thanks. Let me check the knowledge base…\nI found a relevant match: **"${article.title}"**\n\n**Possible Cause:** ${article.cause}\n**Steps to fix:**\n${steps}\n\nDid this help?`;
    }

    state.willCreateTicket = true;
    return "Thanks. I couldn't find a matching article in the knowledge base, so I'll log a ticket for investigation.";
  }
}

interface ConversationState {
  step: string;
  scenario?: string;
  application?: string;
  timeOccurred?: string;
  errorCode?: string;
  device?: string;
  fileType?: string;
  dashboard?: string;
  payrollPeriod?: string;
  similarTickets?: any[];
  selectedTicket?: number;
  foundKBArticle?: any;
  waitingForConfirmation?: string;
  willCreateTicket?: boolean;
  ticketCreated?: boolean;
}

export const cerebroAI = new CerebroAI();
