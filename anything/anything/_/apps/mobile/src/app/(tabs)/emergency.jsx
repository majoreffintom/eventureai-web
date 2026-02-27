import { View } from "react-native";
import * as Linking from "expo-linking";
import { Page, Text, Button, Heading } from "@/components/ds.jsx";
import { useTheme } from "@/utils/theme";

const COMPANY = {
  phoneDisplay: "502-262-0913",
  phoneHref: "tel:5022620913",
};

export default function EmergencyScreen() {
  const { tokens } = useTheme();

  const callNow = () => {
    Linking.openURL(COMPANY.phoneHref);
  };

  return (
    <Page>
      <View style={{ marginTop: 2 }}>
        <Heading level={1}>Emergency Service</Heading>
        <Text tone="secondary" style={{ marginTop: 8 }}>
          If your heat or AC is down and it can’t wait, call us. We’ll do our
          best to help as fast as we can.
        </Text>
      </View>

      <View
        style={{
          marginTop: 14,
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: tokens.border.default,
          backgroundColor: tokens.surface.primary,
          padding: 16,
        }}
      >
        <Heading level={2}>Call now</Heading>
        <Text tone="secondary" style={{ marginTop: 8 }}>
          For the fastest help, calling is best.
        </Text>

        <View style={{ marginTop: 14 }}>
          <Button onPress={callNow}>Call {COMPANY.phoneDisplay}</Button>
        </View>

        <Text tone="tertiary" size="sm" style={{ marginTop: 12 }}>
          If you’re safe to do so, have your address ready when you call.
        </Text>
      </View>

      <View
        style={{
          marginTop: 14,
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: tokens.border.default,
          backgroundColor: tokens.surface.primary,
          padding: 16,
        }}
      >
        <Heading level={2}>Common urgent issues</Heading>
        <View style={{ marginTop: 10, gap: 10 }}>
          <Text tone="secondary">• No heat / furnace won’t run</Text>
          <Text tone="secondary">• AC not cooling or won’t turn on</Text>
          <Text tone="secondary">• Strange burning smell</Text>
          <Text tone="secondary">
            • Frozen lines or leaking water near the unit
          </Text>
        </View>
      </View>
    </Page>
  );
}
