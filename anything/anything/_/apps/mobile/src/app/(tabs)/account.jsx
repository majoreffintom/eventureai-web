import { View } from "react-native";
import { Page, Panel, Text, Button } from "@/components/ds.jsx";
import { useAuth } from "@/utils/auth/useAuth";

export default function AccountScreen() {
  const { isReady, isAuthenticated, auth, signIn, signUp, signOut } = useAuth();

  const email = auth?.user?.email || null;
  const name = auth?.user?.name || null;
  const role = auth?.user?.role || null;

  const isSignedIn = Boolean(isReady && isAuthenticated);

  return (
    <Page title="My Account" subtitle="Sign in to manage your info." scroll>
      {!isSignedIn ? (
        <Panel title="Sign in" subtitle="Create an account or sign in.">
          <View style={{ gap: 12 }}>
            <Text tone="secondary">
              Signing in opens a secure web sign-in page.
            </Text>
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
        </Panel>
      ) : (
        <>
          <Panel title="You’re signed in">
            <View style={{ gap: 8 }}>
              <Text tone="secondary">{name ? `Name: ${name}` : "Name: —"}</Text>
              <Text tone="secondary">
                {email ? `Email: ${email}` : "Email: —"}
              </Text>
              <Text tone="tertiary" size="sm">
                Role: {role || "unknown"}
              </Text>
            </View>
          </Panel>

          <View style={{ marginTop: 12 }}>
            <Button variant="secondary" onPress={signOut}>
              Sign out
            </Button>
          </View>
        </>
      )}

      <View style={{ marginTop: 12 }}>
        <Panel title="Next" subtitle="Coming soon">
          <Text tone="tertiary">
            We’ll add appointments, invoices, and saved addresses here.
          </Text>
        </Panel>
      </View>
    </Page>
  );
}
