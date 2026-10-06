import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useContestLeaderboard } from "../../features/scoring/useLeaderboard";
import { theme } from "../../lib/theme";

export default function LiveLeaderboard() {
  const { contestId } = useLocalSearchParams<{ contestId: string }>();
  const id = String(contestId ?? "");
  const { data: rows = [], isLoading, isError } = useContestLeaderboard(id);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>LIVE LEADERBOARD</Text>
      <Text style={styles.title}>Current standings</Text>
      {isLoading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 25 }} />}
      {isError && <Text style={styles.error}>Unable to load leaderboard.</Text>}
      {rows.map((row, index) => (
        <View key={String(row.entry_id ?? index)} style={styles.row}>
          <Text style={styles.rank}>#{String(row.rank ?? index + 1)}</Text>
          <View style={styles.user}><Text style={styles.name}>{String(row.team_name ?? row.user_name ?? "Team")}</Text><Text style={styles.points}>{Number(row.points ?? 0).toFixed(1)} pts</Text></View>
        </View>
      ))}
      {!isLoading && !isError && rows.length === 0 && <Text style={styles.empty}>Leaderboard will appear when scoring starts.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 18, paddingTop: 28, paddingBottom: 30 },
  kicker: { color: theme.colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: theme.colors.text, fontSize: 27, fontWeight: "900", marginTop: 5 },
  row: { marginTop: 9, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 14, flexDirection: "row", alignItems: "center" },
  rank: { width: 48, fontSize: 14, fontWeight: "900", color: theme.colors.primary },
  user: { flex: 1 },
  name: { fontSize: 14, fontWeight: "800", color: theme.colors.text },
  points: { marginTop: 3, fontSize: 12, color: theme.colors.muted },
  error: { marginTop: 20, color: theme.colors.primary, fontWeight: "700" },
  empty: { marginTop: 25, color: theme.colors.muted },
});