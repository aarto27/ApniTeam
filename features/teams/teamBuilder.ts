import { validateFantasyTeam, type SelectedPlayer, type TeamRole } from "./teamRules";
export type { TeamRole } from "./teamRules";

export type BuilderPlayer = SelectedPlayer & {
  name: string;
  credit?: number;
  teamName?: string;
};

export type TeamDraft = {
  players: BuilderPlayer[];
  captainId: string | null;
  viceCaptainId: string | null;
};

export function togglePlayer(draft: TeamDraft, player: BuilderPlayer): TeamDraft {
  const exists = draft.players.some((item) => item.id === player.id);
  return {
    ...draft,
    players: exists ? draft.players.filter((item) => item.id !== player.id) : [...draft.players, player],
  };
}

export function setCaptain(draft: TeamDraft, playerId: string): TeamDraft {
  if (!draft.players.some((player) => player.id === playerId)) return draft;
  return {
    ...draft,
    captainId: playerId,
    viceCaptainId: draft.viceCaptainId === playerId ? null : draft.viceCaptainId,
  };
}

export function setViceCaptain(draft: TeamDraft, playerId: string): TeamDraft {
  if (!draft.players.some((player) => player.id === playerId)) return draft;
  return {
    ...draft,
    viceCaptainId: playerId,
    captainId: draft.captainId === playerId ? null : draft.captainId,
  };
}

export function validateDraft(draft: TeamDraft, sport: "cricket" | "football") {
  const base = validateFantasyTeam(draft.players, sport);
  const errors = [...base.errors];

  if (!draft.captainId) errors.push("Select a captain.");
  if (!draft.viceCaptainId) errors.push("Select a vice-captain.");
  if (draft.captainId && !draft.players.some((p) => p.id === draft.captainId)) errors.push("Captain must be selected.");
  if (draft.viceCaptainId && !draft.players.some((p) => p.id === draft.viceCaptainId)) errors.push("Vice-captain must be selected.");
  if (draft.captainId && draft.captainId === draft.viceCaptainId) errors.push("Captain and vice-captain must be different.");

  return { valid: errors.length === 0, errors };
}

export function roleLabel(role: TeamRole) {
  return ({ WK: "Wicket Keeper", BAT: "Batter", AR: "All-Rounder", BOWL: "Bowler", GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", ST: "Striker" })[role];
}
