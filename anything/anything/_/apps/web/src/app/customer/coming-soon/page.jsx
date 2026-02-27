import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import Seo from "../../../components/Seo";
import { Button, Heading, Page, Panel, Text } from "../../../components/ds.jsx";

const COMPANY = {
  phoneDisplay: "502-262-0913",
  phoneHref: "tel:5022620913",
};

const HERO_IMAGE_URL =
  "https://ucarecdn.com/b6ee1956-442f-4b9f-a47e-8fa4f7ed1808/-/format/auto/";

export default function CustomerComingSoonPage() {
  const features = [
    "Appointments and reminders",
    "Invoice history",
    "Service history and notes",
    "Profile and preferred contact info",
  ];

  const featureList = features.map((f) => (
    <li key={f} className="text-sm text-[var(--ds-text-secondary)]">
      {f}
    </li>
  ));

  return (
    <Page
      header={<SiteHeader />}
      footer={<SiteFooter />}
      contentClassName="pt-6 md:pt-8"
    >
      <Seo
        title="Customer Portal (Coming Soon) | Goldey's Heating & Cooling"
        description="The Goldey's customer portal is coming soon. Thank you for creating an account."
        keywords="goldeys customer portal coming soon"
        ogImage={HERO_IMAGE_URL}
      />

      <Heading level={1} className="text-2xl md:text-3xl">
        Customer Portal — Coming Soon
      </Heading>
      <Text className="mt-2 max-w-3xl" tone="secondary">
        Thanks for creating an account. We’re building the portal now so you’ll
        have a simple place to manage service with Goldey’s.
      </Text>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <Text tone="primary" className="font-semibold">
            What’s coming
          </Text>
          <Text className="mt-2" tone="secondary">
            When the portal launches, you’ll be able to use your account for:
          </Text>
          <ul className="mt-3 list-disc pl-5 space-y-1">{featureList}</ul>
        </Panel>

        <Panel>
          <Text tone="primary" className="font-semibold">
            Need help right now?
          </Text>
          <Text className="mt-2" tone="secondary">
            Call us and we’ll get you taken care of.
          </Text>
          <div className="mt-4">
            <a href={COMPANY.phoneHref} className="block">
              <Button className="w-full" variant="primary">
                Call now {COMPANY.phoneDisplay}
              </Button>
            </a>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel>
          <Text tone="primary" className="font-semibold">
            Want to request service online?
          </Text>
          <Text className="mt-2" tone="secondary">
            Use a request form and we’ll reach back soon.
          </Text>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button as="a" href="/schedule-maintenance" variant="secondary">
              Schedule Appointment
            </Button>
            <Button as="a" href="/request-quote" variant="secondary">
              Request a Quote
            </Button>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <a href="/account/logout" className="inline-block">
          <Button variant="secondary">Sign out</Button>
        </a>
      </div>
    </Page>
  );
}
