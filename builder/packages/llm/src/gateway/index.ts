/**
 * Mori LLM Gateway Client with Anthropic Fallback
 *
 * Routes all LLM requests through mori.com gateway for multi-tenant support.
 * Falls back to direct Anthropic API if gateway is unavailable.
 *
 * Uses tenant-specific API keys (mori_sk_{tenant}_{suffix})
 */

import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// Types
// ============================================================================

export interface MoriGatewayConfig {
  /** Tenant API key (format: mori_sk_{tenant}_{suffix}) or Anthropic API key */
  apiKey: string;
  /** Gateway base URL (defaults to https://mori.com/api/llm) */
  baseUrl?: string;
  /** Default model to use */
  defaultModel?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Enable fallback to direct Anthropic API */
  enableFallback?: boolean;
}

export interface GatewayChatRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system?: string;
  stream?: boolean;
  tools?: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
}

export interface GatewayChatResponse {
  id: string;
  model: string;
  content: string;
  role: "assistant";
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface GatewayStreamEvent {
  type: "content_block_delta" | "message_start" | "message_stop" | "content_block_start" | "content_block_stop";
  index?: number;
  delta?: { type: string; text: string };
  message?: { id: string; model: string };
  content_block?: { type: string; text?: string };
}

export interface GatewayStreamCallbacks {
  onStart?: (messageId: string, model: string) => void;
  onDelta?: (text: string) => void;
  onComplete?: (response: GatewayChatResponse) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Mori Gateway Client
// ============================================================================

export class MoriGatewayClient {
  private config: Required<Omit<MoriGatewayConfig, 'baseUrl'>> & { baseUrl: string | null };
  private anthropicClient: Anthropic | null = null;

  constructor(config: MoriGatewayConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || null,
      defaultModel: config.defaultModel || "claude-sonnet-4-20250514",
      timeout: config.timeout || 120000,
      enableFallback: config.enableFallback ?? true,
    };

    // Determine if this is a Mori key or Anthropic key
    const isMoriKey = this.config.apiKey.startsWith("mori_sk_");

    if (!isMoriKey && this.config.apiKey.startsWith("sk-ant-")) {
      // Direct Anthropic key - skip gateway
      this.config.baseUrl = null;
      this.anthropicClient = new Anthropic({ apiKey: this.config.apiKey });
    } else if (this.config.enableFallback) {
      // Initialize Anthropic client for fallback
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (anthropicKey) {
        this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
      }
    }
  }

  /**
   * Get the tenant slug from the API key
   */
  getTenantSlug(): string {
    const match = this.config.apiKey.match(/^mori_sk_([^_]+)_/);
    return match ? match[1] : "direct";
  }

  /**
   * Check if using direct Anthropic API
   */
  isDirectMode(): boolean {
    return this.config.baseUrl === null || !this.config.baseUrl.startsWith("http");
  }

