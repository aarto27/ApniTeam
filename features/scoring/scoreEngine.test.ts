import { describe, expect, it } from "vitest";
import { calculateEntryPoints } from "./scoreEngine";

describe("fantasy score engine", () => {
  it("applies captain and vice-captain multipliers", () => {
    const points = calculateEntryPoints(
      ["p1", "p2", "p3"],
      "p1",
      "p2",
      [
        { playerId: "p1", runs: 20 },
        { playerId: "p2", runs: 10 },
        { playerId: "p3", runs: 5 },
      ],
      "cricket",
    );

    expect(points).toBe(55);
  });

  it("ignores scores from players outside the fantasy team", () => {
    const points = calculateEntryPoints(
      ["p1"],
      "p1",
      "p2",
      [
        { playerId: "p1", runs: 20 },
        { playerId: "p2", runs: 100 },
      ],
      "cricket",
    );

    expect(points).toBe(40);
  });

  it("does not double count a player inside the selected list", () => {
    const points = calculateEntryPoints(
      ["p1", "p1"],
      "p1",
      "p2",
      [{ playerId: "p1", runs: 20 }],
      "cricket",
    );

    expect(points).toBe(40);
  });
});
