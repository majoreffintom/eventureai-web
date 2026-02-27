"use client";

import { useCallback, useState } from "react";
import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const [error, setError] = useState(null);

  const onSignOut = useCallback(async () => {
    setError(null);
    try {
      await signOut({ callbackUrl: "/", redirect: true });
    } catch (e) {
      console.error(e);
      setError("Could not sign out");
    }
  }, [signOut]);

  return (
    <div className="min-h-screen bg-white text-black">
      <main className="max-w-md mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl tracking-tight">Sign out</h1>
        <p className="mt-2 text-black/70">Click below to end your session.</p>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className="mt-6 w-full h-11 rounded-md bg-black text-white hover:bg-black/90"
        >
          Sign out
        </button>
      </main>
    </div>
  );
}
