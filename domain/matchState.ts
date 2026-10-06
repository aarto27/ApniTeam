export type MatchPhase = "upcoming" | "live" | "completed" | "cancelled";

export type MatchRecord = {
  id: string;
  sport: "cricket" | "football" | string;
  title: string;
  shortTitle?: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
  effectiveStartsAt: string;
  status?: string;
  providerStatus?: string | null;
  toss?: string | null;
  lineupAnnounced?: boolean;
  deadlineAt?: string | null;
  metadata?: Record<string, unknown>;
};

const cancelled = new Set(["cancelled", "abandoned", "postponed"]);
const completed = new Set(["completed", "finished", "ended"]);

export function resolveMatchPhase(match: MatchRecord, now = Date.now()): MatchPhase {
  const status = String(match.status ?? "").toLowerCase();
  const provider = String(match.providerStatus ?? "").toLowerCase();

  if (cancelled.has(status) || cancelled.has(provider)) return "cancelled";
  if (completed.has(status) || completed.has(provider)) return "completed";

  const effectiveStart = new Date(match.effectiveStartsAt || match.startsAt).getTime();
  if (!Number.isFinite(effectiveStart)) return "upcoming";

  // Provider live signals are advisory until the effective start.
  if (now >= effectiveStart && (status === "live" || provider === "live")) return "live";
  if (now >= effectiveStart && match.metadata?.liveProviderState === "live") return "live";

  return "upcoming";
}

export function normalizeMatch(row: Record<string, unknown>): MatchRecord {
  const homeTeam = String(row.home_team ?? row.homeTeam ?? row.team_a ?? "Home");
  const awayTeam = String(row.away_team ?? row.awayTeam ?? row.team_b ?? "Away");
  const startsAt = String(row.starts_at ?? row.start_time ?? row.match_start_time ?? new Date().toISOString());
  const effectiveStartsAt = String(row.effective_starts_at ?? row.effective_start_time ?? startsAt);
  const generatedTitle = [homeTeam, awayTeam].filter(Boolean).join(" vs ");

  return {
    id: String(row.id),
    sport: String(row.sport ?? "cricket"),
    title: String(row.title ?? row.name ?? generatedTitle || "Match"),
    shortTitle: row.short_title ? String(row.short_title) : undefined,
    homeTeam,
    awayTeam,
    startsAt,
    effectiveStartsAt,
    status: row.status ? String(row.status) : undefined,
    providerStatus: row.provider_status ? String(row.provider_status) : null,
    toss: row.toss ? String(row.toss) : null,
    lineupAnnounced: Boolean(row.lineup_announced),
    deadlineAt: row.deadline_at ? String(row.deadline_at) : null,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {},
  };
}
