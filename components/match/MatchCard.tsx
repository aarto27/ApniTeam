import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MatchRecord } from "../../domain/matchState";
import { theme } from "../../lib/theme";

const formatStart = (value: string | null) => {
  if (!value) return "Start time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Start time unavailable";
  return date.toLocaleString([], { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
};

export function MatchCard({ match }: { match: MatchRecord }) {
  const statusLabel = match.status === "live" ? "LIVE" : match.status.toUpperCase();

  return (
    <Link href={{ pathname: "/match/[id]", params: { id: match.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.top}>
          <Text style={[styles.status, match.status === "live" && styles.live]}>{statusLabel}</Text>
          <Text style={styles.sport}>{match.sport.toUpperCase()}</Text>
        </View>
        <View style={styles.teams}>
          <View style={styles.team}><Text style={styles.teamName}>{match.homeTeam}</Text><Text style={styles.vs}>HOME</Text></View>
          <Text style={styles.vsMain}>VS</Text>
          <View style={[styles.team, styles.teamRight]}><Text style={styles.teamName}>{match.awayTeam}</Text><Text style={styles.vs}>AWAY</Text></View>
        </View>
        <View style={styles.bottom}>
          <Text style={styles.time}>{match.status === "live" ? "Match is live" : formatStart(match.effectiveStartsAt ?? match.startsAt)}</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 10 },
  pressed: { opacity: 0.92 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  status: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: theme.colors.primary },
  live: { color: theme.colors.live },
  sport: { fontSize: 10, fontWeight: "800", color: theme.colors.muted },
  teams: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  team: { flex: 1 },
  teamRight: { alignItems: "flex-end" },
  teamName: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  vs: { marginTop: 4, fontSize: 10, fontWeight: "700", color: theme.colors.muted },
  vsMain: { marginHorizontal: 12, fontSize: 11, fontWeight: "900", color: theme.colors.muted },
  bottom: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  time: { fontSize: 12, color: theme.colors.text, fontWeight: "700" },
  arrow: { fontSize: 24, color: theme.colors.muted },
});
