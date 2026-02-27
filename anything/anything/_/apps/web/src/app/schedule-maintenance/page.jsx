import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Seo from "../../components/Seo";
import { Heading, Page, Panel, Text } from "../../components/ds.jsx";
import LeadCaptureForm from "../../components/LeadCaptureForm";

const HERO_IMAGE_URL =
  "https://ucarecdn.com/b6ee1956-442f-4b9f-a47e-8fa4f7ed1808/-/format/auto/";

export default function ScheduleMaintenancePage() {
  const services = [
    {
      title: "Maintenance & tune-ups",
      body: "Seasonal tune-ups help your system run cleaner, quieter, and more efficiently.",
    },
    {
      title: "Repairs",
      body: "Strange noises, weak airflow, uneven rooms, or a system that won’t keep up — we’ll diagnose and fix it.",
    },
    {
      title: "New installs & replacements",
      body: "When it’s time to upgrade, we’ll help you choose the right fit for your home and budget.",
    },
  ];

  const steps = [
    {
      title: "Send a quick request",
      body: "Fill out the form below with what’s going on (and your address if you can).",
    },
    {
      title: "We call you back",
      body: "We’ll confirm details, answer questions, and lock in a time that works.",
    },
    {
      title: "We show up ready",
      body: "You’ll get clear options, straightforward pricing, and work done the right way.",
    },
  ];

  const serviceCards = services.map((s) => (
    <Panel key={s.title} className="h-full">
      <Text tone="primary" className="font-semibold">
        {s.title}
      </Text>
      <Text tone="secondary" className="mt-2">
        {s.body}
      </Text>
    </Panel>
  ));

  const stepCards = steps.map((s) => (
    <Panel key={s.title} className="h-full">
      <Text tone="primary" className="font-semibold">
        {s.title}
      </Text>
      <Text tone="secondary" className="mt-2">
        {s.body}
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
        title="Schedule Appointment | Goldey's Heating & Cooling"
        description="Schedule HVAC service or maintenance in the Louisville Metro. Serving Louisville, Oldham County, and Shelbyville, KY with honest, family-owned service."
        keywords="schedule hvac service, hvac maintenance, furnace tune up, ac tune up, louisville hvac, shelbyville hvac"
        ogImage={HERO_IMAGE_URL}
      />

      <section>
        <Heading level={1} className="text-2xl md:text-3xl">
          Schedule Appointment
        </Heading>
        <Text className="mt-2 max-w-3xl" tone="secondary">
          Tell us what you need and the best way to reach you. If it’s urgent,
          call now.
        </Text>
      </section>

      <section className="mt-6 md:mt-8">
        <Heading level={2} className="text-xl md:text-2xl">
          What we can help with
        </Heading>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {serviceCards}
        </div>
      </section>

      <section className="mt-6 md:mt-8">
        <Heading level={2} className="text-xl md:text-2xl">
          What to expect
        </Heading>
        <Text className="mt-2 max-w-3xl" tone="secondary">
          We keep it simple: quick communication, clean work, and clear answers.
        </Text>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {stepCards}
        </div>
      </section>

      <LeadCaptureForm
        pageLabel="Schedule Appointment"
        title="Schedule Appointment"
        description="Need maintenance or service? Call now or fill out the form and we’ll reach back soon."
        callout="We will get back to you soon — thanks for contacting Goldey’s."
      />
    </Page>
  );
}
