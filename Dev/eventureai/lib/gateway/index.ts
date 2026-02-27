/**
 * Minimal Mori Gateway Client for EventureAI Web
 */

import Anthropic from '@anthropic-ai/sdk';

export interface MoriGatewayConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}

export interface GatewayStreamCallbacks {
  onStart?: (messageId: string, model: string) => void;
  onDelta?: (text: string) => void;
  onComplete?: (response: { content: string; usage: { input_tokens: number; output_tokens: number } }) => void;
  onError?: (error: Error) => void;
}

export class MoriGatewayClient {
  private config: Required<Omit<MoriGatewayConfig, 'baseUrl'>> & { baseUrl: string | null };
  private anthropicClient: Anthropic | null = null;

  constructor(config: MoriGatewayConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || null,
      defaultModel: config.defaultModel || 'claude-sonnet-4-20250514',
      timeout: config.timeout || 120000,
    };

    // Initialize Anthropic client
    this.anthropicClient = new Anthropic({ apiKey: this.config.apiKey });
  }

  /**
   * Get the tenant slug from the API key
   */
  getTenantSlug(): string {
    const match = this.config.apiKey.match(/^mori_sk_([^_]+)_/);
    return match ? match[1] : 'direct';
  }

  /**
   * Send a chat message with streaming response
   */
  async chatStream(
    request: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      system?: string;
      max_tokens?: number;
      model?: string;
    },
    callbacks: GatewayStreamCallbacks
  ): Promise<{ content: string; usage: { input_tokens: number; output_tokens: number } }> {
    if (!this.anthropicClient) {
      throw new Error('No Anthropic API key available');
    }

    const model = request.model || this.config.defaultModel;
    let fullContent = '';
    let messageId = '';

    callbacks.onStart?.(model, model);

    const stream = this.anthropicClient.messages.stream({
      model,
      max_tokens: request.max_tokens || 4096,
      system: request.system,
      messages: request.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && 'delta' in event) {
        const delta = event.delta as { type?: string; text?: string };
        if (delta.type === 'text_delta' && delta.text) {
          fullContent += delta.text;
          callbacks.onDelta?.(delta.text);
        }
      } else if (event.type === 'message_start') {
        const msgEvent = event as { message?: { id?: string } };
        messageId = msgEvent.message?.id || '';
      }
    }

    const finalMessage = await stream.finalMessage();

    const response = {
      content: fullContent,
      usage: {
        input_tokens: finalMessage.usage.input_tokens,
        output_tokens: finalMessage.usage.output_tokens,
      },
    };

    callbacks.onComplete?.(response);
    return response;
  }
}

export function createMoriGateway(config: MoriGatewayConfig): MoriGatewayClient {
  return new MoriGatewayClient(config);
}
