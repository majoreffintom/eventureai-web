/**
 * Built-in tools for the LLM package
 *
 * This module exports predefined tools that can be used with agents.
 * Add new built-in tools by exporting them from this file.
 */

// Example: Export built-in tools here
// export { readFileTool } from './read-file.js';
// export { writeFileTool } from './write-file.js';
// export { searchTool } from './search.js';

import { mcpTools } from "./mcp.js";

export const builtinTools = {
  ...mcpTools,
};
