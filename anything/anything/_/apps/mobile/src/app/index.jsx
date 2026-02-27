import { Redirect } from "expo-router";
import { useAuth } from "@/utils/auth/useAuth";

export default function Index() {
  const { isReady, auth } = useAuth();

  if (!isReady) {
    return null;
  }

  const role = auth?.user?.role || null;
  const isAdmin = role === "admin" || role === "owner";

  // Customers (and signed-out users) land in the customer-style tabs.
  // Admin/Owner lands on the admin-style tabs.
  if (isAdmin) {
    return <Redirect href="/(tabs)/schedule" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
