import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerPushToken } from "../../services/notifications";

export function usePushRegistration() {
  useEffect(() => {
    let cancelled = false;

    async function register() {
      const permission = await Notifications.getPermissionsAsync();
      let finalStatus = permission.status;
      if (finalStatus !== "granted") {
        const requested = await Notifications.requestPermissionsAsync();
        finalStatus = requested.status;
      }
      if (finalStatus !== "granted" || cancelled) return;

      const token = await Notifications.getExpoPushTokenAsync();
      if (cancelled) return;
      await registerPushToken(token.data, Platform.OS);
    }

    void register().catch(() => {
      // Notification permission/token registration is non-blocking for app startup.
    });

    return () => { cancelled = true; };
  }, []);
}
