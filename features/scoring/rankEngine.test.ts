import { describe, expect, it } from "vitest";
import { rankEntries } from "./rankEngine";

describe("rank engine", () => {
  it("uses dense ranking for ties", () => {
    const ranked = rankEntries([
      { entryId: "b", userId: "u2", points: 100 },
      { entryId: "a", userId: "u1", points: 100 },
      { entryId: "c", userId: "u3", points: 90 },
    ]);

    expect(ranked.map((entry) => [entry.entryId, entry.rank])).toEqual([
      ["a", 1],
      ["b", 1],
      ["c", 2],
    ]);
  });
});
