/**
 * AUTH ROADMAP (iOS App Store + Google Play)
 *
 * Planned login methods:
 * - Email/password (baseline fallback)
 * - Apple Sign In (iOS) — REQUIRED if we ship any 3rd‑party social login on iOS (App Store policy)
 * - Google Sign-In (iOS + Android)
 * - Facebook Login (optional)
 * - X / Twitter Login (optional)
 *
 * Notes:
 * - Keep auth provider choices consistent between mobile and web where possible.
 * - Provider enablement requires app registrations (Apple Developer, Google Cloud, Meta, X) and redirect URLs.
 * - Do not ship Google/Facebook/X login buttons on iOS unless Apple Sign In is included in the same release.
 *
 * Google Play:
 * - Google Play does not require Google Sign-In, but it’s commonly expected if we offer social login on Android.
 * - Ensure Play Console policy compliance (privacy policy + data safety disclosures) and correct OAuth configuration.
 */
import { useCallback } from "react";
import { signIn, signOut } from "@auth/create/react";

function useAuth() {
  const callbackUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("callbackUrl")
      : null;

  const signInWithCredentials = useCallback(
    (options) => {
      return signIn("credentials-signin", {
        ...options,
        callbackUrl: callbackUrl ?? options.callbackUrl,
      });
    },
    [callbackUrl],
  );

  const signUpWithCredentials = useCallback(
    (options) => {
      return signIn("credentials-signup", {
        ...options,
        callbackUrl: callbackUrl ?? options.callbackUrl,
      });
    },
    [callbackUrl],
  );

  const signInWithGoogle = useCallback(
    (options) => {
      return signIn("google", {
        ...options,
        callbackUrl: callbackUrl ?? options.callbackUrl,
      });
    },
    [callbackUrl],
  );
  const signInWithFacebook = useCallback((options) => {
    return signIn("facebook", options);
  }, []);
  const signInWithTwitter = useCallback((options) => {
    return signIn("twitter", options);
  }, []);

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signInWithGoogle,
    signInWithFacebook,
    signInWithTwitter,
    signOut,
  };
}

export default useAuth;
