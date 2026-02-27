export interface Tenant {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  domain: string | null;
  is_active: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface App {
  id: number;
  title: string;
  summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: number;
  user_id: number;
  title: string;
  summary: string | null;
  status: string;
  app_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: number;
  workspace_id: number | null;
  user_id: number | null;
  title: string | null;
  content: string | null;
  memory_type: string | null;
  tags: string[] | null;
  domain: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface LLMTournament {
  id: number;
  app_id: number | null;
  workspace_id: number | null;
  user_id: number | null;
  prompt: string | null;
  debate_mode: boolean;
  rounds: number;
  models_used: string[] | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface LLMResponse {
  id: number;
  tournament_id: number | null;
  model_key: string | null;
  model_provider: string | null;
  content: string | null;
  picked: boolean;
  interesting: boolean;
  created_at: string;
}

export interface MoriErrorChain {
  id: number;
  app_id: number | null;
  workspace_id: number | null;
  title: string | null;
  status: string | null;
  severity: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoriSolution {
  id: number;
  chain_id: number | null;
  root_cause: string | null;
  solution_text: string | null;
  prevention: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  category: string | null;
  verified: boolean | null;
}
