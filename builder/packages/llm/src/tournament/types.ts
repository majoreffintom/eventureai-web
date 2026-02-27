import { Message, ToolDefinition } from "../types.js";

// ============================================================================
// Tournament Types
// ============================================================================

/**
 * Supported LLM providers in tournaments
 */
export type LLMProvider =
  | "anthropic"
  | "openai"
  | "google"
  | "groq"
  | "xai"
  | "cohere";

/**
 * Model configuration for tournament participant
 */
export interface TournamentModel {
  provider: LLMProvider;
  model: string;
  name: string; // Display name
  enabled: boolean;
}

/**
 * Tournament configuration
 */
export interface TournamentConfig {
  id?: string;
  prompt: string;
  models: TournamentModel[];
  debateMode: boolean;
  rounds: number;
  systemPrompt?: string;
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

/**
 * Individual model response in a tournament
 */
export interface TournamentResponse {
  modelId: string;
  provider: LLMProvider;
  model: string;
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  latencyMs: number;
  cost?: number;
  error?: string;
  timestamp: Date;
}

/**
 * Debate message between models
 */
export interface DebateMessage {
  round: number;
  modelId: string;
  content: string;
  respondingTo?: string; // Model ID being responded to
}

/**
 * Vote in a tournament
 */
export interface TournamentVote {
  voterId: string; // User or agent ID
  votedForModelId: string;
  reason?: string;
  timestamp: Date;
}

/**
 * Tournament state
 */
export type TournamentState =
  | "pending"
  | "running"
  | "debating"
  | "voting"
  | "completed"
  | "error";

/**
 * Tournament status/result
 */
export interface TournamentStatus {
  id: string;
  config: TournamentConfig;
  state: TournamentState;
  responses: TournamentResponse[];
  debateHistory: DebateMessage[];
  votes: TournamentVote[];
  winner?: string; // Model ID
  currentRound: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Callback for tournament events
 */
export type TournamentEventCallback = (event: TournamentEvent) => void;

/**
 * Tournament event types
 */
export type TournamentEvent =
  | { type: "tournament_start"; tournamentId: string }
  | { type: "model_start"; modelId: string; provider: LLMProvider; model: string }
  | { type: "model_complete"; modelId: string; response: TournamentResponse }
  | { type: "model_error"; modelId: string; error: string }
  | { type: "round_complete"; round: number; responses: TournamentResponse[] }
  | { type: "debate_start"; round: number }
  | { type: "debate_message"; message: DebateMessage }
  | { type: "voting_start" }
  | { type: "vote_cast"; vote: TournamentVote }
  | { type: "tournament_complete"; winner?: string; status: TournamentStatus }
  | { type: "tournament_error"; error: string };

/**
 * Default models available for tournaments
 */
export const DEFAULT_TOURNAMENT_MODELS: TournamentModel[] = [
  {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    enabled: true,
  },
  {
    provider: "anthropic",
    model: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    enabled: true,
  },
  {
    provider: "openai",
    model: "gpt-4o",
    name: "GPT-4o",
    enabled: false,
  },
  {
    provider: "openai",
    model: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    enabled: false,
  },
  {
    provider: "google",
    model: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    enabled: false,
  },
  {
    provider: "google",
    model: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    enabled: false,
  },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    enabled: false,
  },
  {
    provider: "xai",
    model: "grok-beta",
    name: "Grok Beta",
    enabled: false,
  },
];

/**
 * Cost per 1M tokens (in cents) for each model
 */
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 300, output: 1500 },
  "claude-opus-4-20250514": { input: 1500, output: 7500 },
  "gpt-4o": { input: 250, output: 1000 },
  "gpt-4-turbo": { input: 1000, output: 3000 },
  "gemini-1.5-pro": { input: 175, output: 700 },
  "gemini-2.0-flash": { input: 10, output: 40 },
  "llama-3.3-70b-versatile": { input: 59, output: 79 },
  "grok-beta": { input: 500, output: 1500 },
};

/**
 * Calculate cost in cents for a response
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];
  if (!costs) return 0;

  const inputCost = (inputTokens / 1000000) * costs.input;
  const outputCost = (outputTokens / 1000000) * costs.output;

  return Math.ceil(inputCost + outputCost);
}
