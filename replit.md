# Cerebro AI Support System

## Overview
An AI-assisted trouble ticketing system prototype featuring conversational support (Cerebro) and automated log analysis (AAL). This is a scripted demo system that simulates intelligent troubleshooting workflows without requiring actual AI API integration.

## Purpose
Demonstrate an end-to-end AI support workflow where:
- **Cerebro** - Conversational AI helps users diagnose issues through natural dialog
- **Knowledge Base** - Provides step-by-step solutions for common problems
- **Ticket System** - Manages escalated issues with full lifecycle tracking
- **AAL (Application Analysis Layer)** - Simulates log analysis with root cause identification and suggested fixes
- **IT Support Dashboard** - Shows tickets enriched with AI-generated insights

## Project Architecture

### Data Models (`shared/schema.ts`)
- **Tickets** - Support tickets with status, severity, application context
- **Messages** - Chat conversation history (user, Cerebro, technician, system)
- **KB Articles** - Knowledge base articles with solutions and steps
- **Log Analyses** - AAL-generated root cause analysis and fixes

### Frontend (`client/src`)
- **Pages**:
  - `/` - Home page with portal selection
  - `/chat` - User-facing Cerebro chat interface
  - `/support` - IT Support dashboard with ticket queue and details
  
- **Components**:
  - `ChatMessage` - Message bubbles for different roles (user, Cerebro, technician, system)
  - `MessageInput` - Chat input with file upload and quick questions dropdown
  - `RequestInfoDialog` - IT Support dialog for requesting info from users with quick-fill questions
  - `TypingIndicator` - Animated thinking indicator for realistic chat flow
  - `TicketCard` - Ticket preview cards
  - `StatusBadge` - Color-coded status indicators
  - `KBArticleCard` - Expandable knowledge base articles
  - `AALAnalysis` - AI log analysis display with code blocks
  - `ThemeToggle` - Dark/light mode switcher

### Backend (`server/`)
- **Routes** - API endpoints for chat, tickets, KB search, AAL analysis
- **Storage** - In-memory storage with scripted demo scenarios
- **WebSocket** - Real-time ticket status updates

## User Preferences
- Professional, utility-focused design inspired by Linear and Zendesk
- Information-dense layouts for IT professionals
- Clear visual separation between user, AI, and support roles
- Inter font family for clean, modern typography
- Dark mode support

## Recent Changes
- **2025-11-18**: Scenario 7 Implementation - IT Support Two-Way Communication
  - **RequestInfoDialog Component** - Created dialog with text area and lightning bolt dropdown for IT to send requests to users
  - **Notification Bell** - Added bell icon with red badge in user chat header showing count of unread IT messages
  - **Bell Click Behavior** - Clicking bell clears badge and scrolls to latest IT technician message
  - **IT Message Prefix** - All technician messages automatically prefixed with "[IT Support]" to distinguish from Cerebro
  - **"Request More Info" Button** - Added to IT dashboard for ticket #48320, opens RequestInfoDialog
  - **Quick-Fill IT Questions** - Dropdown with 4 pre-scripted IT questions including "Can you share your latest SKU export file..."
  - **Scenario 7 Automated Flow** - Complete scripted sequence:
    1. IT clicks "Request More Info" → sends question to user
    2. User receives notification bell → clicks bell → sees IT message
    3. User uploads file and responds
    4. After 3 seconds → IT auto-replies: "[IT Support] Thanks — fix applied. Dashboard should update within 5 minutes."
    5. After 2 seconds → Cerebro asks: "Is your issue resolved now?"
    6. User responds "yes"
    7. Cerebro confirms: "Great! Closing the ticket."
    8. Ticket status updates to resolved automatically
  - **WebSocket Broadcasting** - IT messages trigger real-time notifications in user chat via WebSocket
  
- **2025-11-17**: IT Support Dashboard enhancements + Demo improvements
  - **Fresh conversations** - Removed sessionStorage persistence; each visit creates new conversation
  - **Clear & Home buttons** - Added header navigation to clear conversation or return home
  - **Quick questions dropdown** - Lightning bolt icon with all 9 scenario responses for fast demo execution
  - **Thinking indicator** - Added realistic "Cerebro is thinking..." animation with 1000ms delay (configurable via CEREBRO_THINKING_DELAY_MS env var)
  - **Message timing** - User messages appear immediately, followed by thinking indicator, then Cerebro's response (optimistic updates with proper cache management)
  - **Ticket numbers** - Updated to match script: #48201 for scenario 3, #48320 for scenario 6
  - **Scenario 5 (file upload)** - Fixed to not process files, provides downloadable dummy CSV, handles "It works now!" confirmation
  - Fixed FormData handling in apiRequest to properly support file uploads
  - **IT Support Dashboard**:
    - Added Clear button to reset dashboard to baseline state
    - Filters to show only scripted tickets (#48201, #48320) by default
    - Ticket-specific action buttons:
      - **#48201** (Session Timeout): Run Log Analysis → Apply Mobile Session Fix → Close
      - **#48320** (Dashboard No Data): Request More Info → Apply ETL Fix → Close
    - New backend endpoints: /run-analysis, /apply-fix, /request-info
  
- **2025-11-15**: Complete MVP implementation
  - Created all data schemas and TypeScript interfaces
  - Built complete frontend with chat, dashboard, and ticket views
  - Configured design system with Inter fonts and professional color palette
  - Implemented all core components following design guidelines
  - Added WebSocket integration for real-time ticket/message updates
  - Added ticket status update mutations in support dashboard
  - Fixed icon imports (replaced WrenchScrewdriver with Wrench from lucide-react)
  - Backend includes scripted AI responses matching demo scenarios
  - Full CRUD API for tickets, messages, KB articles, and log analyses

## Demo Scenarios
The system includes scripted responses for all 9 scenarios:
1. Standard KB solution found (e.g., daily sales report errors)
2. Similar ticket matching (e.g., payroll summary issues)
3. Ticket creation when no KB match exists (always creates ticket #48201)
4. Ticket status updates and tracking
5. File upload with analysis (CSV encoding checks) - provides downloadable converted file
6. Multi-step diagnostics before escalation (creates ticket #48320)
7. **IT Support requests more information** - Complete two-way communication flow:
   - IT clicks "Request More Info" on ticket #48320 and sends question
   - User receives notification bell in chat header
   - User clicks bell, sees IT's message with "[IT Support]" prefix
   - User uploads file in response
   - Automated 3-second delay → IT confirms fix applied
   - Automated 2-second delay → Cerebro asks if resolved
   - User confirms → Cerebro closes ticket
8. Onboarding/first-time user guidance
9. Full lifecycle: User report → AAL analysis → IT fix → Resolution

**Quick Demo Mode**: Use the lightning bolt icon in chat input (user side) or RequestInfoDialog (IT side) to select pre-filled responses from any scenario, eliminating the need to type each message manually.

## Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Wouter (routing)
- **Backend**: Express.js, WebSocket (real-time updates)
- **Storage**: In-memory with mock data for demo
- **State Management**: TanStack Query (React Query v5)

## Next Steps (Post-MVP)
- Integrate with real logging systems (Datadog, Splunk, etc.)
- Connect to actual knowledge base management
- Add real-time collaboration between users and support
- Implement analytics dashboard for resolution metrics
- Deploy to production with PostgreSQL persistence
