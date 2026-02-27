"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button, Heading, Page, Panel, Text } from "@/components/ds.jsx";
import useAuth from "@/utils/useAuth";

export default function AdminLoginPage() {
  const { signInWithCredentials } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const urlError = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (!err) {
      return null;
    }

    const errorMessages = {
      CredentialsSignin: "Incorrect email or password.",
      AccessDenied: "You don’t have permission to sign in.",
      Configuration: "Sign-in isn’t working right now. Please try again later.",
      Callback: "Something went wrong during sign-in. Please try again.",
    };

    return errorMessages[err] || "Something went wrong. Please try again.";
  }, []);

  useEffect(() => {
    if (urlError) {
      setSubmitError(urlError);
    }
  }, [urlError]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!trimmedEmail || !password) {
      setSubmitError("Please enter your email and password.");
      return;
    }

    // Allow caller to control where the auth redirect lands.
    // Default to /post-auth?from=admin so it retries cookie/session detection.
    let callbackUrl = "/post-auth?from=admin";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("callbackUrl");
      if (requested && requested.startsWith("/")) {
        callbackUrl = requested;
      }
    }

    setSubmitting(true);

    try {
      await signInWithCredentials({
        email: trimmedEmail,
        password,
        callbackUrl,
        redirect: true,
      });

      // If redirect doesn't happen for some reason, fall back.
      if (typeof window !== "undefined") {
        window.location.replace(callbackUrl);
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Could not sign in. Please try again.");
      setSubmitting(false);
    }
  };

  const submitLabel = submitting ? "Signing in…" : "Sign in";

  return (
    <Page
      header={<SiteHeader />}
      footer={<SiteFooter />}
      contentClassName="pt-6"
    >
      <Heading level={1} className="text-2xl md:text-3xl">
        Admin
      </Heading>
      <Text className="mt-2" tone="secondary">
        Staff sign-in for scheduling, accounting, and operations.
      </Text>

      <div className="mt-6">
        <Panel title="Admin sign-in" subtitle="For Goldey staff only.">
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Text as="label" className="block text-sm font-medium">
                Email
              </Text>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#357AFF] focus-within:ring-1 focus-within:ring-[#357AFF]">
                <input
                  required
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-lg outline-none"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Text as="label" className="block text-sm font-medium">
                Password
              </Text>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#357AFF] focus-within:ring-1 focus-within:ring-[#357AFF]">
                <input
                  required
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-lg outline-none"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {submitError ? (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={submitting}>
                {submitLabel}
              </Button>
              <Button as="a" href="/" variant="secondary">
                Back to site
              </Button>
            </div>

            <Text tone="tertiary" size="sm" className="pt-2">
              Tip: If login seems stuck, open{" "}
              <Text as="a" href="/account/logout" className="underline">
                /account/logout
              </Text>{" "}
              first, then try again.
            </Text>

            <Text tone="tertiary" size="sm" className="pt-2">
              Build: 2026-01-20
            </Text>
          </form>
        </Panel>
      </div>
    </Page>
  );
}
