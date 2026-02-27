import { View } from "react-native";
import { Page, Panel, Text } from "@/components/ds.jsx";

export default function MapScreen() {
  return (
    <Page title="Map" subtitle="Placeholder" scroll>
      <Panel title="Map" subtitle="We’ll add truck/tech map views here.">
        <View style={{ gap: 8 }}>
          <Text tone="secondary">• Live truck locations</Text>
          <Text tone="secondary">• Job pins</Text>
          <Text tone="secondary">• Route overview</Text>
        </View>
      </Panel>
    </Page>
  );
}
