"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Heading, Panel, Text } from "./ds.jsx";

const COMPANY = {
  phoneDisplay: "502-262-0913",
  phoneHref: "tel:5022620913",
};

export default function LeadCaptureForm({
  pageLabel,
  title,
  description,
  callout,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const combinedName = useMemo(() => {
    const value = `${firstName} ${lastName}`.trim();
    return value;
  }, [firstName, lastName]);

  const mutation = useMutation({
    mutationFn: async ({ name, phone, email, message }) => {
      const response = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, message }),
      });
      if (!response.ok) {
        let body = null;
        try {
          body = await response.json();
        } catch (e) {
          // ignore
        }
        const serverError = body?.error;
        throw new Error(
          serverError ||
            `When fetching /api/public/contact, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDetails("");
    },
    onError: (err) => {
      console.error(err);
      setError(err?.message || "Could not send your request");
      setSuccess(false);
    },
  });

  const isSending = mutation.isPending;
  const submitLabel = isSending ? "Sending…" : "Send";

  const resolvedTitle = title || "Contact us";
  const resolvedDescription =
    description ||
    "Call now or fill out the form and we’ll get back to you as soon as we can.";
  const resolvedCallout =
    callout || "We will get back to you soon — thanks for contacting Goldey’s.";

  return (
    <section className="mt-6 md:mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <Panel className="h-full">
            <Heading level={1} className="text-2xl md:text-3xl">
              {resolvedTitle}
            </Heading>
            <Text className="mt-2" tone="secondary">
              {resolvedDescription}
            </Text>

            <div className="mt-5">
              <a href={COMPANY.phoneHref} className="block">
                <Button className="w-full" variant="primary">
                  Call now {COMPANY.phoneDisplay}
                </Button>
              </a>
              <Text size="sm" tone="tertiary" className="mt-2">
                If this is urgent, calling is the fastest way to reach us.
              </Text>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-7">
          <Panel>
            <Heading level={2} className="text-xl md:text-2xl">
              Or send a quick note
            </Heading>
            <Text size="sm" tone="tertiary" className="mt-2">
              Fields marked with * are required.
            </Text>

            {success ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {resolvedCallout}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                setSuccess(false);

                const message = [
                  pageLabel ? `Page: ${pageLabel}` : null,
                  details ? `Details: ${details}` : null,
                ]
                  .filter(Boolean)
                  .join("\n");

                mutation.mutate({
                  name: combinedName,
                  phone,
                  email,
                  message,
                });
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name *"
                  className="w-full rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
                  required
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name *"
                  className="w-full rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
                  required
                />
              </div>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email *"
                className="w-full rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
                type="email"
                required
              />

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
              />

              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="How can we help? *"
                className="w-full min-h-[140px] rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
                required
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Button type="submit" variant="primary" disabled={isSending}>
                  {submitLabel}
                </Button>
                <Text size="sm" tone="tertiary">
                  By sending, you agree we can contact you back.
                </Text>
              </div>
            </form>
          </Panel>
        </div>
      </div>
    </section>
  );
}
