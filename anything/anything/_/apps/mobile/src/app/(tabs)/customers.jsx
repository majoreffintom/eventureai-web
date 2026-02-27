import { useState } from "react";
import { View, TextInput, Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Page, Panel, Text } from "@/components/ds.jsx";
import { useTheme } from "@/utils/theme";

export default function CustomersScreen() {
  const queryClient = useQueryClient();
  const { tokens } = useTheme();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) {
        throw new Error("Failed to fetch customers");
      }
      return res.json();
    },
  });

  const customers = data?.customers ?? [];

  const createCustomer = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: email ? email : null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to create customer");
      }
      return res.json();
    },
    onSuccess: () => {
      setName("");
      setPhone("");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e) => {
      console.error(e);
      setError("Could not create customer");
      Alert.alert("Error", "Could not create customer");
    },
  });

  return (
    <Page
      title="Customers"
      subtitle="Add customers and keep contact details clean."
    >
      <Panel>
        <View style={{ gap: 10 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={tokens.text.tertiary}
            style={{
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border.default,
              paddingHorizontal: 12,
              backgroundColor: tokens.surface.primary,
              color: tokens.text.primary,
            }}
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            placeholderTextColor={tokens.text.tertiary}
            style={{
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border.default,
              paddingHorizontal: 12,
              backgroundColor: tokens.surface.primary,
              color: tokens.text.primary,
            }}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email (optional)"
            placeholderTextColor={tokens.text.tertiary}
            autoCapitalize="none"
            style={{
              height: 44,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border.default,
              paddingHorizontal: 12,
              backgroundColor: tokens.surface.primary,
              color: tokens.text.primary,
            }}
          />

          {error ? (
            <Text tone="danger" size="sm">
              {error}
            </Text>
          ) : null}

          <Button
            onPress={() => createCustomer.mutate()}
            disabled={createCustomer.isPending || !name || !phone}
          >
            Add
          </Button>
        </View>
      </Panel>

      <View style={{ marginTop: 16, gap: 10 }}>
        {isLoading ? (
          <Text tone="tertiary">Loading…</Text>
        ) : customers.length === 0 ? (
          <Panel>
            <Text tone="primary" style={{ fontWeight: "800" }}>
              No customers yet
            </Text>
            <Text tone="tertiary" style={{ marginTop: 6 }}>
              Add your first customer above.
            </Text>
          </Panel>
        ) : (
          customers.map((c) => (
            <Panel key={c.id}>
              <Text tone="primary" style={{ fontWeight: "900" }}>
                {c.name}
              </Text>
              <Text tone="tertiary" style={{ marginTop: 4 }}>
                {c.phone}
              </Text>
              {c.email ? (
                <Text tone="tertiary" style={{ marginTop: 2 }}>
                  {c.email}
                </Text>
              ) : null}
            </Panel>
          ))
        )}
      </View>
    </Page>
  );
}
