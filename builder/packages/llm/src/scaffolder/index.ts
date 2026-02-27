/**
 * Scaffolder module for @eventureai/builder-llm
 *
 * Provides AI-powered project scaffolding capabilities.
 *
 * @module scaffolder
 */

export {
  generateProject,
  createScaffolder,
} from "./generator.js";

export type {
  ScaffolderConfig,
  ProjectSchema,
  AIGeneratedTemplate,
  TemplateFile,
} from "./types.js";
