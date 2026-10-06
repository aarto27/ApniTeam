import { StyleSheet, Text, View } from "react-native";
import { useMyMatches } from "../../features/myMatches/useMyMatches";
import { theme } from "../../lib/theme";

export default function MyMatches() {
  const { data: entries = [], isLoading, isError } = useMyMatches();

  return (
    <View style={s.page}>
      <Text style={s.title}>My Matches</Text>
      <Text style={s.sub}>Your upcoming, live and completed contests.</Text>

      {isLoading && <Text style={s.sub}>Loading...</Text>}
      {isError && <Text style={s.error}>Could not load your contests.</Text>}
      {!isLoading && !isError && entries.length === 0 && (
        <Text style={s.empty}>You haven't joined any contests yet.</Text>
      )}

      {entries.map((entry, index) => (
        <View key={String(entry.id ?? index)} style={s.card}>
          <Text style={s.cardTitle}>{String(entry.match_name ?? entry.match_title ?? "Match")}</Text>
          <Text style={s.meta}>Contest: {String(entry.contest_name ?? entry.contest_id ?? "Contest")}</Text>
          <Text style={s.meta}>Rank: {String(entry.rank ?? "Pending")}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg, padding: 20, paddingTop: 28 },
  title: { fontSize: 28, fontWeight: "900", color: theme.colors.text },
  sub: { marginTop: 8, color: theme.colors.muted, lineHeight: 21 },
  error: { marginTop: 20, color: theme.colors.primary, fontWeight: "700" },
  empty: { marginTop: 30, color: theme.colors.muted },
  card: { marginTop: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: theme.colors.text },
  meta: { marginTop: 5, fontSize: 12, color: theme.colors.muted },
});