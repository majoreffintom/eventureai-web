import Anthropic from "@anthropic-ai/sdk";
import {
  ClientConfig,
  ClientDefaults,
  DEFAULT_MODEL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  Message,
  ToolDefinition,
  ToolConfig,
  StreamCallbacks,
  ToolResultBlockParam,
} from "./types.js";

export interface AnthropicClient {
  client: Anthropic;
  defaults: ClientDefaults;
  createMessage: (
    messages: Message[],
    options?: {
      systemPrompt?: string;
      tools?: ToolDefinition[];
      maxTokens?: number;
      temperature?: number;
      model?: string;
    }
  ) => Promise<Anthropic.Messages.Message>;
  streamMessage: (
    messages: Message[],
    options?: {
      systemPrompt?: string;
      tools?: ToolDefinition[];
      maxTokens?: number;
      temperature?: number;
      model?: string;
    },
    callbacks?: StreamCallbacks
  ) => Promise<Anthropic.Messages.Message>;
  convertTools: (tools: ToolDefinition[]) => ToolConfig[];
}

/**
 * Creates an Anthropic client with configured defaults
 * @param config - Client configuration options
 * @returns AnthropicClient instance with methods for API calls
 */
export function createAnthropicClient(config: ClientConfig = {}): AnthropicClient {
  const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or pass apiKey in config."
    );
  }

  const client = new Anthropic({
    apiKey,
    baseURL: config.baseURL,
    timeout: config.timeout,
    maxRetries: config.maxRetries,
  });

  const defaults: ClientDefaults = {
    model: config.defaultModel ?? DEFAULT_MODEL,
    maxTokens: config.defaultMaxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: config.defaultTemperature ?? DEFAULT_TEMPERATURE,
  };

  /**
   * Convert internal message format to Anthropic API format
   */
  function convertMessages(messages: Message[]): Anthropic.Messages.MessageParam[] {
    return messages.map((msg) => {
      if (msg.role === "user") {
        if (typeof msg.content === "string") {
          return { role: "user", content: msg.content };
        }
        // Handle content blocks - check if we have tool_result type content
        const userContent: Anthropic.Messages.ToolResultBlockParam[] = [];
        const otherContent: Anthropic.ContentBlockParam[] = [];

        for (const block of msg.content) {
          if (block.type === "tool_result") {
            // Cast to tool result param
            userContent.push({
              type: "tool_result",
              tool_use_id: (block as { tool_use_id: string }).tool_use_id,
              content: (block as { content?: string }).content,
              is_error: (block as { is_error?: boolean }).is_error,
            });
          } else {
            otherContent.push(block as Anthropic.ContentBlockParam);
          }
        }

        if (userContent.length > 0) {
          // When we have tool results, combine with other content
          const allContent: Anthropic.Messages.MessageParam["content"] = [
            ...otherContent,
            ...userContent,
          ];
          return { role: "user", content: allContent };
        }
        return { role: "user", content: msg.content as Anthropic.ContentBlockParam[] };
      }

      if (msg.role === "assistant") {
        if (typeof msg.content === "string") {
          return { role: "assistant", content: msg.content };
        }
        return { role: "assistant", content: msg.content as Anthropic.ContentBlockParam[] };
      }

      // This shouldn't happen with proper typing
      return msg as Anthropic.Messages.MessageParam;
    });
  }

  /**
   * Convert internal tool definitions to Anthropic API format
   */
  function convertTools(tools: ToolDefinition[]): ToolConfig[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.inputSchema),
    }));
  }

  /**
   * Create a message with the Anthropic API
   */
  async function createMessage(
    messages: Message[],
    options: {
      systemPrompt?: string;
      tools?: ToolDefinition[];
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<Anthropic.Messages.Message> {
    const apiMessages = convertMessages(messages);
    const apiTools = options.tools ? convertTools(options.tools) : undefined;

    // Build the request parameters
    const params: Anthropic.Messages.MessageCreateParams = {
      model: options.model ?? defaults.model,
      max_tokens: options.maxTokens ?? defaults.maxTokens,
      messages: apiMessages,
    };

    if (options.systemPrompt) {
      params.system = options.systemPrompt;
    }

    if (options.temperature !== undefined) {
      params.temperature = options.temperature;
    }

    if (apiTools) {
      params.tools = apiTools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
      }));
    }

    const response = await client.messages.create(params);

    return response;
  }

  /**
   * Stream a message with the Anthropic API
   */
  async function streamMessage(
    messages: Message[],
    options: {
      systemPrompt?: string;
      tools?: ToolDefinition[];
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {},
    callbacks: StreamCallbacks = {}
  ): Promise<Anthropic.Messages.Message> {
    const apiMessages = convertMessages(messages);
    const apiTools = options.tools ? convertTools(options.tools) : undefined;

    // Build the request parameters
    const params: Anthropic.Messages.MessageCreateParams = {
      model: options.model ?? defaults.model,
      max_tokens: options.maxTokens ?? defaults.maxTokens,
      messages: apiMessages,
      stream: true,
    };

    if (options.systemPrompt) {
      params.system = options.systemPrompt;
    }

    if (options.temperature !== undefined) {
      params.temperature = options.temperature;
    }

    if (apiTools) {
      params.tools = apiTools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
      }));
    }

    const stream = client.messages.stream(params);

    // Set up event handlers using 'on' method from MessageStream
    stream.on("streamEvent", (event: Anthropic.Messages.RawMessageStreamEvent) => {
      if (event.type === "message_start") {
        callbacks.onMessageStart?.({
          role: "assistant",
          content: [],
          id: event.message.id,
        });
      } else if (event.type === "content_block_start") {
        callbacks.onContentBlockStart?.(
          event.index,
          event.content_block as Anthropic.ContentBlock
        );
      } else if (event.type === "content_block_delta") {
        if ("delta" in event && event.delta.type === "text_delta") {
          callbacks.onContentBlockDelta?.(
            event.index,
            (event.delta as { type: "text_delta"; text: string }).text
          );
        }
      } else if (event.type === "content_block_stop") {
        callbacks.onContentBlockStop?.(event.index);
      } else if (event.type === "message_delta") {
        callbacks.onMessageDelta?.({
          stopReason: event.delta.stop_reason ?? undefined,
        });
      } else if (event.type === "message_stop") {
        callbacks.onMessageStop?.();
      }
    });

    // Handle errors
    stream.on("error", (error: Error) => {
      callbacks.onError?.(error);
    });

    // Get the final message and check for tool use
    const finalMessage = await stream.finalMessage();

    // Process tool use from final message
    for (const block of finalMessage.content) {
      if (block.type === "tool_use") {
        callbacks.onToolUse?.(block.name, block.id, block.input);
      }
    }

    return finalMessage;
  }

  return {
    client,
    defaults,
    createMessage,
    streamMessage,
    convertTools,
  };
}

