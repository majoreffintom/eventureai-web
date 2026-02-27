import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Page, Panel, Text, ThemeToggle, Button } from "@/components/ds.jsx";
import { useAuth } from "@/utils/auth/useAuth";

export default function SettingsScreen() {
  const router = useRouter();
  const { isReady, isAuthenticated, auth, signIn, signUp, signOut } = useAuth();

  const email = auth?.user?.email || null;
  const role = auth?.user?.role || null;

  return (
    <Page
      title="Settings"
      subtitle="Quick links."
      headerRight={<ThemeToggle />}
    >
      <View style={{ gap: 10 }}>
        <Panel>
          <Text tone="primary" style={{ fontWeight: "900" }}>
            Account
          </Text>
          {isReady && isAuthenticated ? (
            <View style={{ marginTop: 8, gap: 10 }}>
              <Text tone="secondary">Signed in as {email || "(no email)"}</Text>
              <Text tone="tertiary" size="sm">
                Role: {role || "unknown"}
              </Text>
              <Button variant="secondary" onPress={signOut}>
                Sign out
              </Button>
            </View>
          ) : (
            <View style={{ marginTop: 8, gap: 10 }}>
              <Text tone="secondary">You’re not signed in.</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button onPress={signIn}>Sign in</Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button variant="secondary" onPress={signUp}>
                    Create account
                  </Button>
                </View>
              </View>
            </View>
          )}
        </Panel>

        <Pressable onPress={() => router.push("/theme")}>
          {({ pressed }) => (
            <View style={{ opacity: pressed ? 0.92 : 1 }}>
              <Panel title="Appearance" subtitle="System / Light / Dark." />
            </View>
          )}
        </Pressable>

        <Panel>
          <Text tone="primary" style={{ fontWeight: "800" }}>
            Theme
          </Text>
          <Text tone="tertiary" style={{ marginTop: 6 }}>
            Use Appearance to choose System / Light / Dark. The top-right button
            is a quick toggle.
          </Text>
        </Panel>
      </View>
    </Page>
  );
}
