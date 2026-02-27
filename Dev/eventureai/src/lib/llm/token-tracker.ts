// Multi-Provider LLM Service with Token Tracking
// Supports: Anthropic (Claude), OpenAI (GPT), Google (Gemini), Groq, xAI, Cohere

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'google' | 'groq' | 'xai' | 'cohere';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  latencyMs: number;
  cost?: number;
}

export interface TokenUsageRecord {
  id?: number;
  tenant_id?: number;
  app_id?: number;
  workspace_id?: number;
  user_id?: number;
  conversation_id?: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_cents: number;
  latency_ms: number;
  request_type: string;
  created_at?: Date;
}

// Pricing per 1M tokens (in cents)
const PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-opus-4': { input: 1500, output: 7500 },
  'claude-sonnet-4': { input: 300, output: 1500 },
  'claude-haiku-3.5': { input: 80, output: 400 },
  'claude-3-opus': { input: 1500, output: 7500 },
  'claude-3-sonnet': { input: 300, output: 1500 },
  'claude-3-haiku': { input: 25, output: 125 },
  // OpenAI
  'gpt-4o': { input: 250, output: 1000 },
  'gpt-4-turbo': { input: 1000, output: 3000 },
  'gpt-4': { input: 3000, output: 6000 },
  'gpt-3.5-turbo': { input: 50, output: 150 },
  // Google
  'gemini-1.5-pro': { input: 175, output: 700 },
  'gemini-1.5-flash': { input: 35, output: 140 },
  'gemini-pro': { input: 50, output: 150 },
  // Groq (very fast, cheap)
  'llama-3.1-70b': { input: 59, output: 79 },
  'llama-3.1-8b': { input: 5, output: 8 },
  'mixtral-8x7b': { input: 24, output: 24 },
  // xAI
  'grok-beta': { input: 500, output: 1500 },
  // Cohere
  'command-r-plus': { input: 300, output: 1500 },
  'command-r': { input: 50, output: 150 },
};

// Calculate cost in cents
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] || PRICING['gpt-3.5-turbo'];
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return Math.ceil(inputCost + outputCost);
}

// Get API key for provider
function getApiKey(provider: string): string {
  const keyMap: Record<string, string> = {
    anthropic: process.env.ANTHROPIC_API_KEY || process.env.LLM_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || '',
    google: process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY || '',
    groq: process.env.GROQ_API_KEY || process.env.LLM_API_KEY || '',
    xai: process.env.XAI_API_KEY || process.env.LLM_API_KEY || '',
    cohere: process.env.COHERE_API_KEY || process.env.LLM_API_KEY || '',
  };
  return keyMap[provider] || process.env.LLM_API_KEY || '';
}

// Anthropic/Claude API call
async function callAnthropic(
  messages: LLMMessage[],
  model: string,
  systemPrompt?: string
): Promise<LLMResponse> {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const start = Date.now();

  // Convert messages format for Anthropic
  const systemMessage = systemPrompt || messages.find(m => m.role === 'system')?.content;
  const userMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - start;

  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;

  return {
    content: data.content[0]?.text || '',
    provider: 'anthropic',
    model: model || 'claude-sonnet-4-20250514',
    tokensUsed: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    },
    latencyMs,
    cost: calculateCost(model, inputTokens, outputTokens) / 100, // Convert to dollars
  };
}

// OpenAI API call
async function callOpenAI(
  messages: LLMMessage[],
  model: string
): Promise<LLMResponse> {
  const apiKey = getApiKey('openai');
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const start = Date.now();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      messages: messages,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - start;

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  return {
    content: data.choices[0]?.message?.content || '',
    provider: 'openai',
    model: model || 'gpt-4o',
    tokensUsed: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    },
    latencyMs,
    cost: calculateCost(model, inputTokens, outputTokens) / 100,
  };
}

// Google Gemini API call
async function callGoogle(
  messages: LLMMessage[],
  model: string
): Promise<LLMResponse> {
  const apiKey = getApiKey('google');
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

  const start = Date.now();
  // Use stable model names - gemini-2.0-flash is available and has good quotas
  const modelName = model || 'gemini-2.0-flash';

  // Convert messages to Gemini format
  const systemMessage = messages.find(m => m.role === 'system');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error: ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - start;

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // Gemini doesn't always return token counts, estimate
  const inputTokens = data.usageMetadata?.promptTokenCount || Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4);
  const outputTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

  return {
    content: text,
    provider: 'google',
    model: modelName,
    tokensUsed: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    },
    latencyMs,
    cost: calculateCost(modelName, inputTokens, outputTokens) / 100,
  };
}

// Groq API call (OpenAI-compatible)
async function callGroq(
  messages: LLMMessage[],
  model: string
): Promise<LLMResponse> {
  const apiKey = getApiKey('groq');
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const start = Date.now();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'llama-3.1-70b-versatile',
      messages: messages,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - start;

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  return {
    content: data.choices[0]?.message?.content || '',
    provider: 'groq',
    model: model || 'llama-3.1-70b-versatile',
    tokensUsed: {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    },
    latencyMs,
    cost: calculateCost(model, inputTokens, outputTokens) / 100,
  };
}

// Main LLM call function
export async function callLLM(
  messages: LLMMessage[],
  config: LLMConfig,
  systemPrompt?: string
): Promise<LLMResponse> {
  const { provider, model } = config;

  switch (provider) {
    case 'anthropic':
      return callAnthropic(messages, model, systemPrompt);
    case 'openai':
      return callOpenAI(messages, model);
    case 'google':
      return callGoogle(messages, model);
    case 'groq':
      return callGroq(messages, model);
    default:
      // Default to OpenAI-compatible
      return callOpenAI(messages, model);
  }
}

// Available models by provider
export const AVAILABLE_MODELS = {
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', fast: true },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', fast: false },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', fast: true },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', fast: true },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', fast: false },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', fast: true },
  ],
  google: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', fast: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', fast: false },
  ],
  groq: [
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', fast: true },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', fast: true },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', fast: true },
  ],
};

// Export pricing for cost calculations
export { PRICING, calculateCost };
