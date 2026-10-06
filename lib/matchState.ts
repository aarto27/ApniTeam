export type MatchStatus = "scheduled" | "live" | "completed" | "cancelled";

export type MatchStateInput = {
  status?: string | number | null;
  startsAt?: string | number | Date | null;
  effectiveStartsAt?: string | number | Date | null;
  cancelled?: boolean;
  completed?: boolean;
  liveProviderState?: boolean;
};

const toMs = (value: MatchStateInput["startsAt"]) => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value < 100000000000 ? value * 1000 : value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  return NaN;
};

const normalizedProviderStatus = (status: MatchStateInput["status"]) => {
  const value = String(status ?? "").trim().toLowerCase();
  if (["4","cancelled","canceled","abandoned"].includes(value)) return "cancelled";
  if (["2","completed","complete","finished","ft","result"].includes(value)) return "completed";
  if (["3","live","in progress","ongoing","1h","ht","2h","pen"].includes(value)) return "live";
  return "scheduled";
};

export function resolveMatchStatus(input: MatchStateInput): MatchStatus {
  if (input.cancelled) return "cancelled";
  if (input.completed) return "completed";

  const provider = normalizedProviderStatus(input.status);
  if (provider === "cancelled" || provider === "completed") return provider;

  const startMs = toMs(input.effectiveStartsAt ?? input.startsAt);
  const now = Date.now();

  // A provider saying "live" is trusted only once the authoritative/effective
  // scheduled start has arrived. Toss/news events cannot start the match early.
  if (provider === "live" && Number.isFinite(startMs) && now >= startMs) return "live";
  if (input.liveProviderState && (!Number.isFinite(startMs) || now >= startMs)) return "live";

  return "scheduled";
}

export function msUntilStart(input: MatchStateInput) {
  const startMs = toMs(input.effectiveStartsAt ?? input.startsAt);
  if (!Number.isFinite(startMs)) return 0;
  return Math.max(0, startMs - Date.now());
}
