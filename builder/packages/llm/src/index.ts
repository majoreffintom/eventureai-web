/**
 * @eventureai/builder-llm
 *
 * LLM integration package for EventureAI App Builder with Anthropic Claude support.
 * Provides utilities for creating AI agents with tool use capabilities.
 *
 * @packageDocumentation
 */

// Client
export { createAnthropicClient } from "./client.js";

// Types
export type {
  // Message types
  TextBlock,
  ImageBlock,
  ToolUseBlock,
  ToolResultBlockParam,
  ContentBlock,
  BaseMessage,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  Message,
  // Tool types
  ToolInputSchema,
  ToolDefinition,
  ToolConfig,
  ToolExecutionContext,
  // Conversation types
  ConversationOptions,
  Conversation,
  // Streaming types
  StreamEvent,
  StreamCallbacks,
  // Client config types
  ClientConfig,
  ClientDefaults,
  // Model types
  ClaudeModel,
} from "./types.js";

export {
  DEFAULT_MODEL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
} from "./types.js";

// Tools
export {
  defineTool,
  createTool,
  validateToolInput,
  executeTool,
  ToolBuilder,
  tool,
  ToolValidationError,
  ToolExecutionError,
  builtinTools,
} from "./tools/index.js";

// Agents
export {
  BaseAgent,
  SimpleAgent,
  createAgent,
} from "./agents/index.js";

export type {
  AgentConfig,
  AgentExecuteOptions,
  AgentResult,
  AgentState,
  AgentEvent,
  AgentEventHandler,
  AgentCapabilities,
  AgentStats,
  ToolCallResult,
} from "./agents/index.js";

// Tournament
export {
  TournamentRunner,
  runTournament,
  createTournamentRunner,
} from "./tournament/index.js";

export type {
  LLMProvider,
  TournamentModel,
  TournamentConfig,
  TournamentResponse,
  DebateMessage,
  TournamentVote,
  TournamentState,
  TournamentStatus,
  TournamentEventCallback,
  TournamentEvent,
} from "./tournament/index.js";

export {
  DEFAULT_TOURNAMENT_MODELS,
  MODEL_COSTS,
  calculateCost,
} from "./tournament/index.js";

// Scaffolder
export {
  generateProject,
  createScaffolder,
} from "./scaffolder/index.js";

export type {
  ScaffolderConfig,
  ProjectSchema,
  AIGeneratedTemplate,
  TemplateFile,
} from "./scaffolder/index.js";

// Database Integration
export {
  db,
  createTournament,
  updateTournamentStatus,
  getTournament,
  listTournaments,
  saveLLMResponse,
  getTournamentResponses,
  pickResponse,
  createMemory,
  searchMemories,
  getMemoryCount,
  createErrorChain,
  searchErrorChains,
  getSolutionsForChain,
  createSolution,
  runTournamentWithDB,
  createDBTournamentRunner,
  createNeonClient,
  sql,
  getSQL,
} from "./db/index.js";

export type {
  DBTournament,
  DBLLMResponse,
  DBMemory,
  DBErrorChain,
  DBSolution,
  SQLQuery,
  DBClientConfig,
} from "./db/index.js";

// Billing Integration
export {
  stripe,
  stripeService,
} from "./billing/index.js";

export type {
  StripeSessionOptions,
} from "./billing/index.js";

// Mori Gateway (Multi-tenant LLM)
export {
  MoriGatewayClient,
  createMoriGateway,
  createMoriGatewayFromEnv,
} from "./gateway/index.js";

export type {
  MoriGatewayConfig,
  GatewayChatRequest,
  GatewayChatResponse,
  GatewayStreamEvent,
  GatewayStreamCallbacks,
} from "./gateway/index.js";
