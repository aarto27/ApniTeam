export type MatchTiming = {
  scheduledStart: string;
  effectiveStart: string;
  deadlineAt: string | null;
  extensionReason?: string | null;
};

export function effectiveStartMs(timing: MatchTiming) {
  const scheduled = new Date(timing.scheduledStart).getTime();
  const effective = new Date(timing.effectiveStart || timing.scheduledStart).getTime();
  return Number.isFinite(effective) ? Math.max(scheduled, effective) : scheduled;
}

export function isBeforeEffectiveStart(timing: MatchTiming, now = Date.now()) {
  return now < effectiveStartMs(timing);
}

export function isJoinable(timing: MatchTiming, now = Date.now()) {
  if (timing.deadlineAt && now >= new Date(timing.deadlineAt).getTime()) return false;
  return now < effectiveStartMs(timing);
}

export function applyDelay(
  timing: MatchTiming,
  newStartIso: string,
  reason: string,
): MatchTiming {
  const newStart = new Date(newStartIso);
  if (Number.isNaN(newStart.getTime())) throw new Error("Invalid effective start");

  return {
    ...timing,
    effectiveStart: newStart.toISOString(),
    deadlineAt: new Date(newStart.getTime() - 60_000).toISOString(),
    extensionReason: reason,
  };
}
