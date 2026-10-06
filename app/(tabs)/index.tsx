import { ScrollView, StyleSheet, Text, View } from "react-native";
import { MatchCard } from "../../components/match/MatchCard";
import { useMatches } from "../../features/matches/useMatches";
import { theme } from "../../lib/theme";

export default function Home() {
  const { data: matches = [], isLoading, isError, refetch } = useMatches();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.brand}>ApniTeam</Text>
        </View>
        <View style={styles.wallet}>
          <Text style={styles.walletLabel}>Balance</Text>
          <Text style={styles.walletValue}>₹0</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroKicker}>FANTASY SPORTS</Text>
        <Text style={styles.heroTitle}>Pick smart. Play better.</Text>
        <Text style={styles.heroText}>
          Create teams before the deadline and follow every point live.
        </Text>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Matches</Text>
        <Text style={styles.count}>{matches.length}</Text>
      </View>

      {isLoading && <Text style={styles.message}>Loading matches...</Text>}
      {isError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not load matches</Text>
          <Text style={styles.message}>Check your connection and Supabase configuration.</Text>
          <Text onPress={() => void refetch()} style={styles.retry}>Retry</Text>
        </View>
      )}
      {!isLoading && !isError && matches.length === 0 && (
        <Text style={styles.message}>No matches available right now.</Text>
      )}
      {matches.map((match) => <MatchCard key={match.id} match={match} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 18, paddingTop: 24, paddingBottom: 30 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 12, color: theme.colors.muted },
  brand: { fontSize: 24, fontWeight: "900", color: theme.colors.text },
  wallet: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border },
  walletLabel: { fontSize: 10, color: theme.colors.muted },
  walletValue: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  hero: { marginTop: 18, backgroundColor: theme.colors.primary, borderRadius: 22, padding: 22 },
  heroKicker: { color: "#FFD9DD", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 8 },
  heroText: { color: "#FFECEF", fontSize: 13, lineHeight: 19, marginTop: 8 },
  sectionRow: { marginTop: 26, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  section: { fontSize: 18, fontWeight: "900", color: theme.colors.text },
  count: { fontSize: 12, fontWeight: "800", color: theme.colors.muted },
  message: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  errorBox: { backgroundColor: "#FFF1F2", borderRadius: 14, padding: 14, marginBottom: 12 },
  errorTitle: { color: theme.colors.text, fontWeight: "800", marginBottom: 4 },
  retry: { color: theme.colors.primary, fontWeight: "800", marginTop: 10 },
});