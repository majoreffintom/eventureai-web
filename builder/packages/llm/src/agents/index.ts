/**
 * Agents module for @eventureai/builder-llm
 *
 * Provides base classes and utilities for creating AI agents
 * that can interact with Anthropic's Claude API.
 */

export { BaseAgent, SimpleAgent, createAgent } from "./base.js";

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
} from "./types.js";
