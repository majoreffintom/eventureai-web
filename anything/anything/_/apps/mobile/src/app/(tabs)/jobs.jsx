import { useMemo, useState } from "react";
import { View, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Page, Panel, Text } from "@/components/ds.jsx";
import { useTheme } from "@/utils/theme";

export default function JobsScreen() {
  const queryClient = useQueryClient();
  const { tokens } = useTheme();

  const [customerId, setCustomerId] = useState("");
  const [jobType, setJobType] = useState("repair");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) {
        throw new Error("Failed to fetch customers");
      }
      return res.json();
    },
  });

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return res.json();
    },
  });

  const customers = customersData?.customers ?? [];
  const jobs = jobsData?.jobs ?? [];

  const customerOptions = useMemo(() => customers, [customers]);

  const createJob = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          job_type: jobType,
          priority,
          description: description ? description : null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to create job");
      }
      return res.json();
    },
    onSuccess: () => {
      setCustomerId("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e) => {
      console.error(e);
      setError("Could not create job");
      Alert.alert("Error", "Could not create job");
    },
  });

  return (
    <Page title="Jobs" subtitle="Create and track jobs.">
      <Panel title="New job">
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: tokens.border.default,
            overflow: "hidden",
            backgroundColor: tokens.surface.primary,
          }}
        >
          <ScrollView horizontal style={{ flexGrow: 0 }}>
            {customerOptions.map((c) => {
              const active = customerId === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCustomerId(c.id)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: active
                      ? tokens.text.primary
                      : pressed
                        ? tokens.bg.tertiary
                        : tokens.surface.primary,
                  })}
                >
                  <Text
                    tone={active ? "inverse" : "primary"}
                    style={{ fontWeight: "700" }}
                  >
                    {c.name}
                  </Text>
                  <Text
                    tone={active ? "inverse" : "tertiary"}
                    size="xs"
                    style={{ marginTop: 2, opacity: active ? 0.85 : 1 }}
                  >
                    {c.phone}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setJobType("repair")}
            style={({ pressed }) => ({
              flex: 1,
              height: 40,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border.default,
              backgroundColor:
                jobType === "repair"
                  ? tokens.text.primary
                  : tokens.surface.primary,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text
              tone={jobType === "repair" ? "inverse" : "primary"}
              style={{ fontWeight: "800" }}
            >
              Repair
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setJobType("maintenance")}
            style={({ pressed }) => ({
              flex: 1,
              height: 40,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border.default,
              backgroundColor:
                jobType === "maintenance"
                  ? tokens.text.primary
                  : tokens.surface.primary,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text
              tone={jobType === "maintenance" ? "inverse" : "primary"}
              style={{ fontWeight: "800" }}
            >
              Maint.
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { id: "low", label: "Low" },
            { id: "normal", label: "Normal" },
            { id: "high", label: "High" },
            { id: "emergency", label: "E" },
          ].map((p) => {
            const active = priority === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPriority(p.id)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 40,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: tokens.border.default,
                  backgroundColor: active
                    ? tokens.text.primary
                    : tokens.surface.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text
                  tone={active ? "inverse" : "primary"}
                  style={{ fontWeight: "800" }}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
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

        {error ? (
          <Text tone="danger" size="sm">
            {error}
          </Text>
        ) : null}

        <Button
          onPress={() => createJob.mutate()}
          disabled={createJob.isPending || !customerId}
        >
          Add job
        </Button>
      </Panel>

      <View style={{ marginTop: 16, gap: 10 }}>
        {isLoading ? (
          <Text tone="tertiary">Loading…</Text>
        ) : jobs.length === 0 ? (
          <Panel>
            <Text tone="primary" style={{ fontWeight: "800" }}>
              No jobs yet
            </Text>
            <Text tone="tertiary" style={{ marginTop: 6 }}>
              Create your first job above.
            </Text>
          </Panel>
        ) : (
          jobs.map((j) => (
            <Panel key={j.id}>
              <Text tone="primary" style={{ fontWeight: "900" }}>
                Job #{j.job_number} • {j.job_type}
              </Text>
              <Text tone="tertiary" style={{ marginTop: 4 }}>
                {j.customer_name} • {j.customer_phone}
              </Text>
              {j.description ? (
                <Text tone="tertiary" style={{ marginTop: 4 }}>
                  {j.description}
                </Text>
              ) : null}
              <Text
                tone="primary"
                size="sm"
                style={{ marginTop: 8, fontWeight: "800" }}
              >
                {j.status} • {j.priority}
              </Text>
            </Panel>
          ))
        )}
      </View>
    </Page>
  );
}
