import {
  Message,
  ToolDefinition,
  StreamCallbacks,
  AssistantMessage,
  DEFAULT_MODEL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  ToolChoice,
  LLMModel,
} from "../types.js";
import { createAnthropicClient, LLMClient } from "../client.js";
import { executeTool, ToolExecutionError } from "../tools/base.js";
import {
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

/**
 * Abstract base class for creating AI agents
 *
 * Provides common functionality for interacting with LLM APIs
 * including streaming responses and tool execution.
 */
export abstract class BaseAgent {
  protected client: LLMClient;
  protected _name: string;
  protected _description: string;
  protected _systemPrompt: string;
  protected _tools: ToolDefinition[];
  protected _maxTokens: number;
  protected _temperature: number;
  protected _model: LLMModel;
  protected _state: AgentState = "idle";
  protected _eventHandlers: Set<AgentEventHandler> = new Set();
  protected _stats: AgentStats = {
    totalMessages: 0,
    totalToolCalls: 0,
    totalTokensUsed: 0,
    averageResponseTime: 0,
  };

  constructor(config: AgentConfig, client?: LLMClient) {
    this._name = config.name;
    this._description = config.description ?? "";
    this._systemPrompt = config.systemPrompt;
    this._tools = config.tools ?? [];
    this._maxTokens = config.maxTokens ?? DEFAULT_MAX_TOKENS;
    this._temperature = config.temperature ?? DEFAULT_TEMPERATURE;
    this._model = config.model ?? DEFAULT_MODEL;

    this.client = client ?? createAnthropicClient();
  }

  /**
   * Agent name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Agent description
   */
  get description(): string {
    return this._description;
  }

  /**
   * System prompt for the agent
   */
  get systemPrompt(): string {
    return this._systemPrompt;
  }

  /**
   * Tools available to the agent
   */
  get tools(): ToolDefinition[] {
    return [...this._tools];
  }

  /**
   * Current agent state
   */
  get state(): AgentState {
    return this._state;
  }

  /**
   * Agent statistics
   */
  get stats(): AgentStats {
    return { ...this._stats };
  }

  /**
   * Agent capabilities
   */
  get capabilities(): AgentCapabilities {
    return {
      supportsStreaming: true,
      supportsToolUse: this._tools.length > 0,
      supportsVision: true,
      maxContextLength: 200000,
    };
  }

  /**
   * Abstract method that subclasses must implement
   * Defines the main execution logic for the agent
   */
  abstract execute(options: AgentExecuteOptions): Promise<AgentResult>;

  /**
   * Add a tool to the agent
   */
  addTool(tool: ToolDefinition): this {
    this._tools.push(tool);
    return this;
  }

  /**
   * Remove a tool from the agent
   */
  removeTool(toolName: string): this {
    this._tools = this._tools.filter((t) => t.name !== toolName);
    return this;
  }

  /**
   * Add an event handler
   */
  on(handler: AgentEventHandler): this {
    this._eventHandlers.add(handler);
    return this;
  }

  /**
   * Remove an event handler
   */
  off(handler: AgentEventHandler): this {
    this._eventHandlers.delete(handler);
    return this;
  }

  /**
   * Set the agent state and emit event
   */
  protected setState(state: AgentState): void {
    this._state = state;
    this.emitEvent({ type: "state_change", state });
  }

  /**
   * Emit an event to all handlers
   */
  protected emitEvent(event: AgentEvent): void {
    for (const handler of this._eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in agent event handler:", error);
      }
    }
  }

  /**
   * Helper method to stream a response from LLM
   * Handles the streaming lifecycle including tool execution
   */
  protected async streamResponse(
    messages: Message[],
    options: {
      systemPrompt?: string;
      tools?: ToolDefinition[];
      maxTokens?: number;
      temperature?: number;
      model?: LLMModel;
      executeTools?: boolean;
      context?: Record<string, any>;
      toolChoice?: ToolChoice;
    } = {},
    callbacks?: StreamCallbacks
  ): Promise<AgentResult> {
    this.setState("thinking");

    const systemPrompt = options.systemPrompt ?? this._systemPrompt;
    const tools = options.tools ?? this._tools;
    const maxTokens = options.maxTokens ?? this._maxTokens;
    const temperature = options.temperature ?? this._temperature;
    const model = options.model ?? this._model;
    const toolChoice = options.toolChoice;

    const enhancedCallbacks: StreamCallbacks = {
      ...callbacks,
      onMessageStart: (message) => {
        this.setState("responding");
        callbacks?.onMessageStart?.(message);
      },
      onToolUse: (toolName, toolUseId, input) => {
        this.setState("tool_use");
        callbacks?.onToolUse?.(toolName, toolUseId, input);
      },
      onError: (error) => {
        this.setState("error");
        callbacks?.onError?.(error);
      },
      onMessageStop: () => {
        this.setState("idle");
        callbacks?.onMessageStop?.();
      }
    };

    // This now returns immediately without waiting for the full response
    await this.client.streamMessage(
      messages,
      {
        systemPrompt,
        tools,
        maxTokens,
        temperature,
        model,
        toolChoice,
      },
      enhancedCallbacks
    );

    // Return a placeholder result since the actual results will come via callbacks
    return {
      message: { role: "assistant", content: [] },
    };
  }

  /**
   * Helper method to create a non-streaming response
   */
  protected async createResponse(
    messages: Message[],
    options: {
      systemPrompt?: string;
      tools?: ToolDefinition[];
      maxTokens?: number;
      temperature?: number;
      model?: LLMModel;
      toolChoice?: ToolChoice;
    } = {}
  ): Promise<AgentResult> {
    const startTime = Date.now();
    this.setState("thinking");

    try {
      const response = await this.client.createMessage(messages, {
        systemPrompt: options.systemPrompt ?? this._systemPrompt,
        tools: options.tools ?? this._tools,
        maxTokens: options.maxTokens ?? this._maxTokens,
        temperature: options.temperature ?? this._temperature,
        model: options.model ?? this._model,
        toolChoice: options.toolChoice,
      });

      // Convert response to Message format
      const assistantMessage: AssistantMessage = {
        role: "assistant",
        content: response.content as unknown as AssistantMessage["content"],
        stopReason: response.stop_reason ?? undefined,
      };

      // Update stats
      const executionTime = Date.now() - startTime;
      this._stats.totalMessages++;
      this._stats.totalTokensUsed += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
      this._stats.averageResponseTime =
        (this._stats.averageResponseTime * (this._stats.totalMessages - 1) + executionTime) /
        this._stats.totalMessages;
      this._stats.lastExecutionTime = new Date();

      this.setState("idle");

      return {
        message: assistantMessage,
        usage: response.usage
          ? {
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
            }
          : undefined,
      };
    } catch (error) {
      this.setState("error");
      throw error;
    }
  }
}

