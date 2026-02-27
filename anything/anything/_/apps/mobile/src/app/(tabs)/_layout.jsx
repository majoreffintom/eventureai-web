import { Tabs } from "expo-router";
import {
  Home,
  CalendarDays,
  AlertTriangle,
  User,
  FileText,
  MapPin,
  Settings,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useMemo } from "react";
import { useTheme } from "@/utils/theme";
import { useAuth } from "@/utils/auth/useAuth";

export default function TabLayout() {
  const { tokens } = useTheme();
  const { auth } = useAuth();

  const role = auth?.user?.role || null;
  const isAdmin = role === "admin" || role === "owner";

  // Force remount when role changes so the tab list updates cleanly.
  const tabsKey = useMemo(
    () => (isAdmin ? "admin-tabs" : "customer-tabs"),
    [isAdmin],
  );

  // expo-router will auto-add sibling routes unless we explicitly declare them.
  // So we declare EVERYTHING in this folder and hide the ones that don't apply.
  const homeOptions = useMemo(() => {
    if (isAdmin) {
      return { href: null };
    }
    return {
      title: "Home",
      tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
    };
  }, [isAdmin]);

  const emergencyOptions = useMemo(() => {
    if (isAdmin) {
      return { href: null };
    }
    return {
      title: "Emergency",
      tabBarIcon: ({ color, size }) => (
        <AlertTriangle color={color} size={size} />
      ),
    };
  }, [isAdmin]);

  const scheduleOptions = useMemo(() => {
    return {
      title: "Schedule",
      tabBarIcon: ({ color, size }) => (
        <CalendarDays color={color} size={size} />
      ),
    };
  }, []);

  const accountOptions = useMemo(() => {
    if (isAdmin) {
      return { href: null };
    }
    return {
      title: "My Account",
      tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
    };
  }, [isAdmin]);

  const accountingOptions = useMemo(() => {
    if (!isAdmin) {
      return { href: null };
    }
    return {
      title: "Accounting",
      tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
    };
  }, [isAdmin]);

  const mapOptions = useMemo(() => {
    if (!isAdmin) {
      return { href: null };
    }
    return {
      title: "Map",
      tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
    };
  }, [isAdmin]);

  const settingsOptions = useMemo(() => {
    if (!isAdmin) {
      return { href: null };
    }
    return {
      title: "Settings",
      tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
    };
  }, [isAdmin]);

  const hiddenOptions = useMemo(() => ({ href: null }), []);

  return (
    <Tabs
      key={tabsKey}
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
      {/* Customer tabs */}
      <Tabs.Screen name="home" options={homeOptions} />
      <Tabs.Screen name="emergency" options={emergencyOptions} />
      <Tabs.Screen name="schedule" options={scheduleOptions} />
      <Tabs.Screen name="account" options={accountOptions} />

      {/* Admin tabs */}
      <Tabs.Screen name="accounting" options={accountingOptions} />
      <Tabs.Screen name="map" options={mapOptions} />
      <Tabs.Screen name="settings" options={settingsOptions} />

      {/* Hidden legacy/placeholder routes that exist in this folder */}
      <Tabs.Screen name="customers" options={hiddenOptions} />
      <Tabs.Screen name="jobs" options={hiddenOptions} />
      <Tabs.Screen name="invoices" options={hiddenOptions} />
      <Tabs.Screen name="time" options={hiddenOptions} />
    </Tabs>
  );
}
