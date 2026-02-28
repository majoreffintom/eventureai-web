# EventureAI Builder: Semantic Memory + Swarm + webMCP

**Date:** 2026-02-27
**Status:** Approved
**Author:** Claude + User

---

## Problem Statement

Every AI session starts from zero. Users lose context of:
- Decisions made and why
- Files created and their purposes
- API endpoints and their contracts
- Patterns established
- Issues encountered and resolved

This leads to:
- Redundant work cycles ("try this, try this")
- Lost work when rebuilding features
- Frustration for both user and AI
- No starting point for new sessions

---

## Solution Overview

A four-layer system that provides:
1. **Persistent Memory** - Every conversation, decision, and pattern is stored and indexed
2. **Swarm Orchestration** - Specialized agents work in parallel with shared context
3. **webMCP Feedback** - Formal complaint/issue channel between agents
4. **Session Context** - AI starts every session with full project history

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EVENTUREAI BUILDER PLATFORM                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│   │   ORCHESTRATOR   │    │    MEMORY LAYER   │    │  EXECUTION LAYER │ │
│   │                 │    │                  │    │                  │   │
│   │ ┌───────────┐   │    │ ┌──────────────┐ │    │ ┌──────────────┐ │   │
│   │ │ Swarm     │   │    │ │ memoria_     │ │    │ │ Agent Pool   │ │   │
│   │ │ Controller│───┼────┼▶│ threads/turns│ │    │ │              │ │   │
│   │ └───────────┘   │    │ └──────────────┘ │    │ │ ┌──────────┐ │ │   │
│   │                 │    │                  │    │ │ │ Builder  │ │ │   │
│   │ ┌───────────┐   │    │ ┌──────────────┐ │    │ │ ├──────────┤ │ │   │
│   │ │ Task      │   │    │ │ project_     │ │    │ │ │ Architect│ │ │   │
│   │ │ Queue     │───┼────┼▶│ states       │ │    │ │ ├──────────┤ │ │   │
│   │ └───────────┘   │    │ └──────────────┘ │    │ │ │ Coder    │ │ │   │
│   │                 │    │                  │    │ │ ├──────────┤ │ │   │
│   │ ┌───────────┐   │    │ ┌──────────────┐ │    │ │ │ Tester   │ │ │   │
│   │ │ Delegation│   │    │ │ memories     │ │    │ │ ├──────────┤ │ │   │
│   │ │ Engine    │───┼────┼▶│ (knowledge)  │ │    │ │ │ Reviewer │ │ │   │
│   │ └───────────┘   │    │ └──────────────┘ │    │ │ ├──────────┤ │ │   │
│   │                 │    │                  │    │ │ │ Debugger │ │ │   │
│   └─────────────────┘    │ ┌──────────────┐ │    │ │ └──────────┘ │ │   │
│                          │ │ swarm_*      │ │    │ └──────────────┘ │   │
│                          │ │ webmcp_*     │ │    │                  │   │
│                          │ └──────────────┘ │    │ ┌──────────────┐ │   │
│                          └──────────────────┘    │ │ Code Runner  │ │   │
│                                                  │ │ (sandboxed)  │ │   │
│                                                  │ └──────────────┘ │   │
│                                                  └──────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Memory System

### Indexing Strategy

- **Index**: `{tenant_id}` (primary organizational unit)
- **Subindex**: `{agent_type}_{workspace_id}` (e.g., `build_workspace123`)

### Database Tables

#### memoria_threads
```sql
CREATE TABLE memoria_threads (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT NOT NULL UNIQUE,
  memoria_index_id BIGINT REFERENCES memoria_indexes(id),
  memoria_subindex_id BIGINT REFERENCES memoria_subindexes(id),
  app_source TEXT NOT NULL DEFAULT 'builder',
  title TEXT,
  context TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_turn_at TIMESTAMP
);
```

