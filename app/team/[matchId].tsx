import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMatch } from "../../features/matches/useMatches";
import { useMatchPlayers, useSaveTeam } from "../../features/teams/useTeamBuilder";
import { useMyTeams } from "../../features/teams/useMyTeams";
import { roleLabel, setCaptain, setViceCaptain, togglePlayer, validateDraft, type BuilderPlayer, type TeamDraft } from "../../features/teams/teamBuilder";
import { theme } from "../../lib/theme";
import { isJoinable } from "../../domain/matchTiming";

const initialDraft: TeamDraft = { players: [], captainId: null, viceCaptainId: null };

export default function TeamBuilder() {
  const { matchId, teamId } = useLocalSearchParams<{ matchId: string; teamId?: string }>();
  const id = String(matchId ?? "");
  const editTeamId = teamId ? String(teamId) : undefined;
  const { data: match } = useMatch(id);
  const { data: players = [], isLoading } = useMatchPlayers(id);
  const { data: myTeams = [] } = useMyTeams(id);
  const saveTeam = useSaveTeam();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!editTeamId || !players.length || !myTeams.length) return;
    const existing = myTeams.find((team) => team.id === editTeamId);
    if (!existing) return;
    setTeamName(existing.name);
    setDraft({
      players: players.filter((player) => existing.players.includes(player.id)),
      captainId: existing.captainId ?? null,
      viceCaptainId: existing.viceCaptainId ?? null,
    });
  }, [editTeamId, myTeams, players]);
  const [draft, setDraft] = useState<TeamDraft>(initialDraft);
  const [teamName, setTeamName] = useState("My Team");

  const validation = useMemo(() => validateDraft(draft, match?.sport === "football" ? "football" : "cricket"), [draft, match?.sport]);
  const joinable = Boolean(match && isJoinable({
    scheduledStart: match.startsAt,
    effectiveStart: match.effectiveStartsAt,
    deadlineAt: match.deadlineAt ?? null,
  }, now));

  const handleSave = async () => {
    if (!validation.valid) return;
    if (!joinable) return;
    await saveTeam.mutateAsync({ matchId: id, teamId: editTeamId, teamName, draft });
    router.back();
  };

  const toggle = (player: BuilderPlayer) => setDraft((current) => togglePlayer(current, player));

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>;

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{editTeamId ? "EDIT TEAM" : "CREATE TEAM"}</Text>
          <Text style={styles.title}>{match?.title ?? "Match"}</Text>
        </View>
        <Text style={styles.counter}>{draft.players.length}/11</Text>
      </View>

      <TextInput value={teamName} onChangeText={setTeamName} placeholder="Team name" placeholderTextColor={theme.colors.muted} style={styles.input} />

      <View style={styles.summary}>
        <Text style={styles.summaryText}>C: {draft.captainId ? "Selected" : "Pending"}</Text>
        <Text style={styles.summaryText}>VC: {draft.viceCaptainId ? "Selected" : "Pending"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {players.map((player) => {
          const selected = draft.players.some((item) => item.id === player.id);
          const captain = draft.captainId === player.id;
          const vice = draft.viceCaptainId === player.id;

          return (
            <Pressable key={player.id} onPress={() => toggle(player)} style={[styles.player, selected && styles.selected]}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerMeta}>{roleLabel(player.role)}{player.teamName ? " · " + player.teamName : ""}</Text>
              </View>
              {selected && (
                <View style={styles.roleActions}>
                  <Pressable onPress={() => setDraft((d) => setCaptain(d, player.id))} style={[styles.badge, captain && styles.activeBadge]}>
                    <Text style={[styles.badgeText, captain && styles.activeBadgeText]}>C</Text>
                  </Pressable>
                  <Pressable onPress={() => setDraft((d) => setViceCaptain(d, player.id))} style={[styles.badge, vice && styles.activeBadge]}>
                    <Text style={[styles.badgeText, vice && styles.activeBadgeText]}>VC</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {validation.errors.length > 0 && <Text style={styles.error}>{validation.errors[0]}</Text>}
      {!joinable && <Text style={styles.error}>Team changes are closed for this match.</Text>}

      <Pressable disabled={!validation.valid || !joinable || saveTeam.isPending} onPress={handleSave} style={[styles.button, (!validation.valid || !joinable || saveTeam.isPending) && styles.disabled]}>
        <Text style={styles.buttonText}>{saveTeam.isPending ? "Saving..." : "Save Team"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.colors.bg, padding: 16, paddingTop: 22 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { fontSize: 10, fontWeight: "900", color: theme.colors.primary, letterSpacing: 1.2 },
  title: { fontSize: 22, fontWeight: "900", color: theme.colors.text, marginTop: 4 },
  counter: { fontSize: 18, fontWeight: "900", color: theme.colors.primary },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 13, marginTop: 14, color: theme.colors.text },
  summary: { flexDirection: "row", gap: 10, marginTop: 10 },
  summaryText: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
  list: { paddingTop: 12, paddingBottom: 90 },
  player: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 13, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  selected: { borderColor: theme.colors.primary },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: "800", color: theme.colors.text },
  playerMeta: { fontSize: 11, color: theme.colors.muted, marginTop: 3 },
  roleActions: { flexDirection: "row", gap: 6 },
  badge: { width: 34, height: 30, borderRadius: 9, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  activeBadge: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  badgeText: { fontSize: 10, fontWeight: "900", color: theme.colors.muted },
  activeBadgeText: { color: "#fff" },
  error: { position: "absolute", bottom: 72, left: 16, right: 16, color: theme.colors.primary, fontSize: 12, fontWeight: "700" },
  button: { position: "absolute", bottom: 16, left: 16, right: 16, backgroundColor: theme.colors.primary, borderRadius: 14, padding: 16, alignItems: "center" },
  disabled: { opacity: 0.45 },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
});