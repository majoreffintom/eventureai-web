import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Seo from "../components/Seo";
import Hero from "../components/Hero";
import { Button, Heading, Page, Text } from "../components/ds.jsx";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

const COMPANY = {
  name: "Goldey's Heating & Cooling",
  phoneDisplay: "502-262-0913",
  phoneHref: "tel:5022620913",
  email: "goldeyshvac@yahoo.com",
  addressLine1: "728 Frankfort Road",
  addressLine2: "Shelbyville, KY 40065",
  googleMapsHref:
    "https://www.google.com/maps/search/?api=1&query=728%20Frankfort%20Road%2C%20Shelbyville%2C%20KY%2040065",
};

const HERO_IMAGE_URL =
  "https://ucarecdn.com/b6ee1956-442f-4b9f-a47e-8fa4f7ed1808/-/format/auto/";

const TESTIMONIALS = [
  {
    quote:
      "Goldey's Heating & Cooling handles all HVAC concerns with our rental properties. They are accessible, knowledgeable, prompt and professional.",
    name: "Elizabeth Rogers Davis",
  },
  {
    quote:
      "Goldey's understands that our rentals are investment properties and for our owners we try to keep costs down, but still provide quality service.",
    name: "Joan Russell",
  },
  {
    quote:
      "Goldey's makes it a point to address every issue in a timely manner with top of the line customer service and honest feedback.",
    name: "Paul Foster",
  },
  {
    quote:
      "Goldey's is hands down remarkable to work with. Professional, easy to work with, and a stress-free install process.",
    name: "Amanda & Brandon Quire",
  },
];

export default function HomePage() {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState(null);
  const [contactSuccess, setContactSuccess] = useState(false);

  const contactMutation = useMutation({
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
      setContactSuccess(true);
      setContactError(null);
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setContactMessage("");
    },
    onError: (error) => {
      console.error(error);
      setContactError(error?.message || "Could not send your request");
      setContactSuccess(false);
    },
  });

  const isSending = contactMutation.isPending;
  const submitLabel = isSending ? "Sending…" : "Send request";

  const taglineText = "Two Decades of Quality Customer Service You can Trust";

  return (
    <Page
      header={<SiteHeader />}
      footer={<SiteFooter />}
      contentClassName="pt-6 md:pt-8"
    >
      <Seo
        title="Goldey's Heating & Cooling | Louisville Metro HVAC"
        description="Shelbyville-based HVAC serving Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913 today."
        ogImage={HERO_IMAGE_URL}
      />

      {/* Tagline just under the header */}
      <section className="mt-2">
        <Heading level={1} className="text-2xl md:text-3xl">
          {taglineText}
        </Heading>
        <Text className="mt-2" tone="secondary">
          Serving Louisville Metro since 2003.
        </Text>
      </section>

      {/* Hero (image only) */}
      <section className="mt-4 md:mt-5">
        <Hero />
      </section>

      {/* Primary CTAs (moved out of the hero) */}
      <section className="mt-4 md:mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            as="a"
            href="/schedule-maintenance"
            variant="primary"
            className="hidden sm:inline-flex"
          >
            Schedule Appointment
          </Button>
          <Button as="a" href="/emergency" variant="secondary">
            Emergency Service
          </Button>
          <Button as="a" href="/customer" variant="secondary">
            Customer Portal
          </Button>
          <Button as="a" href="/request-quote" variant="secondary">
            Request a Quote
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mt-10 md:mt-14">
        <Heading level={2} className="text-2xl md:text-3xl">
          Reviews
        </Heading>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5"
            >
              <Text tone="secondary">“{t.quote}”</Text>
              <figcaption className="mt-3">
                <Text size="sm" tone="tertiary">
                  — {t.name}
                </Text>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mt-10 md:mt-14 pb-16">
        <Heading level={2} className="text-2xl md:text-3xl">
          Contact
        </Heading>
        <Text className="mt-2 max-w-3xl" tone="secondary">
          Call us for service. If you’re on the go, send a quick note and we’ll
          reach back.
        </Text>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5">
              <Text as="div" className="font-semibold" tone="primary">
                Call
              </Text>
              <Text className="mt-2" tone="secondary">
                <a
                  href={COMPANY.phoneHref}
                  className="font-semibold hover:text-[var(--ds-text-primary)]"
                >
                  {COMPANY.phoneDisplay}
                </a>
              </Text>
              <Text className="mt-4" size="sm" tone="tertiary">
                For the fastest help, calling is best.
              </Text>
            </div>

            <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5">
              <Text as="div" className="font-semibold" tone="primary">
                Email
              </Text>
              <Text className="mt-2" tone="secondary">
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="font-semibold hover:text-[var(--ds-text-primary)]"
                >
                  {COMPANY.email}
                </a>
              </Text>
              <Text className="mt-4" size="sm" tone="tertiary">
                Prefer a call back? Use the form and we’ll reach out.
              </Text>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5">
            <Text as="div" className="font-semibold" tone="primary">
              Request service
            </Text>
            <Text size="sm" tone="tertiary" className="mt-2">
              Share what’s going on and the best number to reach you.
            </Text>

            {contactSuccess ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Got it — we’ll reach back soon. If this is urgent, please call{" "}
                <a href={COMPANY.phoneHref} className="font-semibold underline">
                  {COMPANY.phoneDisplay}
                </a>
                .
              </div>
            ) : null}

            {contactError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {contactError}
              </div>
            ) : null}

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setContactError(null);
                setContactSuccess(false);
                contactMutation.mutate({
                  name: contactName,
                  phone: contactPhone,
                  email: contactEmail,
                  message: contactMessage,
                });
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
                  required
                />
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone"
                  className="w-full rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
                  required
                />
              </div>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
                type="email"
                required
              />
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="How can we help? (Include your address if you can)"
                className="w-full min-h-[120px] rounded-xl border border-[var(--ds-border)] bg-transparent px-3 py-2 text-sm"
                required
              />

              <Button type="submit" variant="primary" disabled={isSending}>
                {submitLabel}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Mobile sticky call-to-action */}
      <div className="md:hidden fixed bottom-3 left-0 right-0 z-40">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-sm p-3 flex gap-3">
            <a href={COMPANY.phoneHref} className="flex-1">
              <Button className="w-full" variant="primary">
                Call
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Page>
  );
}
