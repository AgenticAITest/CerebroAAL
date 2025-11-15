# Design Guidelines: AI-Assisted Trouble Ticketing System

## Design Approach

**System Selection**: Modified productivity-focused design system drawing from Linear's clarity and Zendesk's support patterns. This utility-focused application prioritizes information density, scan-ability, and efficient workflows over visual flourish.

**Core Principles**:
- Clarity over decoration - technical users need fast comprehension
- Distinct visual zones for different user roles (End User, Cerebro AI, IT Support)
- Conversation-first design for Cerebro interactions
- Dense but organized layouts for IT dashboards

---

## Typography System

**Font Stack**: Inter for UI (via Google Fonts CDN) with system fallbacks

**Hierarchy**:
- Page Titles: text-2xl, font-semibold
- Section Headers: text-lg, font-semibold  
- Card Titles/Ticket IDs: text-base, font-medium
- Body Text: text-sm, font-normal
- Metadata/Timestamps: text-xs, font-normal, opacity-70
- Code/Technical: Use monospace font (font-mono) for error codes, logs, technical identifiers

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 for consistency
- Component padding: p-4 or p-6
- Section spacing: space-y-4 or space-y-6
- Card gaps: gap-4
- Page margins: Large screens use max-w-7xl containers

**Grid Structure**:
- Chat Interface: Single column, max-w-3xl centered
- IT Dashboard: 12-column grid with sidebar (3 cols) + main (9 cols)
- Ticket List: Single column with full-width cards
- Analytics: 3-column grid for metrics on desktop, stack on mobile

---

## Component Library

### Conversational Chat Interface (Cerebro)

**Message Bubbles**:
- User messages: Right-aligned, rounded-2xl, p-4, max-w-md
- Cerebro AI messages: Left-aligned, rounded-2xl, p-4, max-w-lg
- System notifications: Centered, italic, text-xs, py-2

**Message Structure**:
- Avatar indicators (16px icons from Heroicons)
- Timestamp below each message group
- Action buttons inline within AI messages (e.g., "Create Ticket", "View Solution")

**Input Area**:
- Fixed bottom position with backdrop blur
- File upload button + text input + send button in single row
- Height: h-14, with rounded-xl border

### Ticket Cards

**Layout**:
- Full-width cards with rounded-lg borders
- Header row: Ticket ID (font-mono, font-semibold) + Status badge + Timestamp
- Body: Issue description (2 lines max with truncation)
- Footer: Application tag + Severity indicator + Assigned user
- Spacing: p-6 with space-y-3 internal

**Status Badges**:
- Small pills with rounded-full, px-3, py-1, text-xs
- Distinct treatments for: New, In Progress, Log Analysis, Fix Applied, Resolved

### IT Support Dashboard

**Sidebar Navigation**:
- Fixed left sidebar, w-64, h-screen
- Navigation items with rounded-lg hover states
- Icons from Heroicons (outline style, 20px)
- Active state with subtle indicator bar

**Main Content Area**:
- Ticket queue table with alternating row treatments
- Compact rows showing: ID, User, Issue Summary, Status, Time, Actions
- Click-to-expand for full ticket details
- Sticky table header

**Ticket Detail Panel**:
- Split view: Left (conversation history) + Right (AAL analysis & actions)
- AAL Analysis section with distinct visual treatment:
  - Header with "AI Analysis" label
  - Log excerpts in code blocks (font-mono, rounded, p-3)
  - Suggested fixes in numbered list with checkboxes
  - Root cause highlighted in warning-style container

### Knowledge Base Search Results

**Result Cards**:
- Compact cards with hover lift effect
- Icon + Title + Snippet (2 lines)
- Match confidence indicator (if showing similar tickets)
- Click expands to full solution steps

**Solution Display**:
- Numbered step-by-step format
- Each step in its own container with generous padding
- Code snippets or paths in monospace with subtle background
- Success/completion checkmarks where applicable

### File Upload Component

**Drag-and-Drop Zone**:
- Dashed border, rounded-lg, p-8
- Upload icon centered with helper text
- Shows file preview after selection
- Remove button on thumbnail

---

## Animations

**Minimal Motion** (performance-focused):
- Message send: Simple fade-in (200ms)
- Ticket status changes: Badge color transition (150ms)
- Panel slides: Transform with ease-out (250ms)
- NO scroll-triggered animations
- NO decorative motion graphics

---

## Images

**Avatar System**: Use Heroicons for user/AI avatars (no photos)
- User: UserCircleIcon
- Cerebro AI: SparklesIcon or CpuChipIcon
- IT Support: WrenchScrewdriverIcon

**No Hero Images**: This is a utility application - launch directly into functionality

**Screenshot Attachments**: Display uploaded images in rounded containers, max-w-md, with lightbox on click

---

## Accessibility

- All interactive elements have focus states with visible outlines
- Form inputs maintain consistent height (h-10 for standard inputs)
- Sufficient contrast for all text (WCAG AA minimum)
- Keyboard navigation fully supported
- Screen reader labels for icon-only buttons

---

## Responsive Behavior

**Mobile (<768px)**:
- Stack all multi-column layouts to single column
- Fixed bottom chat input with safe-area-inset
- Collapsible sidebar via hamburger menu
- Ticket cards maintain full content but compress padding to p-4

**Desktop (≥1024px)**:
- Persistent sidebar navigation
- Split-panel ticket details
- Table views for ticket queues
- Multi-column dashboard metrics