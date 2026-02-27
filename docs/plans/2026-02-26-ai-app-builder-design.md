# AI App Builder Design

**Date:** 2026-02-26
**Status:** Approved
**Goal:** Build a system that takes natural language prompts and/or URLs, generates complete web and/or Expo apps, and deploys them turnkey through the Mori platform.

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      MORI AI APP BUILDER                         │
│                   "From idea to production in minutes"           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   INPUT                    ENGINE                OUTPUT           │
│   ─────                    ───────               ──────           │
│   • Natural language  →    Agent         →      • Web app        │
│   • URL to clone           Orchestrator         • Expo app       │
│   • Both combined          (5 LLMs)             • Or both        │
│                                                  ↓               │
│                                            DEPLOYED              │
│                                            • Mori hosting        │
│                                            • Custom domain       │
│                                            • Monitoring          │
│                                            • SSL/CDN             │
└──────────────────────────────────────────────────────────────────┘
```

### Core Capabilities

1. **Hybrid input** - URL extracts patterns, prompt adds customization
2. **Multi-LLM orchestration** - Swarm, Pipeline, or Tournament modes
3. **Full-stack generation** - Web (React Router + Hono) and/or Expo
4. **Turnkey deployment** - Mori platform handles hosting, domains, monitoring
5. **Dual interface** - CLI for power users, Web UI for visual users

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INTERFACES                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │   CLI            │  │   Web UI         │  │   API            │      │
│  │   mori build     │  │   /app-builder   │  │   POST /build    │      │
│  │   mori clone     │  │                  │  │                  │      │
│  │   mori deploy    │  │                  │  │                  │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           └──────────────────────┼──────────────────────┘               │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        BUILD ORCHESTRATOR                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  • Parses input (URL + prompt)                                   │    │
│  │  • Selects orchestration mode (swarm/pipeline/tournament)        │    │
│  │  • Coordinates agent execution                                   │    │
│  │  • Manages build state and progress                              │    │
│  │  • Emits real-time events (SSE/WebSocket)                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           AGENT LAYER                                     │
│                                                                           │
│  SPECIALIZED AGENTS (each backed by optimal LLM)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  ANALYST    │ │  ARCHITECT  │ │   CLONER    │ │   CODER     │        │
│  │  Anthropic  │ │   OpenAI    │ │    xAI      │ │  Anthropic  │        │
│  │             │ │             │ │             │ │             │        │
│  │ • Analyze   │ │ • System    │ │ • Scrape    │ │ • Generate  │        │
│  │   prompts   │ │   design    │ │ • Extract   │ │   code      │        │
│  │ • Extract   │ │ • API       │ │ • Recreate  │ │ • Components│        │
│  │   intent    │ │   contracts │ │   patterns  │ │ • Pages     │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  DESIGNER   │ │  REVIEWER   │ │  TESTER     │ │  DEPLOYER   │        │
│  │   Google    │ │    Groq     │ │   Groq      │ │  Anthropic  │        │
│  │             │ │             │ │             │ │             │        │
│  │ • UI/UX     │ │ • Code      │ │ • Generate  │ │ • Build     │        │
│  │ • Styles    │ │   review    │ │   tests     │ │ • Deploy    │        │
│  │ • Layouts   │ │ • Security  │ │ • Run tests │ │ • Configure │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                                           │
│  ORCHESTRATION MODES (user selectable)                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│  │     SWARM       │ │    PIPELINE     │ │   TOURNAMENT    │            │
│  │                 │ │                 │ │                 │            │
│  │ Agents work     │ │ Sequential      │ │ Agents compete  │            │
│  │ in parallel,    │ │ stages:         │ │ on tasks,       │            │
│  │ coordinator     │ │ Plan→Design→    │ │ best wins or    │            │
│  │ merges results  │ │ Build→Deploy    │ │ merges          │            │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘            │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           MCP TOOL LAYER                                  │
│                                                                           │
│  BROWSER          FILE           GIT           DEPLOY                    │
│  ───────          ────           ───           ─────                     │
│  • navigate       • read         • init        • build                   │
│  • click          • write        • commit      • deploy                  │
│  • screenshot     • mkdir        • push        • configure               │
│  • extract        • rm           • branch      • monitor                 │
│  • scroll         • glob         • merge       • scale                   │
│  • auth           • watch        • diff        • rollback                │
│                                                                           │
│  WEBSITE CLONE                CODE GENERATE              VALIDATE         │
│  ─────────────                ────────────              ────────         │
│  • crawl pages                • scaffold                 • lint           │
│  • extract DOM                • component                • typecheck      │
│  • analyze styles             • page                     • test           │
│  • detect patterns            • api                      • build          │
│  • recreate flows             • database                 • preview        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Integration & Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        TENANT CONTEXT                                     │
│                                                                           │
│  User Request: "Clone airbnb.com for pet sitting"                        │
│       +                                                                   │
│  Tenant: lumina (mori_sk_lumina_...)                                     │
│       ↓                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  BUILD CONTEXT                                                   │    │
│  │  • tenant_id: 4                                                  │    │
│  │  • tenant_slug: lumina                                           │    │
│  │  • api_key: mori_sk_lumina_...                                   │    │
│  │  • limits: { builds_per_month: 50, domains: 5 }                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        BUILD FLOW                                         │
│                                                                           │
│  1. PARSE INPUT                                                          │
│     ┌──────────────┐     ┌──────────────┐                               │
│     │ airbnb.com   │ ──→ │ URL Handler  │ → Extract structure/patterns  │
│     └──────────────┘     └──────────────┘                               │
│     ┌──────────────┐     ┌──────────────┐                               │
│     │"for pets"    │ ──→ │ Prompt Parser│ → Extract intent/customize    │
│     └──────────────┘     └──────────────┘                               │
│                                                                           │
│  2. ANALYZE & PLAN                                                       │
│     ┌──────────────────────────────────────────────────────────┐        │
│     │  ANALYST AGENT (Claude via mori_sk_lumina)               │        │
│     │  • Detect app type: marketplace                          │        │
│     │  • Core features: listings, search, booking, reviews     │        │
│     │  • Customization: pets instead of rentals                │        │
│     │  → Output: Build spec JSON                               │        │
│     └──────────────────────────────────────────────────────────┘        │
│                                                                           │
│  3. CLONE & DESIGN                                                       │
│     ┌──────────────────────────────────────────────────────────┐        │
│     │  CLONER AGENT (Grok via mori_sk_lumina)                  │        │
│     │  • MCP tools: navigate, screenshot, extract DOM          │        │
│     │  • Crawl airbnb.com pages                                │        │
│     │  • Extract: layouts, components, flows, styles           │        │
│     │  → Output: Design system JSON + component templates      │        │
│     └──────────────────────────────────────────────────────────┘        │
│     ┌──────────────────────────────────────────────────────────┐        │
│     │  DESIGNER AGENT (Gemini via mori_sk_lumina)              │        │
│     │  • Adapt extracted patterns for "pet sitting" domain     │        │
│     │  • Generate color scheme, typography, icons              │        │
│     │  → Output: Styled component specs                        │        │
│     └──────────────────────────────────────────────────────────┘        │
│                                                                           │
│  4. ARCHITECT & BUILD                                                    │
│     ┌──────────────────────────────────────────────────────────┐        │
│     │  ARCHITECT AGENT (GPT-4 via mori_sk_lumina)              │        │
│     │  • Design database schema                                │        │
│     │  • Plan API routes                                       │        │
│     │  • Define auth flow                                      │        │
│     │  → Output: Architecture spec                             │        │
│     └──────────────────────────────────────────────────────────┘        │
│     ┌──────────────────────────────────────────────────────────┐        │
│     │  CODER AGENT (Claude via mori_sk_lumina)                 │        │
│     │  • Generate file structure                               │        │
│     │  • Write components, pages, APIs                         │        │
│     │  • Create database migrations                            │        │
│     │  → Output: Complete codebase                             │        │
│     └──────────────────────────────────────────────────────────┘        │
│                                                                           │
│  5. REVIEW & TEST                                                        │
│     ┌──────────────────────────────────────────────────────────┐        │
│     │  REVIEWER AGENT (Groq via mori_sk_lumina)                │        │
│     │  • Security scan                                         │        │
│     │  • Code quality check                                    │        │
│     │  → Output: Issues list + fixes                           │        │
│     └──────────────────────────────────────────────────────────┘        │
│     ┌──────────────────────────────────────────────────────────┐        │
│     │  TESTER AGENT (Groq via mori_sk_lumina)                  │        │
│     │  • Generate tests                                        │        │
│     │  • Run test suite                                        │        │
│     │  → Output: Test results + coverage                       │        │
│     └──────────────────────────────────────────────────────────┘        │
│                                                                           │
│  6. DEPLOY                                                               │
│     ┌──────────────────────────────────────────────────────────┐        │
│     │  DEPLOYER AGENT (Claude via mori_sk_lumina)              │        │
│     │  • Build production bundle                               │        │
│     │  • Deploy to Mori hosting                                │        │
│     │  • Configure domain (petsitter.lumina.mori.dev)          │        │
│     │  • Setup SSL, CDN, monitoring                            │        │
│     │  → Output: Live URL + dashboard                          │        │
│     └──────────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
```

