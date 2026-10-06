import { useLocalSearchParams, Link } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useContests } from "../../features/contests/useContests";
import { useContestJoin } from "../../features/contests/useContestJoin";
import { useMatch } from "../../features/matches/useMatches";
import { canJoinContest } from "../../domain/contestRules";
import { theme } from "../../lib/theme";

export default function Contests() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const id = String(matchId ?? "");
  const { data: match } = useMatch(id);
  const { data: contests = [], isLoading } = useContests(id);
  const join = useContestJoin(id);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>CONTESTS</Text>
      <Text style={styles.title}>{match?.title ?? "Match"}</Text>

      <Link href={{ pathname: "/team/[matchId]", params: { matchId: id } }} asChild>
        <Pressable style={styles.create}><Text style={styles.createText}>Create / select team</Text></Pressable>
      </Link>

      {contests.map((contest) => {
        const decision = canJoinContest({
          matchStatus: match?.status ?? "upcoming",
          deadlineAt: match?.deadlineAt ?? null,
        });
        const disabled = !decision.allowed || join.isPending;

        return (
          <View key={contest.id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{contest.name}</Text>
                <Text style={styles.meta}>₹{contest.entryFee} entry · ₹{contest.prizePool} prize</Text>
                <Text style={styles.meta}>{contest.filledSpots}/{contest.totalSpots} spots filled</Text>
              </View>
              <Pressable
                disabled={disabled}
                onPress={() => join.mutate({ contestId: contest.id, teamId: "SELECT_TEAM" })}
                style={[styles.join, disabled && styles.disabled]}
              >
                <Text style={styles.joinText}>Join</Text>
              </Pressable>
            </View>
            {!decision.allowed && <Text style={styles.closed}>{decision.reason}</Text>}
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
  card: { marginTop: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 15 },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  meta: { marginTop: 4, fontSize: 12, color: theme.colors.muted },
  join: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10 },
  disabled: { opacity: 0.4 },
  joinText: { color: "#fff", fontWeight: "900" },
  closed: { marginTop: 10, color: theme.colors.primary, fontSize: 12, fontWeight: "700" },
  empty: { marginTop: 20, color: theme.colors.muted },
});