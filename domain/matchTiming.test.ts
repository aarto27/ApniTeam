import { describe, expect, it } from "vitest";
import { effectiveStartMs, isBeforeEffectiveStart, isJoinable } from "../domain/matchTiming";

const timing = {
  scheduledStart: "2026-10-06T10:00:00.000Z",
  effectiveStart: "2026-10-06T12:00:00.000Z",
  deadlineAt: "2026-10-06T11:59:00.000Z",
};

describe("match timing", () => {
  it("never moves effective start earlier than scheduled start", () => {
    expect(effectiveStartMs({
      ...timing,
      effectiveStart: "2026-10-06T09:00:00.000Z",
    })).toBe(new Date(timing.scheduledStart).getTime());
  });

  it("keeps the match before effective start even when provider says live", () => {
    expect(isBeforeEffectiveStart(timing, new Date("2026-10-06T11:00:00.000Z").getTime())).toBe(true);
  });

  it("closes team/contest changes at the deadline", () => {
    expect(isJoinable(timing, new Date("2026-10-06T11:59:00.000Z").getTime())).toBe(false);
    expect(isJoinable(timing, new Date("2026-10-06T11:30:00.000Z").getTime())).toBe(true);
  });

  it("closes changes at effective start even if the deadline is missing", () => {
    expect(isJoinable({ ...timing, deadlineAt: null }, new Date("2026-10-06T12:00:00.000Z").getTime())).toBe(false);
  });
});