### Tenant-Aware Features

- All LLM calls route through tenant's Mori API key
- Usage logged per tenant for billing
- Generated apps can use tenant's proxy services (email, payments, SMS)
- Subdomain allocation: `{app}.{tenant}.mori.dev`

---

## MCP Tool Layer

### Browser Automation

| Tier | Tools | Description |
|------|-------|-------------|
| **Basic Navigation** | `browser_navigate`, `browser_screenshot`, `browser_wait` | goto, back, forward, reload, screenshots |
| **Interaction** | `browser_click`, `browser_type`, `browser_scroll`, `browser_hover`, `browser_select`, `browser_upload` | Click, type, scroll, form interactions |
| **Extraction** | `browser_html`, `browser_text`, `browser_links`, `browser_forms`, `browser_data`, `browser_styles` | Extract DOM, text, links, forms, data, styles |
| **Advanced** | `browser_auth`, `browser_crawl`, `browser_stealth` | Login flows, multi-page crawling, bot bypass |

### Code Generation

| Category | Tools |
|----------|-------|
| **Scaffolding** | `scaffold_project`, `scaffold_page`, `scaffold_api` |
| **File Operations** | `file_read`, `file_write`, `file_delete`, `file_glob`, `file_mkdir`, `file_copy` |

### Website Cloning

