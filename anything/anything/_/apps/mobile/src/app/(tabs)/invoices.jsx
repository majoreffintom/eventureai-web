import { useMemo, useState } from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Page, Panel, Text, Input } from "@/components/ds.jsx";

export default function InvoicesScreen() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await fetch("/api/invoices");
      if (!response.ok) {
        throw new Error(
          `When fetching /api/invoices, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
  });

  const invoices = data?.invoices ?? [];

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return invoices;

    return invoices.filter((inv) => {
      const hay =
        `${inv.invoice_number} ${inv.customer_name} ${inv.job_number}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [invoices, search]);

  const subtitle = "Track invoices, payments, and balances.";

  return (
    <Page title="Invoices" subtitle={subtitle}>
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search invoices..."
        style={{ marginBottom: 16 }}
      />

      {error ? (
        <Panel>
          <Text tone="danger">Could not load invoices.</Text>
        </Panel>
      ) : null}

      {isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" />
          <Text tone="tertiary" size="sm" style={{ marginTop: 12 }}>
            Loading invoices...
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <Panel
          title={search ? "No matches" : "No invoices yet"}
          subtitle={
            search
              ? "Try a different search term."
              : "Invoices will appear here once created."
          }
        />
      ) : (
        <View style={{ gap: 12 }}>
          {filtered.map((inv) => {
            const total = Number(inv.total ?? 0);
            const totalDisplay = total.toFixed(2);

            const statusColor =
              inv.payment_status === "paid"
                ? "#10B981"
                : inv.payment_status === "partial"
                  ? "#F59E0B"
                  : "#6B7280";

            return (
              <Pressable
                key={inv.id}
                style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
              >
                <Panel>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text tone="primary" style={{ fontWeight: "800" }}>
                        Invoice #{inv.invoice_number}
                      </Text>
                      <Text tone="secondary" size="sm" style={{ marginTop: 4 }}>
                        {inv.customer_name}
                      </Text>
                      <Text tone="tertiary" size="sm" style={{ marginTop: 2 }}>
                        Job #{inv.job_number}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text tone="primary" style={{ fontWeight: "800" }}>
                        ${totalDisplay}
                      </Text>
                      <View
                        style={{
                          marginTop: 6,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: statusColor + "20",
                        }}
                      >
                        <Text
                          size="xs"
                          style={{
                            color: statusColor,
                            fontWeight: "800",
                            textTransform: "capitalize",
                          }}
                        >
                          {inv.payment_status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Panel>
              </Pressable>
            );
          })}
        </View>
      )}
    </Page>
  );
}
