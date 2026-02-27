import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import Seo from "./Seo";
import Hero from "./Hero";
import { Button, Heading, Page, Text } from "./ds.jsx";

const COMPANY = {
  name: "Goldey's Heating & Cooling",
  phoneDisplay: "502-262-0913",
  phoneHref: "tel:5022620913",
  email: "goldeyshvac@yahoo.com",
};

export default function ServiceAreaTemplate({
  areaName,
  title,
  description,
  keywords,
}) {
  const safeAreaName = areaName || "the Louisville Metro";
  const safeTitle =
    title || `HVAC Service in ${safeAreaName} | ${COMPANY.name}`;
  const safeDescription =
    description ||
    `Shelbyville-based HVAC serving ${safeAreaName} and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call ${COMPANY.phoneDisplay}.`;

  const h1Text = `HVAC Service in ${safeAreaName}`;
  const h2Text = `Heating & Air Conditioning Repair in ${safeAreaName}`;
  const introText =
    "Family-owned HVAC service built on honest work. We handle heating and cooling repairs, maintenance, and installs across the Louisville Metro.";

  return (
    <Page
      header={<SiteHeader />}
      footer={<SiteFooter />}
      contentClassName="pt-8 md:pt-12"
    >
      <Seo
        title={safeTitle}
        description={safeDescription}
        keywords={keywords}
        ogTitle={safeTitle}
        ogDescription={safeDescription}
      />

      <section className="mt-2">
        {/* Desktop H1 */}
        <Heading level={1} className="hidden md:block text-2xl md:text-4xl">
          <span className="block">{h1Text}</span>
          <span className="block mt-2 text-base md:text-lg font-semibold text-[var(--ds-text-tertiary)]">
            <a href={COMPANY.phoneHref} className="hover:underline">
              {COMPANY.phoneDisplay}
            </a>
            <span className="mx-2">•</span>
            <a href={`mailto:${COMPANY.email}`} className="hover:underline">
              {COMPANY.email}
            </a>
          </span>
        </Heading>

        {/* Mobile: use H2 (requested) */}
        <Heading level={2} className="md:hidden text-2xl">
          <span className="block">{h1Text}</span>
          <span className="block mt-2 text-sm font-semibold text-[var(--ds-text-tertiary)]">
            <a href={COMPANY.phoneHref} className="hover:underline">
              {COMPANY.phoneDisplay}
            </a>
            <span className="mx-2">•</span>
            <a href={`mailto:${COMPANY.email}`} className="hover:underline">
              {COMPANY.email}
            </a>
          </span>
        </Heading>

        <Text className="mt-3 max-w-3xl" tone="secondary">
          {introText}
        </Text>
      </section>

      <section className="mt-4 md:mt-6">
        <Hero />
      </section>

      <section className="mt-10 md:mt-14">
        <Heading level={2} className="text-2xl md:text-3xl">
          {h2Text}
        </Heading>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5">
            <Text as="div" className="font-semibold" tone="primary">
              Heating
            </Text>
            <Text className="mt-2" tone="secondary">
              Furnace repair, maintenance, and replacement.
            </Text>
          </div>

          <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5">
            <Text as="div" className="font-semibold" tone="primary">
              Air Conditioning
            </Text>
            <Text className="mt-2" tone="secondary">
              AC repair, tune-ups, and new installs.
            </Text>
          </div>

          <div className="rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] p-5">
            <Text as="div" className="font-semibold" tone="primary">
              Maintenance
            </Text>
            <Text className="mt-2" tone="secondary">
              Seasonal checkups to keep things running right.
            </Text>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a href={COMPANY.phoneHref} className="w-full sm:w-auto">
            <Button className="w-full" variant="primary">
              Call {COMPANY.phoneDisplay}
            </Button>
          </a>
          <a href="/schedule-maintenance" className="w-full sm:w-auto">
            <Button className="w-full" variant="secondary">
              Schedule appointment
            </Button>
          </a>
        </div>
      </section>
    </Page>
  );
}