#### memoria_turns
```sql
CREATE TABLE memoria_turns (
  id BIGSERIAL PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES memoria_threads(id) ON DELETE CASCADE,
  external_turn_id TEXT,
  turn_index INTEGER NOT NULL,
  user_text TEXT,
  assistant_response TEXT,
  assistant_thinking_summary TEXT,
  assistant_synthesis TEXT,
  code_summary TEXT,
  raw_messages JSONB,
  metadata JSONB DEFAULT '{}',  -- Contains tags[]
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (thread_id, turn_index)
);
```

#### project_states
```sql
CREATE TABLE project_states (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,

  -- Current state snapshot
  files JSONB DEFAULT '{}',      -- { "path": { purpose, last_modified, seo, etc } }
  endpoints JSONB DEFAULT '{}',  -- { "/api/x": { methods, purpose } }
  patterns JSONB DEFAULT '{}',   -- { "name": { description, files[] } }
  config JSONB DEFAULT '{}',     -- { slugs: {}, seo_defaults: {} }
  decisions JSONB DEFAULT '[]',  -- [{ date, decision, rationale, files_affected }]

  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, workspace_id)
);
```

#### memories (existing, enhanced)
```sql
-- Already exists, add linkage
ALTER TABLE memories ADD COLUMN source_thread_id BIGINT;
ALTER TABLE memories ADD COLUMN source_turn_id BIGINT;
```

### Tagging Taxonomy

```
Semantic Tags (auto-generated):
├── scope/
│   ├── api          # API endpoint related
│   ├── ui           # Frontend/component
│   ├── data         # Database/schema
│   ├── config       # Configuration
│   └── seo          # SEO/meta tags
│
├── type/
│   ├── decision     # A choice was made
│   ├── pattern      # Reusable pattern established
│   ├── issue        # Bug/problem encountered
│   ├── resolution   # How an issue was fixed
│   ├── creation     # New file/feature created
│   └── modification # Existing file changed
│
├── feature/
│   ├── gallery      # Media gallery feature
│   ├── auth         # Authentication
│   └── [dynamic]    # Auto-detected feature names
│
└── project/
    ├── [tenant_id]
    ├── [workspace_id]
    └── [app_name]
```

### Tagging Methods

1. **Manual** - User explicitly tags (e.g., `#decision:auth-strategy`)
2. **Auto-extracted** - LLM identifies important parts after each turn
3. **Hybrid** - LLM suggests, user confirms
4. **Semantic** - Full context paths (e.g., `tenant:abc/project:mobile/feature:auth`)

---

## Layer 2: Swarm System

### Agent Types

| Agent | Responsibilities |
|-------|-----------------|
| **Orchestrator** | Receives requests, delegates tasks, coordinates agents, maintains state |
| **Architect** | Plans implementation, designs data models/APIs, defines patterns |
| **Coder** | Implements features, writes production code, follows patterns |
| **Tester** | Writes tests, validates functionality, edge case discovery |
| **Reviewer** | Code review, security audit, performance analysis |
| **Debugger** | Diagnoses errors, root cause analysis, implements fixes |
| **Live Monitor** | Deployment tracking, performance metrics, error monitoring |

### Database Tables

