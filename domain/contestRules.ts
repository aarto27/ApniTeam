export function canJoinContest(input: {
  matchStatus: string;
  deadlineAt?: string | null;
  effectiveStartsAt?: string | null;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const status = input.matchStatus.toLowerCase();

  if (status === "completed" || status === "cancelled") {
    return { allowed: false, reason: "This match is closed." };
  }

  if (input.deadlineAt && now >= new Date(input.deadlineAt).getTime()) {
    return { allowed: false, reason: "The deadline has passed." };
  }

  if (input.effectiveStartsAt && now >= new Date(input.effectiveStartsAt).getTime()) {
    return { allowed: false, reason: "The match has started." };
  }

  return { allowed: true };
}
