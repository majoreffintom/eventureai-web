import { Tabs } from "expo-router";
import { Home, CalendarDays, FileText, User } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/utils/theme";

export default function CustomerTabLayout() {
  const { tokens } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: tokens.border.default,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarBackground: () => (
          <BlurView
            tint={tokens.glass.tint}
            intensity={tokens.glass.intensity}
            style={{ flex: 1 }}
          />
        ),
        tabBarActiveTintColor: tokens.brand.primary,
        tabBarInactiveTintColor: tokens.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appts",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color, size }) => (
            <FileText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
