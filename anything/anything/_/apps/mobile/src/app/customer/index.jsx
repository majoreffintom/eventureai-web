import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Page, Panel, Text } from "@/components/ds.jsx";

export default function CustomerHome() {
  const router = useRouter();

  return (
    <Page
      title="Customer"
      subtitle="This is the customer bottom-tab shell. Once we enable sign-in, this will show only the customer’s jobs and invoices."
    >
      <Panel>
        <Text tone="primary" style={{ fontWeight: "900" }}>
          Next step
        </Text>
        <Text tone="tertiary" style={{ marginTop: 6 }}>
          Turn on User Accounts (email sign-in), then we’ll tie the portal to
          the database.
        </Text>

        <View style={{ marginTop: 12 }}>
          <Button onPress={() => router.push("/(tabs)/home")}>
            Back to office
          </Button>
        </View>
      </Panel>
    </Page>
  );
}
