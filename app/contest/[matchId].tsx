import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useContests } from "../../features/contests/useContests";
import { useContestEntries } from "../../features/contests/useContestEntries";
import { useContestJoin } from "../../features/contests/useContestJoin";
import { useMatch } from "../../features/matches/useMatches";
import { useMyTeams } from "../../features/teams/useMyTeams";
import { canJoinContest } from "../../domain/contestRules";
import { theme } from "../../lib/theme";

export default function Contests() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const id = String(matchId ?? "");
  const { data: match } = useMatch(id);
  const { data: contests = [], isLoading } = useContests(id);
  const { data: teams = [] } = useMyTeams(id);
  const { data: entries = [] } = useContestEntries(id);
  const join = useContestJoin(id);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teams[0]?.id ?? null);

  const entryByContest = useMemo(
    () => new Map(entries.map((entry) => [entry.contestId, entry])),
    [entries],
  );

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

  const decision = canJoinContest({
    matchStatus: match?.status ?? "upcoming",
    deadlineAt: match?.deadlineAt ?? null,
    effectiveStartsAt: match?.effectiveStartsAt ?? match?.startsAt ?? null,
  });

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>CONTESTS</Text>
      <Text style={styles.title}>{match?.title ?? "Match"}</Text>

      <Link href={{ pathname: "/team/[matchId]", params: { matchId: id } }} asChild>
        <Pressable style={styles.create}>
          <Text style={styles.createText}>{teams.length ? "Create another team" : "Create your first team"}</Text>
        </Pressable>
      </Link>

      {teams.length > 0 && (
        <View style={styles.teamBox}>
          <Text style={styles.teamHeading}>Select team</Text>
          {teams.map((team) => (
            <Pressable
              key={team.id}
              onPress={() => setSelectedTeamId(team.id)}
              style={[styles.teamRow, selectedTeamId === team.id && styles.teamSelected]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamMeta}>{team.players.length}/11 players</Text>
              </View>
              <Text style={styles.teamCheck}>{selectedTeamId === team.id ? "✓" : ""}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {!teams.length && decision.allowed && (
        <Text style={styles.hint}>Create a team first. Your wallet is only charged when you successfully join a contest.</Text>
      )}

      {!decision.allowed && <Text style={styles.closed}>{decision.reason}</Text>}

      {contests.map((contest) => {
        const entry = entryByContest.get(contest.id);
        const alreadyJoined = Boolean(entry);
        const disabled = alreadyJoined || contest.isFull || !decision.allowed || !selectedTeamId || join.isPending;

        return (
          <View key={contest.id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{contest.name}</Text>
                <Text style={styles.prize}>₹{contest.prizePool.toLocaleString("en-IN")} prize pool</Text>
                <Text style={styles.meta}>₹{contest.entryFee} entry · {contest.remainingSpots.toLocaleString("en-IN")} spots left</Text>
              </View>

              {alreadyJoined ? (
                <Pressable onPress={() => router.push({ pathname: "/live/[contestId]", params: { contestId: contest.id } })} style={styles.joined}>
                  <Text style={styles.joinedText}>Joined</Text>
                </Pressable>
              ) : (
                <Pressable
                  disabled={disabled}
                  onPress={() => selectedTeamId && join.mutate({ contestId: contest.id, teamId: selectedTeamId })}
                  style={[styles.join, disabled && styles.disabled]}
                >
                  <Text style={styles.joinText}>{contest.isFull ? "Full" : join.isPending ? "Joining..." : "Join"}</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progress, { width: contest.totalSpots ? `${Math.min(100, (contest.filledSpots / contest.totalSpots) * 100)}%` : "0%" }]} />
            </View>

            {alreadyJoined && (
              <Text style={styles.success}>
                Your rank: {entry.rank == null ? "Pending" : `#${entry.rank}`} · Points: {entry.points.toFixed(1)}
              </Text>
            )}
            {!alreadyJoined && !selectedTeamId && decision.allowed && teams.length > 0 && (
              <Text style={styles.hint}>Select a team before joining.</Text>
            )}
            {join.isError && <Text style={styles.closed}>{join.error.message}</Text>}
          </View>
        );
      })}

      {!contests.length && <Text style={styles.empty}>No contests available for this match.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 18, paddingTop: 28, paddingBottom: 30 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg },
  kicker: { color: theme.colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900", marginTop: 5 },
  create: { marginTop: 16, backgroundColor: theme.colors.primary, borderRadius: 13, padding: 14, alignItems: "center" },
  createText: { color: "#fff", fontWeight: "900" },
  teamBox: { marginTop: 12, backgroundColor: "#fff", borderRadius: 15, padding: 12, borderWidth: 1, borderColor: theme.colors.border },
  teamHeading: { fontSize: 12, fontWeight: "900", color: theme.colors.text, marginBottom: 7 },
  teamRow: { padding: 11, borderRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  teamSelected: { backgroundColor: "#FFF0F2" },
  teamName: { fontSize: 13, fontWeight: "800", color: theme.colors.text },
  teamMeta: { marginTop: 3, fontSize: 10, color: theme.colors.muted },
  teamCheck: { color: theme.colors.primary, fontWeight: "900" },
  card: { marginTop: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 15 },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  prize: { marginTop: 5, fontSize: 13, fontWeight: "800", color: theme.colors.text },
  meta: { marginTop: 4, fontSize: 11, color: theme.colors.muted },
  join: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10 },
  joined: { backgroundColor: "#E8F8F0", borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  joinedText: { color: theme.colors.success, fontWeight: "900" },
  disabled: { opacity: 0.4 },
  joinText: { color: "#fff", fontWeight: "900" },
  progressTrack: { height: 5, backgroundColor: theme.colors.border, borderRadius: 10, marginTop: 13, overflow: "hidden" },
  progress: { height: "100%", backgroundColor: theme.colors.primary, borderRadius: 10 },
  success: { marginTop: 9, color: theme.colors.success, fontSize: 11, fontWeight: "800" },
  closed: { marginTop: 10, color: theme.colors.primary, fontSize: 12, fontWeight: "700" },
  hint: { marginTop: 10, color: theme.colors.muted, fontSize: 11, lineHeight: 17 },
  empty: { marginTop: 20, color: theme.colors.muted },
});
