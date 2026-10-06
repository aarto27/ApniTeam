export type ContestJoinDecision = {
  allowed: boolean;
  reason: string | null;
};

export function canJoinContest(input: {
  matchStatus: "upcoming" | "live" | "completed" | "cancelled";
  deadlineAt: string | null;
  now?: number;
}): ContestJoinDecision {
  const now = input.now ?? Date.now();

  if (input.matchStatus === "completed" || input.matchStatus === "cancelled") {
    return { allowed: false, reason: "This match is no longer available." };
  }

  if (!input.deadlineAt) {
    return {
      allowed: input.matchStatus === "upcoming",
      reason: input.matchStatus === "live" ? "Joining is closed." : null,
    };
  }

  const deadline = Date.parse(input.deadlineAt);
  if (!Number.isFinite(deadline)) {
    return { allowed: false, reason: "Contest deadline is unavailable." };
  }

  if (now >= deadline) {
    return { allowed: false, reason: "The contest deadline has passed." };
  }

  return { allowed: true, reason: null };
}
