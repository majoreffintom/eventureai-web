/**
 * Tools module for @eventureai/builder-llm
 *
 * Provides utilities for defining, validating, and executing tools
 * that can be used with Anthropic Claude's tool use feature.
 */

export {
  defineTool,
  createTool,
  validateToolInput,
  executeTool,
  ToolBuilder,
  tool,
  ToolValidationError,
  ToolExecutionError,
} from "./base.js";

export { builtinTools } from "./builtin/index.js";

export type { ToolDefinition, ToolInputSchema, ToolConfig, ToolExecutionContext } from "../types.js";
