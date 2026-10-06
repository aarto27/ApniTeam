import { describe, expect, it } from "vitest";
import { normalizeLiveScore } from "./liveScoringContract";

describe("live scoring contract", () => {
  it("normalizes provider timestamps and points", () => {
    const result = normalizeLiveScore({
      eventId: "evt-1",
      matchId: "match-1",
      playerId: "player-1",
      stats: { fantasyPoints: 42.5 },
      occurredAt: "2026-10-06T12:00:00+05:30",
    });

    expect(result).toEqual({
      eventId: "evt-1",
      matchId: "match-1",
      playerId: "player-1",
      points: 42.5,
      occurredAt: "2026-10-06T06:30:00.000Z",
    });
  });

  it("rejects events without stable identity", () => {
    expect(() => normalizeLiveScore({
      eventId: "",
      matchId: "match-1",
      playerId: "player-1",
      stats: { fantasyPoints: 10 },
      occurredAt: "2026-10-06T12:00:00Z",
    })).toThrow("Invalid scoring event identity");
  });
});
