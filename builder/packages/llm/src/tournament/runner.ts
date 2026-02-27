import Anthropic from "@anthropic-ai/sdk";
import {
  TournamentConfig,
  TournamentStatus,
  TournamentResponse,
  TournamentState,
  TournamentEventCallback,
  TournamentEvent,
  TournamentModel,
  DebateMessage,
  calculateCost,
  LLMProvider,
} from "./types.js";

// ============================================================================
// Tournament Runner
// ============================================================================

/**
 * TournamentRunner orchestrates multi-LLM tournaments with parallel execution,
 * debate mode, and voting capabilities.
 */
export class TournamentRunner {
  private config: TournamentConfig;
  private status: TournamentStatus;
  private eventCallback?: TournamentEventCallback;
  private abortController: AbortController;

  constructor(
    config: TournamentConfig,
    eventCallback?: TournamentEventCallback
  ) {
    this.config = config;
    this.eventCallback = eventCallback;
    this.abortController = new AbortController();

    this.status = {
      id: config.id || `tournament_${Date.now()}`,
      config,
      state: "pending",
      responses: [],
      debateHistory: [],
      votes: [],
      currentRound: 0,
    };
  }

  /**
   * Get current tournament status
   */
  getStatus(): TournamentStatus {
    return { ...this.status };
  }

  /**
   * Abort the tournament
   */
  abort(): void {
    this.abortController.abort();
  }

  /**
   * Emit an event to the callback
   */
  private emit(event: TournamentEvent): void {
    this.eventCallback?.(event);
  }

  /**
   * Run the tournament
   */
  async run(): Promise<TournamentStatus> {
    this.status.state = "running";
    this.status.startedAt = new Date();
    this.emit({ type: "tournament_start", tournamentId: this.status.id });

    try {
      // Get enabled models
      const enabledModels = this.config.models.filter((m) => m.enabled);

      if (enabledModels.length === 0) {
        throw new Error("No models enabled for tournament");
      }

      // Run initial round
      await this.runRound(enabledModels, this.config.prompt);

      // Run debate rounds if enabled
      if (this.config.debateMode && this.config.rounds > 1) {
        for (let round = 2; round <= this.config.rounds; round++) {
          if (this.abortController.signal.aborted) break;

          this.status.currentRound = round;
          await this.runDebateRound(enabledModels, round);
        }
      }

      // Complete tournament
      this.status.state = "voting";
      this.emit({ type: "voting_start" });

      this.status.state = "completed";
      this.status.completedAt = new Date();
      this.emit({
        type: "tournament_complete",
        winner: this.status.winner,
        status: this.status,
      });

      return this.status;
    } catch (error) {
      this.status.state = "error";
      this.status.error = error instanceof Error ? error.message : "Unknown error";
      this.emit({ type: "tournament_error", error: this.status.error });
      return this.status;
    }
  }

  /**
   * Run a single round with all models in parallel
   */
  private async runRound(models: TournamentModel[], prompt: string): Promise<void> {
    this.status.currentRound = 1;

    // Execute all models in parallel
    const responsePromises = models.map((model) => this.executeModel(model, prompt));

    const responses = await Promise.allSettled(responsePromises);

    for (let i = 0; i < responses.length; i++) {
      const result = responses[i];
      const model = models[i];

      if (result.status === "fulfilled") {
        this.status.responses.push(result.value);
        this.emit({ type: "model_complete", modelId: model.model, response: result.value });
      } else {
        const errorResponse: TournamentResponse = {
          modelId: model.model,
          provider: model.provider,
          model: model.model,
          content: "",
          tokensUsed: { input: 0, output: 0, total: 0 },
          latencyMs: 0,
          error: result.reason?.message || "Unknown error",
          timestamp: new Date(),
        };
        this.status.responses.push(errorResponse);
        this.emit({ type: "model_error", modelId: model.model, error: errorResponse.error || "Unknown error" });
      }
    }

    this.emit({ type: "round_complete", round: 1, responses: this.status.responses });
  }

