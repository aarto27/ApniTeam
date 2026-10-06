import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useMatch } from "../../features/matches/useMatches";
import { theme } from "../../lib/theme";

const countdown = (value: string | null) => {
  if (!value) return "--:--:--";
  const diff = Math.max(0, new Date(value).getTime() - Date.now());
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

export default function Match() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: match, isLoading, isError } = useMatch(String(id ?? ""));
  const [clock, setClock] = useState(() => countdown(match?.effectiveStartsAt ?? match?.startsAt ?? null));

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(countdown(match?.effectiveStartsAt ?? match?.startsAt ?? null));
    }, 1000);
    return () => clearInterval(timer);
  }, [match?.effectiveStartsAt, match?.startsAt]);

  if (isLoading) {
    return <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  if (isError || !match) {
    return <View style={s.page}><Text style={s.title}>Match unavailable</Text><Text style={s.muted}>The match could not be loaded.</Text></View>;
  }

  const start = match.effectiveStartsAt ?? match.startsAt;

  return (
    <View style={s.page}>
      <Text style={s.kicker}>{match.sport.toUpperCase()} · MATCH</Text>
      <Text style={s.title}>{match.title}</Text>
      <Text style={s.meta}>ID: {match.id}</Text>

      <View style={s.card}>
        <Text style={[s.status, match.status === "live" && s.live]}>{match.status.toUpperCase()}</Text>
        <View style={s.teams}>
          <Text style={s.team}>{match.homeTeam}</Text>
          <Text style={s.vs}>VS</Text>
          <Text style={s.team}>{match.awayTeam}</Text>
        </View>

        {match.status === "upcoming" ? (
          <>
            <Text style={s.label}>STARTS IN</Text>
            <Text style={s.count}>{clock}</Text>
          </>
        ) : (
          <Text style={s.muted}>{match.status === "live" ? "Live scoring is active." : "This match is no longer open."}</Text>
        )}

        {match.toss && <Text style={s.muted}>Toss: {match.toss}</Text>}
        {match.lineupAnnounced && <Text style={s.lineup}>Playing XI announced</Text>}
        {match.deadlineAt && <Text style={s.muted}>Deadline: {new Date(match.deadlineAt).toLocaleString()}</Text>}
        {!start && <Text style={s.muted}>Start time unavailable</Text>}
      </View>

      <Link href={{ pathname: "/contest/[matchId]", params: { matchId: match.id } }} style={s.button}>View Contests</Link>
      <Link href={{ pathname: "/team/[matchId]", params: { matchId: match.id } }} style={s.secondary}>Create Team</Link>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg, padding: 20, paddingTop: 30 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5, color: theme.colors.primary },
  title: { fontSize: 30, fontWeight: "900", color: theme.colors.text, marginTop: 6 },
  meta: { fontSize: 12, color: theme.colors.muted, marginTop: 6 },
  card: { backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 18, marginTop: 20 },
  status: { fontSize: 11, fontWeight: "900", color: theme.colors.primary },
  live: { color: theme.colors.live },
  teams: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  team: { flex: 1, fontSize: 17, fontWeight: "800", color: theme.colors.text },
  vs: { marginHorizontal: 10, fontSize: 11, fontWeight: "900", color: theme.colors.muted },
  label: { marginTop: 22, fontSize: 10, fontWeight: "900", color: theme.colors.muted, letterSpacing: 1.2 },
  count: { fontSize: 30, fontWeight: "900", color: theme.colors.text, marginTop: 5 },
  muted: { marginTop: 8, color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  lineup: { marginTop: 10, color: theme.colors.success, fontWeight: "800" },
  button: { marginTop: 16, backgroundColor: theme.colors.primary, color: "#fff", padding: 16, borderRadius: 14, textAlign: "center", fontWeight: "900" },
  secondary: { marginTop: 10, backgroundColor: "#fff", color: theme.colors.text, padding: 16, borderRadius: 14, textAlign: "center", fontWeight: "900", borderWidth: 1, borderColor: theme.colors.border },
});