import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown:false, tabBarActiveTintColor:theme.colors.primary, tabBarInactiveTintColor:theme.colors.muted, tabBarStyle:{height:64,paddingBottom:8,paddingTop:6,borderTopColor:theme.colors.border} }}>
      <Tabs.Screen name="index" options={{ title:"Home", tabBarIcon:({color,size})=><Ionicons name="home-outline" color={color} size={size}/> }} />
      <Tabs.Screen name="my-matches" options={{ title:"My Matches", tabBarIcon:({color,size})=><Ionicons name="trophy-outline" color={color} size={size}/> }} />
      <Tabs.Screen name="wallet" options={{ title:"Wallet", tabBarIcon:({color,size})=><Ionicons name="wallet-outline" color={color} size={size}/> }} />
      <Tabs.Screen name="more" options={{ title:"More", tabBarIcon:({color,size})=><Ionicons name="menu-outline" color={color} size={size}/> }} />
    </Tabs>
  );
}