/**
 * Simple agent implementation for basic use cases
 */
export class SimpleAgent extends BaseAgent {
  async execute(options: AgentExecuteOptions): Promise<AgentResult> {
    const shouldStream = options.stream ?? true;

    if (options.eventHandler) {
      this.on(options.eventHandler);
    }

    try {
      if (shouldStream) {
        return await this.streamResponse(
          options.messages,
          {
            systemPrompt: options.systemPromptOverride,
            tools: options.toolsOverride,
            maxTokens: options.maxTokensOverride,
            temperature: options.temperatureOverride,
            model: options.modelOverride as LLMModel | undefined,
            context: options.context,
            toolChoice: options.toolChoice,
          },
          options.callbacks
        );
      }

      return await this.createResponse(options.messages, {
        systemPrompt: options.systemPromptOverride,
        tools: options.toolsOverride,
        maxTokens: options.maxTokensOverride,
        temperature: options.temperatureOverride,
        model: options.modelOverride as LLMModel | undefined,
        toolChoice: options.toolChoice,
      });
    } finally {
      if (options.eventHandler) {
        this.off(options.eventHandler);
      }
    }
  }
}

/**
 * Create a simple agent with minimal configuration
 */
export function createAgent(
  name: string,
  systemPrompt: string,
  options: {
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
    model?: LLMModel;
  } = {}
): SimpleAgent {
  return new SimpleAgent({
    name,
    systemPrompt,
    ...options,
  } as AgentConfig);
}