/**
 * Convert a Zod schema to JSON Schema format for Anthropic API
 */
function zodToJsonSchema(schema: unknown): Record<string, unknown> {
  // Basic Zod to JSON Schema conversion
  // For more complex schemas, consider using zod-to-json-schema package
  if (!schema || typeof schema !== "object") {
    return { type: "object" };
  }

  const zodSchema = schema as Record<string, unknown>;

  // Check if it's a ZodType with _def
  if ("_def" in zodSchema) {
    const def = zodSchema._def as Record<string, unknown>;
    return convertZodDef(def);
  }

  return { type: "object" };
}

function convertZodDef(def: Record<string, unknown>): Record<string, unknown> {
  const typeName = def.typeName as string | undefined;

  switch (typeName) {
    case "ZodString":
      return {
        type: "string",
        description: def.description as string | undefined,
      };
    case "ZodNumber":
      return {
        type: "number",
        description: def.description as string | undefined,
      };
    case "ZodBoolean":
      return {
        type: "boolean",
        description: def.description as string | undefined,
      };
    case "ZodArray": {
      const innerType = def.type as Record<string, unknown> | undefined;
      return {
        type: "array",
        items: innerType
          ? convertZodDef(innerType._def as Record<string, unknown>)
          : {},
        description: def.description as string | undefined,
      };
    }
    case "ZodObject": {
      const shape = def.shape as
        | Record<string, Record<string, unknown>>
        | undefined;
      const properties: Record<string, Record<string, unknown>> = {};
      const required: string[] = [];

      if (shape) {
        for (const [key, value] of Object.entries(shape)) {
          if ("_def" in value) {
            properties[key] = convertZodDef(
              value._def as Record<string, unknown>
            );
            // Assume all fields are required unless optional
            if (!(value._def as Record<string, unknown>).isOptional) {
              required.push(key);
            }
          }
        }
      }

      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
        description: def.description as string | undefined,
      };
    }
    case "ZodOptional":
    case "ZodNullable": {
      const innerType = def.innerType as Record<string, unknown> | undefined;
      if (innerType && "_def" in innerType) {
        const result = convertZodDef(
          innerType._def as Record<string, unknown>
        );
        return { ...result, isOptional: true };
      }
      return { type: "string" };
    }
    case "ZodLiteral": {
      const value = def.value;
      return {
        type: typeof value === "string" ? "string" : typeof value,
        const: value,
        description: def.description as string | undefined,
      };
    }
    case "ZodEnum": {
      const values = def.values as string[] | undefined;
      return {
        type: "string",
        enum: values,
        description: def.description as string | undefined,
      };
    }
    case "ZodUnion": {
      const options = def.options as Array<Record<string, unknown>> | undefined;
      if (options) {
        return {
          oneOf: options.map((opt) =>
            "_def" in opt
              ? convertZodDef(opt._def as Record<string, unknown>)
              : { type: "object" }
          ),
          description: def.description as string | undefined,
        };
      }
      return { type: "object" };
    }
    case "ZodDefault": {
      const innerType = def.innerType as Record<string, unknown> | undefined;
      const defaultValue = def.defaultValue;
      if (innerType && "_def" in innerType) {
        const result = convertZodDef(
          innerType._def as Record<string, unknown>
        );
        return {
          ...result,
          default:
            typeof defaultValue === "function"
              ? defaultValue()
              : defaultValue,
        };
      }
      return { type: "string" };
    }
    default:
      return {
        type: "object",
        description: def.description as string | undefined,
      };
  }
}

export default createAnthropicClient;