  /**
   * Run a debate round where models respond to each other
   */
  private async runDebateRound(models: TournamentModel[], round: number): Promise<void> {
    this.status.state = "debating";
    this.emit({ type: "debate_start", round });

    // Get previous responses for context
    const previousResponses = this.status.responses
      .filter((r) => !r.error)
      .map((r) => `[${r.model}]: ${r.content.slice(0, 500)}...`)
      .join("\n\n");

    const debatePrompt = `You are in a debate with other AI models. Here are the previous responses:

${previousResponses}

Please provide your counter-arguments, agreements, or refinements. Focus on:
1. Points you agree with and why
2. Points you disagree with and provide evidence
3. Your refined position considering other perspectives

Original question: ${this.config.prompt}`;

    // Execute debate round
    const responsePromises = models.map((model) =>
      this.executeModel(model, debatePrompt, round)
    );

    const responses = await Promise.allSettled(responsePromises);

    for (let i = 0; i < responses.length; i++) {
      const result = responses[i];
      const model = models[i];

      if (result.status === "fulfilled") {
        this.status.responses.push(result.value);

        const debateMessage: DebateMessage = {
          round,
          modelId: model.model,
          content: result.value.content,
        };
        this.status.debateHistory.push(debateMessage);
        this.emit({ type: "debate_message", message: debateMessage });
      }
    }
  }

  /**
   * Execute a single model
   */
  private async executeModel(
    model: TournamentModel,
    prompt: string,
    round: number = 1
  ): Promise<TournamentResponse> {
    this.emit({ type: "model_start", modelId: model.model, provider: model.provider, model: model.model });

    const startTime = Date.now();

    try {
      // For now, only Anthropic is fully implemented
      // Other providers would need their own implementations
      if (model.provider === "anthropic") {
        return await this.executeAnthropic(model, prompt, startTime);
      }

      // Placeholder for other providers
      throw new Error(`Provider ${model.provider} not yet implemented`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute Anthropic model
   */
  private async executeAnthropic(
    model: TournamentModel,
    prompt: string,
    startTime: number
  ): Promise<TournamentResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not set");
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: model.model,
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature ?? 1.0,
      system: this.config.systemPrompt || "You are a helpful AI assistant participating in a tournament.",
      messages: [{ role: "user", content: prompt }],
    });

    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    // Extract text content
    let content = "";
    for (const block of response.content) {
      if (block.type === "text") {
        content += block.text;
      }
    }

    return {
      modelId: model.model,
      provider: "anthropic",
      model: model.model,
      content,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
      latencyMs,
      cost: calculateCost(model.model, inputTokens, outputTokens),
      timestamp: new Date(),
    };
  }

  /**
   * Cast a vote
   */
  castVote(voterId: string, modelId: string, reason?: string): void {
    const vote = {
      voterId,
      votedForModelId: modelId,
      reason,
      timestamp: new Date(),
    };

    this.status.votes.push(vote);
    this.emit({ type: "vote_cast", vote });

    // Auto-determine winner if we have votes
    this.determineWinner();
  }

  /**
   * Determine winner based on votes
   */
  private determineWinner(): void {
    if (this.status.votes.length === 0) return;

    // Count votes per model
    const voteCounts: Record<string, number> = {};

    for (const vote of this.status.votes) {
      voteCounts[vote.votedForModelId] = (voteCounts[vote.votedForModelId] || 0) + 1;
    }

    // Find model with most votes
    let maxVotes = 0;
    let winner: string | undefined;

    for (const [modelId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = modelId;
      }
    }

    this.status.winner = winner;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create and run a tournament
 */
export async function runTournament(
  config: TournamentConfig,
  eventCallback?: TournamentEventCallback
): Promise<TournamentStatus> {
  const runner = new TournamentRunner(config, eventCallback);
  return runner.run();
}

/**
 * Create a tournament runner (for more control)
 */
export function createTournamentRunner(
  config: TournamentConfig,
  eventCallback?: TournamentEventCallback
): TournamentRunner {
  return new TournamentRunner(config, eventCallback);
}
