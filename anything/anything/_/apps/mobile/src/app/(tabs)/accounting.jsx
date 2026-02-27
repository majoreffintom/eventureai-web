import { View } from "react-native";
import { Page, Panel, Text } from "@/components/ds.jsx";

export default function AccountingScreen() {
  return (
    <Page title="Accounting" subtitle="Placeholder" scroll>
      <Panel title="Accounting" subtitle="We’ll wire this up next.">
        <View style={{ gap: 8 }}>
          <Text tone="secondary">• Invoices</Text>
          <Text tone="secondary">• Payments</Text>
          <Text tone="secondary">• Reports</Text>
        </View>
      </Panel>
    </Page>
  );
}
