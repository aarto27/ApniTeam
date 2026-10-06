import { describe, expect, it } from "vitest";
import { canJoinContest } from "./contestRules";

describe("contest join rules", () => {
  const base = {
    matchStatus: "upcoming",
    deadlineAt: "2026-10-06T11:59:00.000Z",
    effectiveStartsAt: "2026-10-06T12:00:00.000Z",
  };

  it("allows a join before deadline and effective start", () => {
    expect(canJoinContest({ ...base, now: Date.parse("2026-10-06T11:30:00.000Z") }).allowed).toBe(true);
  });

  it("blocks exactly at the deadline", () => {
    expect(canJoinContest({ ...base, now: Date.parse(base.deadlineAt) })).toEqual({
      allowed: false,
      reason: "The deadline has passed.",
    });
  });

  it("blocks at effective start even if the deadline is later", () => {
    expect(canJoinContest({
      ...base,
      deadlineAt: "2026-10-06T12:30:00.000Z",
      now: Date.parse(base.effectiveStartsAt),
    })).toEqual({
      allowed: false,
      reason: "The match has started.",
    });
  });

  it("blocks completed and cancelled matches", () => {
    expect(canJoinContest({ ...base, matchStatus: "completed" }).allowed).toBe(false);
    expect(canJoinContest({ ...base, matchStatus: "cancelled" }).allowed).toBe(false);
  });
});
