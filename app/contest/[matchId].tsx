import { useLocalSearchParams, Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useContests } from "../../features/contests/useContests";
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
  const join = useContestJoin(id);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>CONTESTS</Text>
      <Text style={styles.title}>{match?.title ?? "Match"}</Text>

      <Link href={{ pathname: "/team/[matchId]", params: { matchId: id } }} asChild>
        <Pressable style={styles.create}><Text style={styles.createText}>Create / select team</Text></Pressable>
      </Link>

      {teams.length > 0 && (
        <View style={styles.teamBox}>
          <Text style={styles.teamHeading}>Select team to join</Text>
          {teams.map((team) => (
            <Pressable key={team.id} onPress={() => setSelectedTeamId(team.id)} style={[styles.teamRow, selectedTeamId === team.id && styles.teamSelected]}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamCheck}>{selectedTeamId === team.id ? "✓" : ""}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {contests.map((contest) => {
        const decision = canJoinContest({ matchStatus: match?.status ?? "upcoming", deadlineAt: match?.deadlineAt ?? null, effectiveStartsAt: match?.effectiveStartsAt ?? match?.startsAt ?? null });
        const disabled = !decision.allowed || !selectedTeamId || join.isPending;

        return (
          <View key={contest.id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{contest.name}</Text>
                <Text style={styles.meta}>₹{contest.entryFee} entry · ₹{contest.prizePool} prize</Text>
                <Text style={styles.meta}>{contest.filledSpots}/{contest.totalSpots} spots filled</Text>
              </View>
              <Pressable disabled={disabled} onPress={() => selectedTeamId && join.mutate({ contestId: contest.id, teamId: selectedTeamId })} style={[styles.join, disabled && styles.disabled]}>
                <Text style={styles.joinText}>Join</Text>
              </Pressable>
            </View>
            {!decision.allowed && <Text style={styles.closed}>{decision.reason}</Text>}
            {!selectedTeamId && decision.allowed && <Text style={styles.hint}>Select a team before joining.</Text>}
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
  teamRow: { padding: 11, borderRadius: 10, flexDirection: "row", justifyContent: "space-between" },
  teamSelected: { backgroundColor: "#FFF0F2" },
  teamName: { fontSize: 13, fontWeight: "800", color: theme.colors.text },
  teamCheck: { color: theme.colors.primary, fontWeight: "900" },
  card: { marginTop: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 15 },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  meta: { marginTop: 4, fontSize: 12, color: theme.colors.muted },
  join: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10 },
  disabled: { opacity: 0.4 },
  joinText: { color: "#fff", fontWeight: "900" },
  closed: { marginTop: 10, color: theme.colors.primary, fontSize: 12, fontWeight: "700" },
  hint: { marginTop: 10, color: theme.colors.muted, fontSize: 11 },
  empty: { marginTop: 20, color: theme.colors.muted },
});