export type VoteStage = "PREVOTE" | "VOTING" | "RESULTS";

export const VOTE_STAGES: readonly VoteStage[] = ["PREVOTE", "VOTING", "RESULTS"];

export interface Vote {
  characterId: string;
  ts: number; // server timestamp
}

export interface SessionMeta {
  startedAt: number;
  endedAt?: number;
}

export interface FrozenResults {
  order: string[];                  // characterIds, lowest votes first, winner last
  counts: Record<string, number>;
  tiedForFirst?: string[];          // present only when the top spot is tied
  frozenAt: number;
}
