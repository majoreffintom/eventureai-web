import { Page, Panel, Text } from "@/components/ds.jsx";

export default function CustomerProfile() {
  return (
    <Page
      title="Profile"
      subtitle="Coming next: saved address, preferred contact method, and service history."
    >
      <Panel>
        <Text tone="primary" style={{ fontWeight: "900" }}>
          Not signed in
        </Text>
        <Text tone="tertiary" style={{ marginTop: 6 }}>
          Since User Accounts aren’t enabled yet, this is a placeholder. When
          you turn it on, we’ll connect it.
        </Text>
      </Panel>
    </Page>
  );
}
