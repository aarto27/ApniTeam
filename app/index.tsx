import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";

export default function Entry() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return <Redirect href={hasSession ? "/(tabs)" : "/auth/login"} />;
}