| Tool | Purpose |
|------|---------|
| `clone_analyze` | Detect app type, patterns, features, complexity |
| `clone_structure` | Extract routes, pages, components, hierarchy |
| `clone_design` | Extract colors, fonts, spacing, components |
| `clone_flows` | Extract auth, checkout, search flows |
| `clone_data` | Extract schemas, sample data, relationships |

### Deployment

| Tool | Purpose |
|------|---------|
| `deploy_build` | Build production bundle |
| `deploy_push` | Push to Mori infrastructure |
| `deploy_release` | Release to live |
| `domain_assign` | Assign subdomain or custom domain |
| `ssl_configure` | Configure SSL certificates |
| `monitor_setup` | Setup health checks, alerts, logs |

---

## Interfaces

### CLI Commands

```bash
# Build from prompt
mori build "SaaS dashboard with auth and billing" --deploy

# Clone + customize
mori clone airbnb.com --customize "for pet sitting" --target both

# Interactive session
mori chat --tenant lumina

# Tournament mode
mori build "E-commerce store" --mode tournament --models all

# Deploy existing
mori deploy ./my-app --domain custom.com

# Manage apps
mori apps --status running
mori logs <app-id> --follow
```

### CLI Options

| Flag | Description |
|------|-------------|
| `--url <url>` | Clone URL + customize |
| `--target web\|expo\|both` | Output targets |
| `--mode swarm\|pipeline\|tournament` | Orchestration mode |
| `--tenant <slug>` | Tenant context |
| `--deploy` | Auto-deploy after build |
| `--interactive` | Guided wizard mode |

