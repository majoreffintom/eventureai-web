import { Page, Panel, Text } from "@/components/ds.jsx";

export default function CustomerInvoices() {
  return (
    <Page title="Invoices" subtitle="Coming next: show invoices + pay by card.">
      <Panel>
        <Text tone="primary" style={{ fontWeight: "900" }}>
          No invoices yet
        </Text>
        <Text tone="tertiary" style={{ marginTop: 6 }}>
          Once sign-in is enabled, we’ll show the customer’s invoices.
        </Text>
      </Panel>
    </Page>
  );
}
