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
  ToolChoice,
} from "./types.js";

export interface LLMClient {
  defaults: ClientDefaults;
  createMessage: (
    messages: Message[],
    options?: {
      systemPrompt?: string;
      tools?: ToolDefinition[];
      maxTokens?: number;
      temperature?: number;
      model?: string;
      toolChoice?: ToolChoice;
    }
  ) => Promise<any>;
  streamMessage: (
    messages: Message[],
    options?: {
      systemPrompt?: string;
      tools?: ToolDefinition[];
      maxTokens?: number;
      temperature?: number;
      model?: string;
      toolChoice?: ToolChoice;
    },
    callbacks?: StreamCallbacks
  ) => Promise<void>;
  convertTools: (tools: ToolDefinition[]) => any[];
}

export function createAnthropicClient(config: ClientConfig = {}): LLMClient {
  const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === '0') {
    if (process.env.GOOGLE_API_KEY) return createGeminiClient(config);
    throw new Error("Anthropic API key is required.");
  }

  const client = new Anthropic({ apiKey });
  const defaults: ClientDefaults = {
    model: config.defaultModel ?? DEFAULT_MODEL,
    maxTokens: config.defaultMaxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: config.defaultTemperature ?? DEFAULT_TEMPERATURE,
  };

  function convertMessages(messages: Message[]): Anthropic.Messages.MessageParam[] {
    return messages.map((msg) => {
      if (typeof msg.content === "string") {
        return { role: msg.role as "user" | "assistant", content: msg.content };
      }
      
      const content = msg.content.map((block: any) => {
        if (block.type === "text") return { type: "text", text: block.text };
        if (block.type === "image") {
          // Handle data:image/png;base64,... format
          const match = block.source?.data?.match(/^data:image\/(.*);base64,(.*)$/) || block.data?.match(/^data:image\/(.*);base64,(.*)$/);
          if (match) {
            return {
              type: "image",
              source: {
                type: "base64",
                media_type: `image/${match[1]}` as any,
                data: match[2],
              },
            };
          }
          return block;
        }
        if (block.type === "tool_use") return block;
        if (block.type === "tool_result") {
          return {
            type: "tool_result",
            tool_use_id: block.tool_use_id,
            content: typeof block.content === "string" ? block.content : JSON.stringify(block.content),
            is_error: block.is_error,
          };
        }
        return block;
      });

      return { role: msg.role as "user" | "assistant", content: content as any };
    });
  }

  return {
    defaults,
    convertTools: (tools) => tools.map(t => ({ 
      name: t.name, 
      description: t.description, 
      input_schema: zodToJsonSchema(t.inputSchema)
    })),
    async createMessage(messages, options = {}) {
      const apiTools = options.tools ? this.convertTools(options.tools) : undefined;
      return client.messages.create({
        model: options.model ?? defaults.model,
        max_tokens: options.maxTokens ?? defaults.maxTokens,
        messages: convertMessages(messages),
        system: options.systemPrompt,
        temperature: options.temperature,
        tool_choice: options.toolChoice as any,
        tools: apiTools as any
      });
    },
    async streamMessage(messages, options = {}, callbacks = {}) {
      const apiTools = options.tools ? this.convertTools(options.tools) : undefined;
      const params: Anthropic.Messages.MessageCreateParams = {
        model: (options.model ?? defaults.model) as any,
        max_tokens: options.maxTokens ?? defaults.maxTokens,
        messages: convertMessages(messages),
        system: options.systemPrompt,
        temperature: options.temperature,
        stream: true,
        tools: apiTools as any
      };

      try {
        const stream = client.messages.stream(params);
        
        stream.on("text", (text) => callbacks.onContentBlockDelta?.(0, text));
        stream.on("message", (message) => callbacks.onMessageStart?.({ role: "assistant", content: [], id: message.id }));
        
        stream.on("end", () => callbacks.onMessageStop?.());
        stream.on("error", (error) => callbacks.onError?.(error));

        const finalMessage = await stream.finalMessage();
        for (const block of finalMessage.content) {
          if (block.type === "tool_use") {
            callbacks.onToolUse?.(block.name, block.id, block.input);
          }
        }
      } catch (error) {
        callbacks.onError?.(error as Error);
      }
    }
  };
}

export function createGeminiClient(config: ClientConfig = {}): LLMClient {
  return {
    defaults: { model: "gemini-1.5-pro", maxTokens: 4096, temperature: 0.7 },
    convertTools: () => [],
    async createMessage() { return { content: [] }; },
    async streamMessage(_, __, callbacks) { callbacks?.onMessageStop?.(); }
  };
}

function zodToJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return { type: "object" };
  try {
    if (schema._def && schema._def.typeName === "ZodObject") {
      const shape = schema._def.shape();
      const properties: any = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        const def = (value as any)._def;
        properties[key] = { type: "string" };
        if (def.typeName === "ZodEnum") properties[key].enum = def.values;
        if (def.typeName === "ZodNumber") properties[key].type = "number";
        if (def.typeName === "ZodBoolean") properties[key].type = "boolean";
        if (def.typeName !== "ZodOptional") required.push(key);
      }
      return { type: "object", properties, required: required.length > 0 ? required : undefined };
    }
  } catch (e) { console.error("Zod conversion error:", e); }
  return { type: "object" };
}

export default createAnthropicClient;