### Web UI

Route: `/app-builder`

Components:
- **InputPanel** - URL input + natural language prompt
- **ConfigPanel** - Target, orchestration, workflow selection
- **ProgressPanel** - Real-time build progress with agent stages
- **PreviewPanel** - Live preview of generated app
- **DeployPanel** - Deploy to staging/production

---

## Mori Platform Deployment

### Infrastructure

```
CDN (Cloudflare) → Edge → SSL (Auto-cert)
         ↓
    Load Balancer
         ↓
   App Pods (Containers)
         ↓
PostgreSQL | Redis | File Store
```

### Domain Patterns

| Environment | Pattern |
|-------------|---------|
| Preview | `{app}.{tenant}.mori.dev` |
| Staging | `{app}-staging.{tenant}.mori.dev` |
| Production | `{app}.{tenant}.mori.app` |
| Custom | User's custom domain |

### Deployment Pipeline

```
BUILD → STAGE → PREVIEW → DEPLOY → MONITOR
  │        │         │         │         │
  ▼        ▼         ▼         ▼         ▼
build    env      ephemeral  container  health
lint     vars        URL      scale     alerts
test    secrets     live     persist    logs
```

### Monitoring

- Health checks: `/health`, `/ready`, `/metrics`
- Logging: Request logs, error traces, performance
- Alerting: Email, Slack webhook, SMS for critical
- Dashboard: Response time, error rate, requests, active users

---

## Database Schema

### builds

```sql
CREATE TABLE builds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  app_id          UUID REFERENCES apps(id),
  prompt          TEXT,
  clone_url       TEXT,
  clone_options   JSONB DEFAULT '{}',
  target          TEXT[] DEFAULT '{web}',
  orchestration   TEXT DEFAULT 'swarm',
  workflow        TEXT DEFAULT 'guided',
  models          JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'pending',
  current_stage   TEXT,
  current_agent   TEXT,
  progress        INTEGER DEFAULT 0,
  error           TEXT,
  spec            JSONB,
  file_count      INTEGER,
  preview_url     TEXT,
  tokens_used     INTEGER DEFAULT 0,
  duration_ms     INTEGER,
  cost_cents      INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
```

### build_stages

```sql
CREATE TABLE build_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id        UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  stage           TEXT NOT NULL,
  agent           TEXT NOT NULL,
  model           TEXT,
  status          TEXT DEFAULT 'pending',
  input           JSONB,
  output          JSONB,
  error           TEXT,
  tokens_used     INTEGER DEFAULT 0,
  duration_ms     INTEGER,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### build_files

```sql
CREATE TABLE build_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id        UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  path            TEXT NOT NULL,
  content         TEXT,
  language        TEXT,
  size_bytes      INTEGER,
  generated_by    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### deployments

```sql
CREATE TABLE deployments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  app_id          UUID NOT NULL REFERENCES apps(id),
  build_id        UUID REFERENCES builds(id),
  version         INTEGER NOT NULL DEFAULT 1,
  environment     TEXT NOT NULL,
  subdomain       TEXT,
  custom_domain   TEXT,
  url             TEXT,
  status          TEXT DEFAULT 'pending',
  error           TEXT,
  container_id    TEXT,
  replicas        INTEGER DEFAULT 1,
  build_duration_ms INTEGER,
  image_size_mb   INTEGER,
  deployed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### domains

```sql
CREATE TABLE domains (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  deployment_id   UUID REFERENCES deployments(id),
  domain          TEXT NOT NULL,
  type            TEXT NOT NULL,
  verified        BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  ssl_status      TEXT DEFAULT 'pending',
  ssl_expires_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  verified_at     TIMESTAMPTZ
);
```

### build_events

```sql
CREATE TABLE build_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id        UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  stage           TEXT,
  agent           TEXT,
  message         TEXT,
  data            JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Builds

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/builds` | Create new build |
| GET | `/api/builds` | List builds |
| GET | `/api/builds/:id` | Get build details |
| GET | `/api/builds/:id/stream` | SSE stream for progress |
| POST | `/api/builds/:id/cancel` | Cancel running build |
| GET | `/api/builds/:id/files` | List generated files |
| GET | `/api/builds/:id/files/:path` | Get file content |

### Clone Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clone/analyze` | Analyze URL before building |
| POST | `/api/clone/preview` | Preview extraction |

