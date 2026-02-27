# App Builder UI Design

**Date:** 2026-02-23
**Status:** Approved
**Author:** Claude (EventureAI Team)

## Overview

A multi-agent app builder interface for EventureAI that enables users to interact with AI agents for building, debugging, and deploying applications. The system integrates with the existing Neon database infrastructure including the tournament system, memory storage, and error tracking.

## Goals

1. Provide a unified interface for multi-agent collaboration
2. Enable tournament-style multi-LLM queries with debate mode
3. Integrate with existing memory and learning systems
4. Support real-time preview of generated code/applications
5. Maintain the iOS-style design language established in the marketing site

## Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Database:** Neon PostgreSQL via `@neondatabase/serverless`
- **Styling:** Tailwind CSS v4 (iOS-style design system)
- **State Management:** React Query (TanStack Query)
- **Real-time:** Server-Sent Events (SSE) for agent updates

### Routes

```
/builder              → Main builder interface
/builder/tournament   → Tournament management
/builder/memory       → Memory browser
/builder/settings     → Agent and model configuration
```

### Database Tables Used

| Table | Purpose |
|-------|---------|
| `llm_tournaments` | Tournament orchestration |
| `llm_responses` | Model responses storage |
| `memories` | AI memory retrieval |
| `semantic_chunks` | Context search |
| `mori_error_chains` | Error tracking integration |
| `mori_solutions` | Verified solution library |
| `canonical_solutions` | Best-practice solutions |
| `apps` | Project registry |
| `workspaces` | User workspace context |

## Layout Design

### Three-Panel Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  EventureAI Builder                              [User] [Settings]  │
├────────────┬─────────────────────────────────────┬──────────────────┤
│  AGENTS    │         CHAT / PREVIEW              │    LIVE OUTPUT   │
│  (240px)   │         (flexible)                  │    (400px)       │
├────────────┼─────────────────────────────────────┼──────────────────┤
│ Agent list │ Message history                     │ Preview/Live     │
│ Status     │ Code blocks                         │ Device toggles   │
│ Tournament │ Streaming responses                 │ Sync controls    │
│ Memory     │ Input field                         │ Console output   │
└────────────┴─────────────────────────────────────┴──────────────────┘
```

### Component Breakdown

#### Left Sidebar - Agent Panel (240px)

- **Agent List:** Shows active agents with status indicators
  - Build agent (creates features)
  - Dev agent (debugging)
  - Live agent (production monitoring)
- **Environment Selector:** dev/staging/production
- **Tournament Widget:** Status of running tournaments
- **Memory Search:** Quick search across memories
- **Active Task:** Current task indicator

#### Center - Chat Panel (flexible width)

- **Message History:** Markdown rendering with code highlighting
- **Code Blocks:** Syntax highlighting, copy button, file context
- **File Attachments:** Support for images, documents
- **@Mentions:** Reference memories or dispatch to agents
- **Streaming Indicator:** Shows when agent is responding

#### Right Panel - Preview/Live (400px, collapsible)

- **Toggle:** Preview mode vs Live mode
- **Preview:** Shows current build output in iframe
- **Live:** Shows production deployment
- **Device Preview:** Desktop/tablet/mobile toggles
- **Controls:** Refresh, sync, console toggle

#### Top Bar

- **Project Name:** Current workspace/app
- **Model Selector:** Dropdown for primary model
- **Token Usage:** Optional indicator (no limit enforced)
- **User Menu:** Profile, settings, logout

## Agent Workflow

### Agent States

| State | Description |
|-------|-------------|
| Idle | Waiting for instructions |
| Thinking | Processing request |
| Building | Writing code |
| Debugging | Fixing errors, references `mori_solutions` |
| Deploying | Pushing to environment |

### Multi-Agent Coordination

1. **Primary Agent:** Receives instructions in chat
2. **Specialist Dispatch:** Can delegate to Builder, Debugger, Tester agents
3. **Tournament Mode:** Broadcast to multiple LLMs, collect responses
4. **Consensus Mode:** Agents debate and agree on solution

### Memory Integration

- Auto-search `memories` for relevant context
- New learnings saved to `memories` table
- References `canonical_solutions` for known fixes
- Links to `mori_error_chains` for bug tracking

## Tournament System

### Tournament Flow

1. User submits query/prompt
2. System creates `llm_tournaments` record
3. Broadcasts to selected models
4. Responses logged in `llm_responses`
5. Optional debate rounds between models
6. User or jury selects winner
7. Decision logged in `anthropic_jury_decisions`

### Tournament UI

- **Model Selector:** Checkboxes for each model (Claude, GPT-4, Gemini, Groq, xAI, Cohere)
- **Comparison View:** Side-by-side or stacked response comparison
- **Vote Controls:** Select winner, mark interesting
- **Cost Tracking:** Per-model cost display

### Debate Mode

- Configurable number of rounds
- Models see previous responses
- Final synthesis or user selection
- Full transcript saved

## Memory & Learning System

### Memory Browser

- Full-text search across `memories`
- Filter by: domain, tags, memory_type, date range
- View linked `semantic_chunks`
- Citation tracking (which decisions used this memory)

### Learning Loop

```
Problem Identified → Agent Solves → Memory Created → Linked to Error Chain
                                                       ↓
                                          Verified → Canonical Solution
```

### Context Window

- Shows memories pulled for current task
- User can pin/unpin memories
- Manual memory addition
- Relevance scores displayed

## Authentication & Multi-Tenancy

### Auth Implementation

- Uses existing `auth_users`, `auth_sessions` tables
- Email/password with bcrypt hashing
- Magic link via `magic_tokens` table
- Session cookies with secure settings

### Tenant Context

- User belongs to tenant
- Apps created in tenant context
- Memories scoped to tenant
- Cross-tenant sharing (admin-controlled)

### Admin Features

- Tenant switching for admins
- Usage analytics per tenant
- Model cost allocation
- Audit logging

## API Endpoints

### Chat & Streaming

```
POST /api/builder/chat           → Send message to agent
GET  /api/builder/stream         → SSE endpoint for responses
POST /api/builder/tournament     → Start tournament
GET  /api/builder/tournament/:id → Get tournament status
```

### Memory

```
GET  /api/builder/memory         → Search memories
POST /api/builder/memory         → Create memory
GET  /api/builder/memory/:id     → Get memory details
```

### Preview

```
GET  /api/builder/preview        → Get preview HTML
POST /api/builder/preview/sync   → Sync preview state
```

## Design System

### Colors (iOS-style)

- Background: `#F2F2F7`
- Cards: `white` with subtle shadow
- Primary: `#007AFF` (iOS blue)
- Success: `#34C759`
- Warning: `#FF9500`
- Error: `#FF3B30`

### Components

- `IOSCard` - Frosted glass cards
- `IOSListCard` - List container with dividers
- `IOSPrimaryButton` - Primary action button
- `SidebarItem` - Navigation items
- `ChatMessage` - Message bubble component
- `CodeBlock` - Syntax highlighted code
- `PreviewFrame` - Iframe container

## Success Metrics

1. Response time < 2s for simple queries
2. Tournament completion < 30s for 3 models
3. Memory retrieval < 500ms
4. Preview refresh < 1s
5. Zero data loss on connection drop

## Security Considerations

- All API routes require authentication
- Tenant isolation enforced at database level
- Input sanitization for code execution
- Rate limiting per tenant
- Audit logging for sensitive operations

## Future Enhancements

1. Voice input/output for chat
2. Collaborative editing (multi-user)
3. Git integration for version control
4. Custom agent training
5. Mobile companion app
