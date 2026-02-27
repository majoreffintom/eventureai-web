import { z } from "zod";

// ============================================================================
// Scaffolder Types
// ============================================================================

/**
 * Template file structure for scaffolding
 */
export interface TemplateFile {
  path: string;
  content: string;
  type: "file" | "directory";
}

/**
 * AI-generated template structure
 */
export interface AIGeneratedTemplate {
  name: string;
  description: string;
  files: TemplateFile[];
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

/**
 * Scaffolder configuration
 */
export interface ScaffolderConfig {
  /** System prompt for the AI */
  systemPrompt?: string;
  /** Model to use for generation */
  model?: string;
  /** Max tokens for generation */
  maxTokens?: number;
  /** Temperature for generation */
  temperature?: number;
  /** Working directory for output */
  outputDir?: string;
  /** Callback for streaming events */
  onEvent?: ScaffolderEventCallback;
}

/**
 * Scaffolder options for a single generation
 */
export interface ScaffolderOptions {
  /** Name of the project */
  name: string;
  /** Description of what to build */
  description: string;
  /** Features to include */
  features?: string[];
  /** Template type to base off of */
  baseTemplate?: string;
  /** Output directory override */
  outputDir?: string;
}

/**
 * Result of scaffolding operation
 */
export interface ScaffolderResult {
  /** Whether the operation was successful */
  success: boolean;
  /** The generated template */
  template?: AIGeneratedTemplate;
  /** Files that were created */
  filesCreated?: string[];
  /** Error message if failed */
  error?: string;
  /** Token usage */
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  /** Latency in milliseconds */
  latencyMs?: number;
}

/**
 * Event types for scaffolder
 */
export type ScaffolderEvent =
  | { type: "start"; options: ScaffolderOptions }
  | { type: "generating"; message: string }
  | { type: "file_created"; path: string }
  | { type: "complete"; result: ScaffolderResult }
  | { type: "error"; error: string };

/**
 * Callback for scaffolder events
 */
export type ScaffolderEventCallback = (event: ScaffolderEvent) => void;

/**
 * Default system prompt for the scaffolder
 */
export const DEFAULT_SCAFFOLDER_PROMPT = `You are an AI project scaffolder. Your job is to generate complete, production-ready project files based on the user's description.

When generating a project:
1. Create a well-organized directory structure
2. Include all necessary configuration files (package.json, tsconfig.json, etc.)
3. Create a main entry point
4. Include a README.md with instructions
5. Use modern best practices
6. Make sure all imports and references are correct

You must respond with a valid JSON object containing the project structure.`;

/**
 * Schema for AI-generated project response
 */
export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
      type: z.enum(["file", "directory"]).default("file"),
    })
  ),
  dependencies: z.record(z.string(), z.string()).optional(),
  scripts: z.record(z.string(), z.string()).optional(),
});