### Deployments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deployments` | Create deployment |
| GET | `/api/deployments` | List deployments |
| GET | `/api/deployments/:id` | Get deployment details |
| POST | `/api/deployments/:id/rollback` | Rollback to previous version |
| POST | `/api/deployments/:id/scale` | Scale replicas |

### Domains

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/domains` | Add custom domain |
| POST | `/api/domains/:id/verify` | Verify domain ownership |
| GET | `/api/domains` | List domains |
| DELETE | `/api/domains/:id` | Remove domain |

### Apps

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/apps` | List tenant's apps |
| GET | `/api/apps/:id` | Get app details |
| GET | `/api/apps/:id/logs` | Stream logs (SSE) |
| GET | `/api/apps/:id/metrics` | Get metrics |
| POST | `/api/apps/:id/stop` | Stop app |
| POST | `/api/apps/:id/start` | Start app |
| DELETE | `/api/apps/:id` | Delete app |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Interactive build mode |

---

## File Structure

```
builder/
├── packages/
│   ├── cli/
│   │   └── src/commands/
│   │       ├── build.ts
│   │       ├── clone.ts
│   │       ├── chat.ts
│   │       ├── deploy.ts
│   │       ├── apps.ts
│   │       └── logs.ts
│   │
│   ├── llm/
│   │   └── src/
│   │       ├── agents/builder/
│   │       │   ├── analyst.ts
│   │       │   ├── architect.ts
│   │       │   ├── cloner.ts
│   │       │   ├── coder.ts
│   │       │   ├── designer.ts
│   │       │   ├── reviewer.ts
│   │       │   ├── tester.ts
│   │       │   └── deployer.ts
│   │       ├── orchestrator/
│   │       │   ├── swarm.ts
│   │       │   ├── pipeline.ts
│   │       │   └── tournament.ts
│   │       └── tools/builder/
│   │           ├── browser.ts
│   │           ├── files.ts
│   │           ├── clone.ts
│   │           └── deploy.ts
│   │
│   ├── mcp/
│   │   └── src/
│   │       ├── server.ts
│   │       ├── client.ts
│   │       └── tools/
│   │           ├── browser.ts
│   │           ├── cloning.ts
│   │           ├── scaffold.ts
│   │           └── deploy.ts
│   │
│   └── core/
│       └── src/types/
│           ├── build.ts
│           ├── agent.ts
│           └── mcp.ts
│
Dev/eventureai/
├── app/
│   ├── (dashboard)/app-builder/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── components/
│   │       ├── InputPanel.tsx
│   │       ├── ProgressPanel.tsx
│   │       ├── PreviewPanel.tsx
│   │       ├── ConfigPanel.tsx
│   │       └── DeployPanel.tsx
│   │
│   └── api/builder/
│       ├── builds/
│       ├── clone/
│       ├── deployments/
│       ├── domains/
│       └── chat/
│
└── src/lib/builder/
    ├── orchestrator.ts
    ├── mcp-client.ts
    └── templates/
```

---

## Implementation Phases

| Phase | Focus | Files |
|-------|-------|-------|
| **1** | Core types & DB | `core/src/types/*.ts`, schema migrations |
| **2** | MCP tools | `mcp/src/tools/*.ts` |
| **3** | Agents | `llm/src/agents/builder/*.ts` |
| **4** | Orchestrators | `llm/src/orchestrator/*.ts` |
| **5** | API routes | `app/api/builder/**/*.ts` |
| **6** | Web UI | `app/(dashboard)/app-builder/**/*.tsx` |
| **7** | CLI commands | `cli/src/commands/*.ts` |
