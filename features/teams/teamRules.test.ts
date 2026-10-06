import { describe, expect, it } from "vitest";
import { validateFantasyTeam } from "../features/teams/teamRules";

function players(roleCounts: Record<string, number>, teamId = "A") {
  const result: { id: string; role: any; teamId: string }[] = [];
  let index = 0;
  for (const [role, count] of Object.entries(roleCounts)) {
    for (let i = 0; i < count; i += 1) {
      result.push({ id: String(++index), role, teamId });
    }
  }
  return result;
}

describe("fantasy team rules", () => {
  it("accepts a valid cricket composition", () => {
    const selected = [
      ...players({ WK: 1 }, "A"),
      ...players({ BAT: 3 }, "A"),
      ...players({ AR: 2 }, "B"),
      ...players({ BOWL: 5 }, "B"),
    ];
    expect(validateFantasyTeam(selected, "cricket").valid).toBe(true);
  });

  it("rejects more than seven players from one real team", () => {
    const selected = players({ WK: 1, BAT: 3, AR: 2, BOWL: 5 }, "A");
    expect(validateFantasyTeam(selected, "cricket").errors).toContain(
      "Maximum 7 players from one team (A).",
    );
  });

  it("rejects duplicate players", () => {
    const selected = [
      ...players({ WK: 1, BAT: 3, AR: 2, BOWL: 5 }, "A"),
    ];
    selected[10] = selected[0];
    expect(validateFantasyTeam(selected, "cricket").errors).toContain(
      "A player cannot be selected twice.",
    );
  });

  it("enforces football goalkeeper and striker limits", () => {
    const selected = players({ GK: 1, DEF: 3, MID: 3, ST: 4 }, "A");
    expect(validateFantasyTeam(selected, "football").valid).toBe(false);
    expect(validateFantasyTeam(selected, "football").errors).toContain("Select at most 3 ST.");
  });
});
