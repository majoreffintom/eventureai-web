/**
 * Database-integrated Tournament Runner
 *
 * Extends the base TournamentRunner with database persistence
 * using the existing Neon PostgreSQL tables.
 */

import { TournamentRunner, runTournament as baseRunTournament } from "../tournament/runner.js";
import {
  type TournamentConfig,
  type TournamentStatus,
  type TournamentEventCallback,
  type TournamentResponse,
} from "../tournament/types.js";
import {
  createTournament,
  updateTournamentStatus,
  saveLLMResponse,
  pickResponse,
  type SQLQuery,
} from "./index.js";

/**
 * Run a tournament with database persistence
 */
export async function runTournamentWithDB(
  sql: SQLQuery,
  config: TournamentConfig,
  options?: {
    appId?: number;
    workspaceId?: number;
    userId?: number;
    eventCallback?: TournamentEventCallback;
  }
): Promise<TournamentStatus> {
  // Create tournament record in database
  const dbTournament = await createTournament(sql, {
    prompt: config.prompt,
    debateMode: config.debateMode,
    rounds: config.rounds,
    modelsUsed: config.models.filter((m) => m.enabled).map((m) => m.model),
    appId: options?.appId,
    workspaceId: options?.workspaceId,
    userId: options?.userId,
  });

  // Track response IDs for picking
  const responseIdMap = new Map<string, number>();

  // Create event callback that also saves to DB
  const dbEventCallback: TournamentEventCallback = async (event) => {
    // Call user's callback if provided
    options?.eventCallback?.(event);

    // Handle database persistence
    switch (event.type) {
      case "tournament_start":
        await updateTournamentStatus(sql, dbTournament.id, "running", new Date());
        break;

      case "model_complete":
        // Save response to database
        const dbResponse = await saveLLMResponse(sql, {
          tournamentId: dbTournament.id,
          modelKey: event.response.model,
          modelProvider: event.response.provider,
          content: event.response.content,
          picked: false,
          interesting: false,
        });
        responseIdMap.set(event.response.modelId, dbResponse.id);
        break;

      case "tournament_complete":
        // If there's a winner, mark their response as picked
        if (event.winner) {
          const winnerResponseId = responseIdMap.get(event.winner);
          if (winnerResponseId) {
            await pickResponse(sql, winnerResponseId);
          }
        }
        await updateTournamentStatus(
          sql,
          dbTournament.id,
          "completed",
          undefined,
          new Date()
        );
        break;

      case "tournament_error":
        await updateTournamentStatus(sql, dbTournament.id, "error");
        break;
    }
  };

  // Run the tournament with DB callback
  const configWithCallback = {
    ...config,
    id: dbTournament.id.toString(),
  };

  const runner = new TournamentRunner(configWithCallback, dbEventCallback);

  // Override castVote to also update DB
  const originalCastVote = runner.castVote.bind(runner);
  runner.castVote = async (voterId: string, modelId: string, reason?: string) => {
    originalCastVote(voterId, modelId, reason);

    // Mark response as picked in DB
    const responseId = responseIdMap.get(modelId);
    if (responseId) {
      await pickResponse(sql, responseId);
    }
  };

  return runner.run();
}

/**
 * Create a database-integrated tournament runner
 */
export function createDBTournamentRunner(
  sql: SQLQuery,
  config: TournamentConfig,
  options?: {
    appId?: number;
    workspaceId?: number;
    userId?: number;
    eventCallback?: TournamentEventCallback;
  }
) {
  return {
    run: () => runTournamentWithDB(sql, config, options),
  };
}