#### swarm_tasks
```sql
CREATE TABLE swarm_tasks (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  parent_task_id BIGINT REFERENCES swarm_tasks(id),

  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(50),           -- 'feature', 'bugfix', 'refactor', 'test', 'review'
  priority INTEGER DEFAULT 0,

  assigned_agent VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',

  context_tags JSONB,
  related_files JSONB,
  dependencies JSONB,

  input_prompt TEXT,
  output_summary TEXT,
  output_artifacts JSONB,

  source_thread_id BIGINT,
  memory_ids JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### swarm_agents
```sql
CREATE TABLE swarm_agents (
  id BIGSERIAL PRIMARY KEY,
  agent_type VARCHAR(50) NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,

  status VARCHAR(20) DEFAULT 'idle',
  current_task_id BIGINT REFERENCES swarm_tasks(id),

  capabilities JSONB,
  tasks_completed INTEGER DEFAULT 0,
  avg_completion_time_ms INTEGER,

  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### swarm_communications
```sql
CREATE TABLE swarm_communications (
  id BIGSERIAL PRIMARY KEY,
  from_agent_id BIGINT REFERENCES swarm_agents(id),
  to_agent_id BIGINT REFERENCES swarm_agents(id),
  task_id BIGINT REFERENCES swarm_tasks(id),

  message_type VARCHAR(50),
  content TEXT,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### Task Delegation Flow

```
User Request → Orchestrator
                    │
                    ▼
        ┌───────────────────────┐
        │ 1. Load Context       │
        │    - project_state    │
        │    - relevant memories│
        │    - recent decisions │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 2. Decompose into     │
        │    Tasks              │
        │    - Set dependencies │
        │    - Assign agents    │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 3. Execute            │
        │    - Parallel where   │
        │      possible         │
        │    - Sequential for   │
        │      dependencies     │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ 4. Update Memory      │
        │    - Extract tags     │
        │    - Update state     │
        │    - Create memories  │
        └───────────────────────┘
```

---

## Layer 3: webMCP (Inter-Agent Communication)

### Concept

Formal feedback/complaint channel between agents via structured files.

### Complaint Types

```typescript
type ComplaintType =
  | 'pattern_violation'    // Code doesn't follow patterns
  | 'security_issue'       // Vulnerability found
  | 'performance_issue'    // Slow queries, memory leaks
  | 'test_failure'         // Tests failing
  | 'api_mismatch'         // Contract broken
  | 'dependency_conflict'  // Package issues
  | 'missing_documentation'
  | 'seo_violation'        // SEO requirements not met
  | 'accessibility_issue'  // a11y problems
  | 'technical_debt'
  | 'blocked'              // Agent stuck
  | 'suggestion';          // Improvement idea
```

### Database Tables

#### webmcp_complaints
```sql
CREATE TABLE webmcp_complaints (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,

  from_agent_id BIGINT REFERENCES swarm_agents(id),
  from_agent_type VARCHAR(50),
  source_task_id BIGINT REFERENCES swarm_tasks(id),

  complaint_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',  -- critical, high, medium, low, info
  status VARCHAR(20) DEFAULT 'open',      -- open, acknowledged, in_progress, resolved

  title TEXT NOT NULL,
  description TEXT,
  location JSONB,            -- { files[], lines[], endpoints[] }
  evidence TEXT,

  suggested_fix TEXT,
  suggested_assignee VARCHAR(50),

  assigned_to_agent_id BIGINT REFERENCES swarm_agents(id),
  assigned_agent_type VARCHAR(50),

  resolution TEXT,
  resolved_by_agent_id BIGINT REFERENCES swarm_agents(id),
  resolved_at TIMESTAMP,

  memory_id BIGINT,
  impact_score INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### webmcp_threads
```sql
CREATE TABLE webmcp_threads (
  id BIGSERIAL PRIMARY KEY,
  complaint_id BIGINT REFERENCES webmcp_complaints(id) ON DELETE CASCADE,

  agent_id BIGINT REFERENCES swarm_agents(id),
  agent_type VARCHAR(50),

  message TEXT,
  message_type VARCHAR(20),  -- comment, status_update, question, answer

  created_at TIMESTAMP DEFAULT NOW()
);
```

### Complaint Flow

```
Agent detects issue
        │
        ▼
┌─────────────────┐
│ File Complaint  │
│ - Type          │
│ - Severity      │
│ - Evidence      │
│ - Suggested fix │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ webMCP Router   │
│ - Calculate     │
│   impact        │
│ - Auto-assign   │
│ - Notify        │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Assigned Agent  │
│ - Load context  │
│ - Implement fix │
│ - Resolve       │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Memory Update   │
│ - Extract       │
│   learning      │
│ - Update state  │
│ - Notify        │
│   original      │
│   agent         │
└─────────────────┘
```

---

## Layer 4: Session Context Injection

### Startup Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   NEW SESSION START                                      │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Load Project State                                                    │
│    - Current files and their purposes                                    │
│    - All API endpoints and contracts                                     │
│    - Active patterns and where they're used                              │
│    - Config (slugs, SEO settings, etc.)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. Semantic Search Recent Context                                        │
│    - Last N conversation turns                                           │
│    - Unresolved issues                                                   │
│    - Recent decisions                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. Inject Context into System Prompt                                     │
│                                                                          │
│    "You are continuing work on [app_name].                               │
│                                                                          │
│     CURRENT STATE:                                                       │
│     - Files: [list with purposes]                                        │
│     - API Endpoints: [list with contracts]                               │
│     - Recent work: [last turns summary]                                  │
│     - Open issues: [any unresolved]                                      │
│                                                                          │
│     PATTERNS TO FOLLOW:                                                  │
│     - SEO: [pattern details]                                             │
│     - Routing: [slug config]                                             │
│                                                                          │
│     RECENT DECISIONS:                                                    │
│     - [date]: [decision] because [rationale]"                            │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. Ready to Work                                                         │
│    AI has full context, no re-explanation needed                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Memory APIs
- `GET /api/builder/memory` - Search/list memories
- `POST /api/builder/memory` - Create memory
- `GET /api/builder/project-state` - Get current project state
- `PATCH /api/builder/project-state` - Update project state

### Swarm APIs
- `POST /api/swarm/tasks` - Create task
- `GET /api/swarm/tasks` - List tasks
- `PATCH /api/swarm/tasks/:id` - Update task
- `GET /api/swarm/agents` - List agents
- `POST /api/swarm/agents/:id/heartbeat` - Agent heartbeat

### webMCP APIs
- `POST /api/webmcp/complaints` - File complaint
- `GET /api/webmcp/complaints` - List complaints
- `PATCH /api/webmcp/complaints/:id/resolve` - Resolve complaint
- `POST /api/webmcp/complaints/:id/thread` - Add thread message
- `GET /api/webmcp/complaints/stats` - Dashboard stats

---

## UI Components

### Builder Agent Panel
- Active swarm visualization
- Task progress tracking
- Agent status indicators

### Memory Browser
- Search across all memories
- Filter by tags, scope, feature
- View conversation history

### Complaints Panel (webMCP)
- Open complaints list
- Resolution history
- Stats dashboard

### Preview Panel
- Live app preview
- Console output
- Error display

---

## Success Criteria

1. **No Lost Context** - Every session starts with full project history
2. **No Repetition** - User never explains the same thing twice
3. **Parallel Execution** - Multiple agents work simultaneously
4. **Formal Feedback** - Issues are tracked and resolved systematically
5. **Learning System** - Every resolution improves future sessions

---

## Implementation Priority

1. **Phase 1**: Memory layer (memoria tables + project_states)
2. **Phase 2**: Session context injection
3. **Phase 3**: Swarm orchestration
4. **Phase 4**: webMCP complaints
5. **Phase 5**: UI dashboards

---

## Full Circle: Dev to Live

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   IDEA   │───▶│  BUILD   │───▶│  TEST    │───▶│  REVIEW  │───▶│  DEPLOY  │
│          │    │          │    │          │    │          │    │          │
│ Orchestrator│ │Architect │    │ Tester   │    │ Reviewer │    │  Live    │
│ receives  │    │ Coder    │    │          │    │          │    │ Monitor  │
│ request   │    │          │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │              │               │               │               │
     └──────────────┴───────────────┴───────────────┴───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ MEMORY UPDATED  │
                    │ at every step   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ NEXT SESSION    │
                    │ has full context│
                    └─────────────────┘
```

Every step of the lifecycle feeds back into memory, ensuring the next session - or the next feature - starts with complete context.
