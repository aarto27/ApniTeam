export type MatchPhase = "upcoming" | "live" | "completed" | "cancelled";

export type MatchRecord = {
  id: string;
  sport: "cricket" | "football" | "unknown";
  title: string;
  shortTitle: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string | null;
  effectiveStartsAt: string | null;
  status: MatchPhase;
  providerStatus: string | null;
  toss: string | null;
  lineupAnnounced: boolean;
  deadlineAt: string | null;
  metadata: Record<string, unknown>;
};

const asString = (value: unknown): string | null => value === null || value === undefined || value === "" ? null : String(value);

const asBool = (value: unknown): boolean => value === true || value === 1 || value === "1" || value === "true";

const asDateMs = (value: unknown): number => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value < 100000000000 ? value * 1000 : value;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : NaN;
  }
  return NaN;
};

const first = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return null;
};

const normalizeSport = (value: unknown): MatchRecord["sport"] => {
  const sport = String(value ?? "").toLowerCase();
  if (sport.includes("cricket")) return "cricket";
  if (sport.includes("football") || sport.includes("soccer")) return "football";
  return "unknown";
};

const normalizeProviderStatus = (value: unknown): MatchPhase => {
  const status = String(value ?? "").trim().toLowerCase();
  if (["cancelled", "canceled", "abandoned", "4"].includes(status)) return "cancelled";
  if (["completed", "complete", "finished", "ft", "result", "2"].includes(status)) return "completed";
  if (["live", "in progress", "ongoing", "1h", "2h", "ht", "pen", "3"].includes(status)) return "live";
  return "upcoming";
};

export function resolveMatchPhase(row: {
  status?: unknown;
  startsAt?: unknown;
  effectiveStartsAt?: unknown;
  completed?: unknown;
  cancelled?: unknown;
  liveProviderState?: unknown;
}): MatchPhase {
  if (asBool(row.cancelled)) return "cancelled";
  if (asBool(row.completed)) return "completed";

  const providerPhase = normalizeProviderStatus(row.status);
  if (providerPhase === "cancelled" || providerPhase === "completed") return providerPhase;

  const start = asDateMs(row.effectiveStartsAt ?? row.startsAt);
  const started = Number.isFinite(start) && Date.now() >= start;

  // A provider live flag is never allowed to move a future match to live.
  if (providerPhase === "live" && started) return "live";
  if (asBool(row.liveProviderState) && started) return "live";
  return "upcoming";
}

export function normalizeMatch(row: Record<string, unknown>): MatchRecord {
  const home = first(row, ["home_team", "homeTeam", "team1", "team_a", "home"]);
  const away = first(row, ["away_team", "awayTeam", "team2", "team_b", "away"]);
  const startsAt = first(row, ["start_time", "starts_at", "startTime", "scheduled_start", "match_time", "date_start"]);
  const effectiveStartsAt = first(row, ["effective_start_time", "effective_starts_at", "effectiveStartTime", "rescheduled_start"]);
  const providerStatus = first(row, ["status", "match_status", "provider_status", "state"]);
  const sport = normalizeSport(first(row, ["sport", "sport_type", "game_type"]));
  const homeName = typeof home === "object" && home ? String((home as Record<string, unknown>).name ?? "") : String(home ?? "");
  const awayName = typeof away === "object" && away ? String((away as Record<string, unknown>).name ?? "") : String(away ?? "");
  const rawTitle = first(row, ["title", "name", "match_name"]);
  const title = String(rawTitle ?? [homeName, awayName].filter(Boolean).join(" vs ") || "Match");

  const phase = resolveMatchPhase({
    status: providerStatus,
    startsAt,
    effectiveStartsAt: effectiveStartsAt ?? startsAt,
    completed: first(row, ["completed", "is_completed"]),
    cancelled: first(row, ["cancelled", "canceled", "is_cancelled"]),
    liveProviderState: first(row, ["is_live", "live", "live_provider_state"]),
  });

  return {
    id: String(first(row, ["id", "match_id"]) ?? ""),
    sport,
    title,
    shortTitle: title.length > 28 ? title.slice(0, 28) + "…" : title,
    homeTeam: homeName || "Home",
    awayTeam: awayName || "Away",
    startsAt: asString(startsAt),
    effectiveStartsAt: asString(effectiveStartsAt),
    status: phase,
    providerStatus: asString(providerStatus),
    toss: asString(first(row, ["toss", "toss_result", "toss_winner"])),
    lineupAnnounced: asBool(first(row, ["lineup_announced", "lineupAnnounced", "is_lineup_out"])),
    deadlineAt: asString(first(row, ["deadline_at", "deadline", "entry_deadline", "dd"])),
    metadata: row,
  };
}
