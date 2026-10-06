export type LivePlayerScore = {
  eventId: string;
  matchId: string;
  playerId: string;
  points: number;
  occurredAt: string;
};

export type SportsProviderEvent = {
  eventId: string;
  matchId: string;
  playerId: string;
  stats: Record<string, number | boolean>;
  occurredAt: string;
};

export interface SportsProviderAdapter {
  fetchEvents(matchId: string): Promise<SportsProviderEvent[]>;
}

export function normalizeLiveScore(event: SportsProviderEvent): LivePlayerScore {
  if (!event.eventId || !event.matchId || !event.playerId) {
    throw new Error("Invalid scoring event identity");
  }

  return {
    eventId: event.eventId,
    matchId: event.matchId,
    playerId: event.playerId,
    points: Number(event.stats.fantasyPoints ?? 0),
    occurredAt: new Date(event.occurredAt).toISOString(),
  };
}