  /**
   * Send a chat message and get a response
   */
  async chat(request: GatewayChatRequest): Promise<GatewayChatResponse> {
    // If direct mode or no gateway URL, use Anthropic directly
    if (this.isDirectMode()) {
      return this.chatDirect(request);
    }

    // Try gateway first
    try {
      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-Tenant-Slug": this.getTenantSlug(),
        },
        body: JSON.stringify({
          ...request,
          model: request.model || this.config.defaultModel,
          stream: false,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Gateway error (${response.status})`);
      }

      return response.json();
    } catch (error) {
      // Fallback to direct Anthropic API
      if (this.config.enableFallback && this.anthropicClient) {
        console.warn("[MoriGateway] Gateway unavailable, falling back to direct Anthropic API");
        return this.chatDirect(request);
      }
      throw error;
    }
  }

  /**
   * Direct Anthropic API call (fallback)
   */
  private async chatDirect(request: GatewayChatRequest): Promise<GatewayChatResponse> {
    if (!this.anthropicClient) {
      throw new Error("No Anthropic API key available for fallback");
    }

    const response = await this.anthropicClient.messages.create({
      model: request.model || this.config.defaultModel,
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature,
      system: request.system,
      messages: request.messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    // Extract text content
    let content = "";
    for (const block of response.content) {
      if (block.type === "text") {
        content += block.text;
      }
    }

    return {
      id: response.id,
      model: response.model,
      content,
      role: "assistant",
      stop_reason: response.stop_reason || "end_turn",
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Send a chat message with streaming response
   */
  async chatStream(
    request: GatewayChatRequest,
    callbacks: GatewayStreamCallbacks
  ): Promise<GatewayChatResponse> {
    // If direct mode or no gateway URL, use Anthropic directly
    if (this.isDirectMode()) {
      return this.chatStreamDirect(request, callbacks);
    }

    // Try gateway first
    try {
      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-Tenant-Slug": this.getTenantSlug(),
        },
        body: JSON.stringify({
          ...request,
          model: request.model || this.config.defaultModel,
          stream: true,
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`Gateway error (${response.status})`);
      }

      return this.handleStreamResponse(response, callbacks);
    } catch (error) {
      // Fallback to direct Anthropic API
      if (this.config.enableFallback && this.anthropicClient) {
        console.warn("[MoriGateway] Gateway unavailable, falling back to direct Anthropic API");
        return this.chatStreamDirect(request, callbacks);
      }

      const err = error instanceof Error ? error : new Error("Unknown error");
      callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Handle streaming response from gateway
   */
  private async handleStreamResponse(
    response: Response,
    callbacks: GatewayStreamCallbacks
  ): Promise<GatewayChatResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let messageId = "";
    let model = "";
    let usage = { input_tokens: 0, output_tokens: 0 };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: GatewayStreamEvent = JSON.parse(line.slice(6));

              switch (event.type) {
                case "message_start":
                  messageId = event.message?.id || "";
                  model = event.message?.model || "";
                  callbacks.onStart?.(messageId, model);
                  break;

                case "content_block_delta":
                  if (event.delta?.text) {
                    fullContent += event.delta.text;
                    callbacks.onDelta?.(event.delta.text);
                  }
                  break;

                case "message_stop":
                  // Message complete
                  break;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const finalResponse: GatewayChatResponse = {
      id: messageId,
      model,
      content: fullContent,
      role: "assistant",
      stop_reason: "end_turn",
      usage,
    };

    callbacks.onComplete?.(finalResponse);
    return finalResponse;
  }

  /**
   * Direct Anthropic streaming (fallback)
   */
  private async chatStreamDirect(
    request: GatewayChatRequest,
    callbacks: GatewayStreamCallbacks
  ): Promise<GatewayChatResponse> {
    if (!this.anthropicClient) {
      throw new Error("No Anthropic API key available for fallback");
    }

    const model = request.model || this.config.defaultModel;
    let fullContent = "";
    let messageId = "";

    callbacks.onStart?.(model, model);

    const stream = this.anthropicClient.messages.stream({
      model,
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature,
      system: request.system,
      messages: request.messages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && "delta" in event) {
        const delta = event.delta as { type?: string; text?: string };
        if (delta.type === "text_delta" && delta.text) {
          fullContent += delta.text;
          callbacks.onDelta?.(delta.text);
        }
      } else if (event.type === "message_start") {
        const msgEvent = event as { message?: { id?: string } };
        messageId = msgEvent.message?.id || "";
      }
    }

    const finalMessage = await stream.finalMessage();

    const response: GatewayChatResponse = {
      id: finalMessage.id,
      model: finalMessage.model,
      content: fullContent,
      role: "assistant",
      stop_reason: finalMessage.stop_reason || "end_turn",
      usage: {
        input_tokens: finalMessage.usage.input_tokens,
        output_tokens: finalMessage.usage.output_tokens,
      },
    };

    callbacks.onComplete?.(response);
    return response;
  }

  /**
   * Simple ask - get a single response to a prompt
   */
  async ask(prompt: string, options?: { model?: string; system?: string }): Promise<string> {
    const response = await this.chat({
      messages: [{ role: "user", content: prompt }],
      model: options?.model,
      system: options?.system,
    });
    return response.content;
  }

  /**
   * Simple ask with streaming
   */
  async askStream(
    prompt: string,
    onDelta: (text: string) => void,
    options?: { model?: string; system?: string }
  ): Promise<string> {
    const response = await this.chatStream(
      {
        messages: [{ role: "user", content: prompt }],
        model: options?.model,
        system: options?.system,
      },
      { onDelta }
    );
    return response.content;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a Mori gateway client
 */
export function createMoriGateway(config: MoriGatewayConfig): MoriGatewayClient {
  return new MoriGatewayClient(config);
}

/**
 * Create a Mori gateway client from environment
 */
export function createMoriGatewayFromEnv(): MoriGatewayClient {
  // Priority: MORI_API_KEY > ANTHROPIC_API_KEY
  const moriKey = process.env.MORI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const apiKey = moriKey || anthropicKey;

  if (!apiKey) {
    throw new Error(
      "No API key found. Set MORI_API_KEY or ANTHROPIC_API_KEY environment variable."
    );
  }

  return new MoriGatewayClient({
    apiKey,
    baseUrl: process.env.MORI_GATEWAY_URL,
    defaultModel: process.env.MORI_DEFAULT_MODEL,
    enableFallback: true,
  });
}

export default MoriGatewayClient;
