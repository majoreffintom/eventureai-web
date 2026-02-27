/**
 * Tournament module for @eventureai/builder-llm
 *
 * Provides multi-LLM tournament capabilities including parallel execution,
 * debate mode, and voting systems.
 *
 * @module tournament
 */

export {
  TournamentRunner,
  runTournament,
  createTournamentRunner,
} from "./runner.js";

export {
  // Types
  type LLMProvider,
  type TournamentModel,
  type TournamentConfig,
  type TournamentResponse,
  type DebateMessage,
  type TournamentVote,
  type TournamentState,
  type TournamentStatus,
  type TournamentEventCallback,
  type TournamentEvent,
  // Constants
  DEFAULT_TOURNAMENT_MODELS,
  MODEL_COSTS,
  // Functions
  calculateCost,
} from "./types.js";
