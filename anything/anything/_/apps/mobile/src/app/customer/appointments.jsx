import { Page, Panel, Text } from "@/components/ds.jsx";

export default function CustomerAppointments() {
  return (
    <Page
      title="Appointments"
      subtitle="Coming next: show upcoming jobs and allow reschedule."
    >
      <Panel>
        <Text tone="primary" style={{ fontWeight: "900" }}>
          No appointments yet
        </Text>
        <Text tone="tertiary" style={{ marginTop: 6 }}>
          Once sign-in is enabled, we’ll show the customer’s scheduled jobs.
        </Text>
      </Panel>
    </Page>
  );
}
