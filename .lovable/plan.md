

# InnovaSys — Tax Assurance Platform

## Overview
Build the complete UI shell and navigation for InnovaSys with all major pages populated with realistic mock data. The design follows the "Modern Corporate (Velzon-Inspired)" direction: dark sidebar, pale gray background, white cards, and vibrant status colors (Teal, Amber, Burnt Orange). Lovable Cloud will be set up for basic auth.

---

## Phase 1: Foundation & Design System

### Custom Theme & Tokens
- Override Shadcn defaults with the Velzon-inspired palette: Deep Charcoal sidebar (#212529), Corporate Blue primary (#405189), Teal success (#0AB39C), Amber warning (#F7B84B), Burnt Orange danger (#F06548)
- Inter font for UI, JetBrains Mono for data/hashes
- Compact spacing suited for information-dense views

### App Shell & Navigation
- **Dark collapsible sidebar** with icon-only mini mode, containing navigation for: Dashboard, CRM, Operations, Agent Studio, Settings
- **Top header bar** with breadcrumbs, global search trigger (Cmd+K command palette), notifications bell, and user avatar menu
- Active route highlighting with NavLink

---

## Phase 2: Executive Dashboard (Helena's View)

### Key Widgets (all with mock data)
- **Status Overview Cards**: Active Projects, Pending Reviews, Completed This Month, Total Revenue — each with trend arrows and sparkline charts
- **Risk Heatmap**: Visual grid showing project risk levels using the Teal/Amber/Orange semantic colors
- **Project Pipeline Chart**: Bar or funnel chart showing projects across the 7 operational phases
- **Recent Activity Feed**: Timeline of latest approvals, publications, and flagged items
- **Client Health Score**: Summary cards per client with green/yellow/red indicators

---

## Phase 3: CRM / Sales Pipeline

### Pipeline Board
- Kanban-style board with stages: Prospect → Qualified → Proposal → Negotiation → Won → Handover
- Draggable lead cards showing company name, deal value, and complexity badge
- Progressive disclosure: clicking a card reveals technical complexity fields and fiscal potential scores

### Lead Detail View
- Company info, contacts, interaction timeline
- "Materializar Projeto" animated handover button (Won → Operations transition)

---

## Phase 4: Operations Workspace (7-Phase Pipeline)

### Phase Timeline Navigation
- Persistent horizontal timeline bar showing all 7 phases with status indicators (not started, in progress, review, complete)
- Clicking a phase switches the workspace context below

### Split-View Editor (Phase 5 — Narrative)
- Left panel: PDF/document viewer placeholder (scrollable content area)
- Right panel: Rich text editor area with inline risk highlights
- Resizable panels using react-resizable-panels with ratio persistence
- **RiskBadge** components: colored status indicators (Safe/Warning/Risk) with mock confidence scores
- **EvidenceAnchor** links: styled inline references that show hover previews

### Phase-Specific Workspaces
- Phase 2 (Tech Dive): Interview-style chat interface with suggested questions
- Phase 6 (QA/Audit): Checklist console with pass/fail items and the "Green Check" celebration moment
- Phase 7 (Publish): Confirmation modal with "weight" — hash generation display, lock animation

### Contextual Agent Sidebar
- Right sidebar panel showing the current phase's AI agent with its persona, status messages ("Reading PDF X...", "Cross-referencing Law Y..."), and suggestion cards
- AI suggestions styled as ghost/secondary buttons; human actions as solid primary buttons

---

## Phase 5: Agent Studio (Sofia's View)

### Agent Cards Grid
- Visual cards for each configured agent (Writer, Auditor, Researcher, etc.)
- Each card shows: avatar, name, role, knowledge base document count, last trained date

### Agent Configuration Panel
- **Persona section**: Avatar upload area, name, role dropdown
- **Instructions**: Structured fields — "What to do", "What to avoid", "Tone of voice"
- **Knowledge Base (RAG)**: Drag-and-drop zone for PDFs with indexing status animation ("Reading...", "Indexed ✓")
- Visual indicator showing which documents feed which agent

---

## Phase 6: Lovable Cloud Setup

### Authentication
- Basic email/password login and signup pages
- Protected routes for all main views
- User profile basics (name, role)

### Database Schema (minimal)
- Users/profiles table
- Projects table (mock structure for dashboard data)
- Agents configuration table (for Agent Studio persistence)

---

## Cross-Cutting Features

### Command Palette (Cmd+K)
- Global search and navigation: jump to any project, phase, agent, or page
- Quick actions: create project, switch theme

### Interaction Patterns
- Optimistic UI on approve/resolve actions
- Toast notifications for background saves
- Inline error states (red borders, contextual messages)
- Autosave indicator in header: "Saving..." → "Saved ✓" → "Locked 🔒"

### Responsive Behavior
- Desktop-first with full Split-View
- Tablet: collapsed sidebar, maintained split-view
- Mobile: read-only companion mode with stacked cards and status dashboard only

