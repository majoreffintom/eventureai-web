"use client";

import { useEffect } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Seo from "../../components/Seo";
import { Button, Heading, Page, Panel, Text } from "../../components/ds.jsx";
import useUser from "@/utils/useUser";

const HERO_IMAGE_URL =
  "https://ucarecdn.com/b6ee1956-442f-4b9f-a47e-8fa4f7ed1808/-/format/auto/";

export default function CustomerPortalPage() {
  const { data: user, loading } = useUser();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!loading && user) {
      window.location.assign("/customer/coming-soon");
    }
  }, [loading, user]);

  const callbackUrl = "/customer";

  const comingSoonItems = [
    {
      title: "Appointments",
      body: "Request service online and see upcoming appointments in one place.",
    },
    {
      title: "Invoices & payments",
      body: "View invoices and keep your account info ready for future online payments.",
    },
    {
      title: "Service history",
      body: "Keep a simple record of past visits, recommendations, and work completed.",
    },
  ];

  const comingSoonCards = comingSoonItems.map((i) => (
    <Panel key={i.title} className="h-full">
      <Text tone="primary" className="font-semibold">
        {i.title}
      </Text>
      <Text tone="secondary" className="mt-2">
        {i.body}
      </Text>
    </Panel>
  ));

  return (
    <Page
      header={<SiteHeader />}
      footer={<SiteFooter />}
      contentClassName="pt-6 md:pt-8"
    >
      <Seo
        title="Customer Portal | Goldey's Heating & Cooling"
        description="Customer portal coming soon. Create an account to be ready for online invoices, appointments, and more."
        keywords="hvac customer portal, goldeys, invoices, appointments"
        ogImage={HERO_IMAGE_URL}
      />

      <section>
        <Heading level={1} className="text-2xl md:text-3xl">
          Customer Portal
        </Heading>
        <Text className="mt-2 max-w-3xl" tone="secondary">
          The customer portal is coming soon. Create an account now so you’ll be
          ready when it launches.
        </Text>
      </section>

      <section className="mt-6 md:mt-8">
        <Heading level={2} className="text-xl md:text-2xl">
          What you’ll be able to do
        </Heading>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {comingSoonCards}
        </div>
      </section>

      <div className="mt-6">
        {loading ? (
          <Panel>
            <Text tone="secondary">Loading…</Text>
          </Panel>
        ) : user ? (
          <Panel>
            <Text tone="secondary">Redirecting…</Text>
          </Panel>
        ) : (
          <Panel>
            <Text tone="primary" className="font-semibold">
              Create your account
            </Text>
            <Text tone="secondary" className="mt-2">
              You’ll use this sign-in later to view appointments, invoices, and
              service history.
            </Text>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                as="a"
                href={`/account/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                Create account
              </Button>
              <Button
                as="a"
                href={`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                variant="secondary"
              >
                Sign in
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </Page>
  );
}
