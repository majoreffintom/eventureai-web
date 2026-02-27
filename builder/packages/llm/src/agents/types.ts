import { Message, ToolDefinition, StreamCallbacks } from "../types.js";

/**
 * Configuration for creating an agent
 */
export interface AgentConfig {
  name: string;
  description?: string;
  systemPrompt: string;
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * Options for agent execution
 */
export interface AgentExecuteOptions {
  messages: Message[];
  systemPromptOverride?: string;
  toolsOverride?: ToolDefinition[];
  maxTokensOverride?: number;
  temperatureOverride?: number;
  modelOverride?: string;
  stream?: boolean;
  callbacks?: StreamCallbacks;
}

/**
 * Result of agent execution
 */
export interface AgentResult {
  message: Message;
  conversationId?: string;
  toolCalls?: ToolCallResult[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Result of a tool call
 */
export interface ToolCallResult {
  toolName: string;
  toolUseId: string;
  input: unknown;
  output: unknown;
  isError?: boolean;
}

/**
 * State of an agent during execution
 */
export type AgentState = "idle" | "thinking" | "tool_use" | "responding" | "error";

/**
 * Event emitted by agent during lifecycle
 */
export type AgentEvent =
  | { type: "state_change"; state: AgentState }
  | { type: "message"; message: Message }
  | { type: "tool_call"; toolName: string; toolUseId: string; input: unknown }
  | { type: "tool_result"; toolUseId: string; result: unknown; isError?: boolean }
  | { type: "error"; error: Error };

/**
 * Callback for agent events
 */
export type AgentEventHandler = (event: AgentEvent) => void;

/**
 * Agent capabilities metadata
 */
export interface AgentCapabilities {
  supportsStreaming: boolean;
  supportsToolUse: boolean;
  supportsVision: boolean;
  maxContextLength: number;
}

/**
 * Agent statistics
 */
export interface AgentStats {
  totalMessages: number;
  totalToolCalls: number;
  totalTokensUsed: number;
  averageResponseTime: number;
  lastExecutionTime?: Date;
}
