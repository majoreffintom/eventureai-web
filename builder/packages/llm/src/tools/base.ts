import { z } from "zod";
import { ToolDefinition, ToolInputSchema, ToolExecutionContext } from "../types.js";

/**
 * Helper function to define a tool with type safety
 * @param config - Tool configuration
 * @returns ToolDefinition instance
 */
export function defineTool<TInput, TOutput>(
  config: {
    name: string;
    description: string;
    inputSchema: ToolInputSchema;
    execute: (input: TInput, context?: ToolExecutionContext) => Promise<TOutput> | TOutput;
  }
): ToolDefinition<TInput, TOutput> {
  return {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    execute: config.execute,
  };
}

/**
 * Create a simple tool with minimal configuration
 * @param name - Tool name
 * @param description - Tool description
 * @param inputSchema - Zod schema for input validation
 * @param handler - Function to execute
 * @returns ToolDefinition instance
 */
export function createTool<T>(
  name: string,
  description: string,
  inputSchema: z.ZodType<T>,
  handler: (input: T) => Promise<unknown> | unknown
): ToolDefinition<T, unknown> {
  return defineTool({
    name,
    description,
    inputSchema,
    execute: handler,
  });
}

/**
 * Validate tool input against schema
 * @param tool - Tool definition
 * @param input - Raw input to validate
 * @returns Validated input or throws error
 */
export function validateToolInput<T>(
  tool: ToolDefinition<T, unknown>,
  input: unknown
): T {
  const result = tool.inputSchema.safeParse(input);
  if (!result.success) {
    throw new ToolValidationError(
      tool.name,
      result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
    );
  }
  return result.data as T;
}

/**
 * Error thrown when tool input validation fails
 */
export class ToolValidationError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly validationError: string
  ) {
    super(`Tool "${toolName}" validation failed: ${validationError}`);
    this.name = "ToolValidationError";
  }
}

/**
 * Error thrown when tool execution fails
 */
export class ToolExecutionError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly cause: Error
  ) {
    super(`Tool "${toolName}" execution failed: ${cause.message}`);
    this.name = "ToolExecutionError";
  }
}

/**
 * Execute a tool with proper error handling
 * @param tool - Tool definition
 * @param input - Raw input to validate and execute
 * @param context - Optional execution context
 * @returns Tool result or throws error
 */
export async function executeTool<TInput, TOutput>(
  tool: ToolDefinition<TInput, TOutput>,
  input: unknown,
  context?: ToolExecutionContext
): Promise<TOutput> {
  const validatedInput = validateToolInput(tool, input);

  try {
    const result = await tool.execute(validatedInput, context);
    return result;
  } catch (error) {
    if (error instanceof ToolValidationError) {
      throw error;
    }
    throw new ToolExecutionError(
      tool.name,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Tool builder class for fluent tool creation
 */
export class ToolBuilder<TInput = unknown, TOutput = unknown> {
  private _name?: string;
  private _description?: string;
  private _inputSchema?: ToolInputSchema;
  private _execute?: (input: TInput, context?: ToolExecutionContext) => Promise<TOutput> | TOutput;

  name(name: string): this {
    this._name = name;
    return this;
  }

  description(description: string): this {
    this._description = description;
    return this;
  }

  input<T>(schema: z.ZodType<T>): ToolBuilder<T, TOutput> {
    this._inputSchema = schema;
    return this as unknown as ToolBuilder<T, TOutput>;
  }

  handler(handler: (input: TInput, context?: ToolExecutionContext) => Promise<TOutput> | TOutput): this {
    this._execute = handler;
    return this;
  }

  build(): ToolDefinition<TInput, TOutput> {
    if (!this._name) {
      throw new Error("Tool name is required");
    }
    if (!this._description) {
      throw new Error("Tool description is required");
    }
    if (!this._inputSchema) {
      throw new Error("Tool input schema is required");
    }
    if (!this._execute) {
      throw new Error("Tool execute handler is required");
    }

    return {
      name: this._name,
      description: this._description,
      inputSchema: this._inputSchema,
      execute: this._execute,
    };
  }
}

/**
 * Create a new tool builder instance
 */
export function tool(): ToolBuilder {
  return new ToolBuilder();
}
