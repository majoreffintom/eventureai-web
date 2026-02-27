import { Page, Panel, Text } from "@/components/ds.jsx";

export default function ScheduleScreen() {
  return (
    <Page
      title="Schedule"
      subtitle="Next step: schedule blocks + job assignments UI."
    >
      <Panel>
        <Text tone="primary" style={{ fontWeight: "800" }}>
          Coming up
        </Text>
        <Text tone="tertiary" style={{ marginTop: 6 }}>
          We’ll add a simple day view first, then a dispatch view. The database
          already supports schedule_blocks + job_assignments.
        </Text>
      </Panel>
    </Page>
  );
}
