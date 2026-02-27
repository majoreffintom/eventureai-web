import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// ============================================================================
// Message Types
// ============================================================================

// Extract types from Anthropic SDK
export type TextBlock = Extract<Anthropic.ContentBlock, { type: "text" }>;
export type ImageBlock = Extract<Anthropic.ContentBlock, { type: "image" }>;
export type ToolUseBlock = Extract<Anthropic.ContentBlock, { type: "tool_use" }>;

// Tool result is used in message params, not in content blocks from responses
export interface ToolResultBlockParam {
  type: "tool_result";
  tool_use_id: string;
  content?: string | Anthropic.ContentBlockParam[];
  is_error?: boolean;
}

// ContentBlock for messages - use Anthropic's ContentBlock which is the response type
export type ContentBlock = Anthropic.ContentBlock;

export interface BaseMessage {
  id?: string;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface UserMessage extends BaseMessage {
  role: "user";
  content: string | (ContentBlock | ToolResultBlockParam)[];
}

export interface AssistantMessage extends BaseMessage {
  role: "assistant";
  content: string | ContentBlock[];
  stopReason?: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
}

export interface ToolResultMessage extends BaseMessage {
  role: "user";
  content: ToolResultBlockParam[];
  toolUseId: string;
  isError?: boolean;
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

// ============================================================================
// Tool Definition Types
// ============================================================================

export type ToolInputSchema = z.ZodType<unknown>;

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  execute: (input: TInput, context?: ToolExecutionContext) => Promise<TOutput> | TOutput;
}

export interface ToolConfig {
  name: string;
  description: string;
  inputSchema: Anthropic.Tool["input_schema"] | Record<string, unknown>;
}

export interface ToolExecutionContext {
  messages: Message[];
  toolUseId: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface ConversationOptions {
  id?: string;
  systemPrompt?: string;
  messages?: Message[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface Conversation {
  id: string;
  systemPrompt?: string;
  messages: Message[];
  tools: ToolDefinition[];
  maxTokens: number;
  temperature: number;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Streaming Event Types
// ============================================================================

export type StreamEvent =
  | { type: "message_start"; message: AssistantMessage }
  | { type: "content_block_start"; index: number; contentBlock: ContentBlock }
  | { type: "content_block_delta"; index: number; delta: string }
  | { type: "content_block_stop"; index: number }
  | { type: "message_delta"; delta: { stopReason?: string } }
  | { type: "message_stop" }
  | { type: "tool_use"; toolName: string; toolUseId: string; input: unknown }
  | { type: "tool_result"; toolUseId: string; result: unknown }
  | { type: "error"; error: Error };

export interface StreamCallbacks {
  onMessageStart?: (message: AssistantMessage) => void;
  onContentBlockStart?: (index: number, contentBlock: ContentBlock) => void;
  onContentBlockDelta?: (index: number, delta: string) => void;
  onContentBlockStop?: (index: number) => void;
  onMessageDelta?: (delta: { stopReason?: string }) => void;
  onMessageStop?: () => void;
  onToolUse?: (toolName: string, toolUseId: string, input: unknown) => void;
  onToolResult?: (toolUseId: string, result: unknown) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Client Configuration Types
// ============================================================================

export interface ClientConfig {
  apiKey?: string;
  baseURL?: string;
  defaultModel?: string;
  defaultMaxTokens?: number;
  defaultTemperature?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface ClientDefaults {
  model: string;
  maxTokens: number;
  temperature: number;
}

// ============================================================================
// Model Types
// ============================================================================

export type ClaudeModel =
  | "claude-sonnet-4-20250514"
  | "claude-opus-4-20250514"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-3-opus-20240229"
  | "claude-3-sonnet-20240229"
  | "claude-3-haiku-20240307";

export const DEFAULT_MODEL: ClaudeModel = "claude-sonnet-4-20250514";
export const DEFAULT_MAX_TOKENS = 4096;
export const DEFAULT_TEMPERATURE = 1.0;
