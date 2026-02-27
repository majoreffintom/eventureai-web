import { View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import {
  Button,
  Page,
  Panel,
  Text,
  ThemeModeSelect,
} from "@/components/ds.jsx";

export default function ThemeScreen() {
  const router = useRouter();

  return (
    <Page
      title="Appearance"
      subtitle="Choose System, Light, or Dark."
      headerLeft={
        <Button
          icon={ArrowLeft}
          iconOnly
          variant="secondary"
          onPress={() => router.back()}
        />
      }
    >
      <View style={{ gap: 12 }}>
        <Panel>
          <ThemeModeSelect />
          <Text tone="tertiary" size="sm" style={{ marginTop: 10 }}>
            System follows your device setting. Light and Dark force the app
            into that mode.
          </Text>
        </Panel>

        <Panel>
          <Text tone="primary" style={{ fontWeight: "900" }}>
            Liquid glass
          </Text>
          <Text tone="tertiary" size="sm" style={{ marginTop: 8 }}>
            We use glass on navigation surfaces (like tab bars) so content stays
            readable.
          </Text>
        </Panel>
      </View>
    </Page>
  );
}
