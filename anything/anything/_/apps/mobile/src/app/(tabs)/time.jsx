import { useCallback, useMemo, useState } from "react";
import { View, Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Page, Panel, Text, Button } from "@/components/ds.jsx";
import { useTheme } from "@/utils/theme";
import { useAuth } from "@/utils/auth/useAuth";

function formatTime(value) {
  if (!value) {
    return null;
  }
  try {
    const d = new Date(value);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return String(value);
  }
}

export default function TimeScreen() {
  const { tokens } = useTheme();
  const queryClient = useQueryClient();
  const { isReady, isAuthenticated, signIn, signUp } = useAuth();

  const [error, setError] = useState(null);

  const statusQuery = useQuery({
    queryKey: ["timeclock", "today"],
    queryFn: async () => {
      const res = await fetch("/api/timeclock-today");
      if (res.status === 401) {
        return { isAuthenticated: false };
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const serverError = body?.error;
        throw new Error(
          serverError ||
            `When fetching /api/timeclock-today, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return body;
    },
    enabled: Boolean(isReady),
    refetchInterval: 20_000,
  });

  const isSignedIn = Boolean(isReady && isAuthenticated);
  const apiSaysAuthed = statusQuery.data?.isAuthenticated !== false;

  const entry = statusQuery.data?.entry || null;
  const isClockedIn = Boolean(statusQuery.data?.isClockedIn);

  const clockInMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await fetch("/api/timeclock-clock-in", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const serverError = body?.error;
        throw new Error(
          serverError ||
            `When fetching /api/timeclock-clock-in, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return body;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["timeclock", "today"] });
      if (data?.alreadyClockedIn) {
        Alert.alert("Timeclock", "You’re already clocked in.");
        return;
      }
      Alert.alert("Timeclock", "Clocked in.");
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not clock in");
      Alert.alert("Error", e?.message || "Could not clock in");
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await fetch("/api/timeclock-clock-out", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const serverError = body?.error;
        throw new Error(
          serverError ||
            `When fetching /api/timeclock-clock-out, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeclock", "today"] });
      Alert.alert("Timeclock", "Clocked out.");
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "Could not clock out");
      Alert.alert("Error", e?.message || "Could not clock out");
    },
  });

  const clockInTime = useMemo(() => formatTime(entry?.clock_in), [entry]);
  const clockOutTime = useMemo(() => formatTime(entry?.clock_out), [entry]);

  const refresh = useCallback(() => {
    statusQuery.refetch();
  }, [statusQuery]);

  const headerSubtitle = "Per-day time clock. GPS handled by Bouncie.";

  return (
    <Page title="Timeclock" subtitle={headerSubtitle}>
      {!isSignedIn || !apiSaysAuthed ? (
        <Panel
          title="Sign in required"
          subtitle="Tech timeclock needs an account."
        >
          <Text tone="secondary">
            Sign in (or create an account) so we can attach your hours to the
            right tech.
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <Button onPress={signIn}>Sign in</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" onPress={signUp}>
                Create account
              </Button>
            </View>
          </View>
        </Panel>
      ) : (
        <>
          <Panel
            title="Today"
            subtitle={
              isClockedIn
                ? "You’re clocked in."
                : entry
                  ? "You’re clocked out."
                  : "No time entry yet."
            }
          >
            <View style={{ gap: 10 }}>
              <View
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: tokens.border.default,
                  backgroundColor: tokens.surface.primary,
                  padding: 12,
                }}
              >
                <Text tone="tertiary" size="xs" style={{ fontWeight: "800" }}>
                  CLOCK IN
                </Text>
                <Text
                  tone="primary"
                  style={{ marginTop: 4, fontWeight: "900" }}
                >
                  {clockInTime || "—"}
                </Text>
              </View>

              <View
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: tokens.border.default,
                  backgroundColor: tokens.surface.primary,
                  padding: 12,
                }}
              >
                <Text tone="tertiary" size="xs" style={{ fontWeight: "800" }}>
                  CLOCK OUT
                </Text>
                <Text
                  tone="primary"
                  style={{ marginTop: 4, fontWeight: "900" }}
                >
                  {clockOutTime || "—"}
                </Text>
              </View>

              {error ? (
                <Text tone="danger" size="sm">
                  {error}
                </Text>
              ) : null}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    onPress={() => clockInMutation.mutate()}
                    disabled={
                      statusQuery.isLoading ||
                      clockInMutation.isPending ||
                      clockOutMutation.isPending ||
                      isClockedIn
                    }
                  >
                    {clockInMutation.isPending ? "Clocking in…" : "Clock in"}
                  </Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    variant="secondary"
                    onPress={() => clockOutMutation.mutate()}
                    disabled={
                      statusQuery.isLoading ||
                      clockInMutation.isPending ||
                      clockOutMutation.isPending ||
                      !isClockedIn
                    }
                  >
                    {clockOutMutation.isPending ? "Clocking out…" : "Clock out"}
                  </Button>
                </View>
              </View>

              <View style={{ marginTop: 6 }}>
                <Button
                  variant="secondary"
                  onPress={refresh}
                  disabled={statusQuery.isFetching}
                >
                  {statusQuery.isFetching ? "Refreshing…" : "Refresh"}
                </Button>
              </View>

              <Text tone="tertiary" size="xs" style={{ marginTop: 10 }}>
                Note: This is a per-day clock. Job timestamps/locations will
                come from Bouncie.
              </Text>
            </View>
          </Panel>

          <Panel title="If something looks wrong">
            <Text tone="secondary">
              If you forgot to clock in/out, tell the office and we’ll add an
              adjustment.
            </Text>
          </Panel>
        </>
      )}
    </Page>
  );
}
