import { Panel } from "@/components/ds.jsx";
import { EmptyState } from "./EmptyState";

export function PlaceholderTab({ title, subtitle }) {
  return (
    <Panel title={title} subtitle={subtitle}>
      <EmptyState
        title="Coming soon"
        body="We'll build this section step-by-step and test it as we go."
      />
    </Panel>
  );
}
