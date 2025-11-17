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
  - `ChatMessage` - Message bubbles for different roles
  - `MessageInput` - Chat input with file upload and quick questions dropdown
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
- **2025-11-17**: Demo enhancements for easier scenario testing
  - **Fresh conversations** - Removed sessionStorage persistence; each visit creates new conversation
  - **Clear & Home buttons** - Added header navigation to clear conversation or return home
  - **Quick questions dropdown** - Lightning bolt icon with all 9 scenario responses for fast demo execution
  - **Thinking indicator** - Added realistic "Cerebro is thinking..." animation with configurable 500ms delay (set via CEREBRO_THINKING_DELAY_MS env var)
  - Fixed FormData handling in apiRequest to properly support file uploads
  
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
3. Ticket creation when no KB match exists
4. Ticket status updates and tracking
5. File upload with analysis (CSV encoding checks)
6. Multi-step diagnostics before escalation
7. IT Support requests more information
8. Onboarding/first-time user guidance
9. Full lifecycle: User report → AAL analysis → IT fix → Resolution

**Quick Demo Mode**: Use the lightning bolt icon in the chat input to select pre-filled responses from any scenario, eliminating the need to type each message manually.

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
