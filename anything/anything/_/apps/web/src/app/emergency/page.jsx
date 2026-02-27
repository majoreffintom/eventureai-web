import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Seo from "../../components/Seo";
import { Heading, Page, Panel, Text } from "../../components/ds.jsx";
import LeadCaptureForm from "../../components/LeadCaptureForm";

const HERO_IMAGE_URL =
  "https://ucarecdn.com/b6ee1956-442f-4b9f-a47e-8fa4f7ed1808/-/format/auto/";

export default function EmergencyPage() {
  const signs = [
    {
      title: "No heat / no AC",
      body: "If your system stops heating or cooling entirely, call us and we’ll help you get stable again.",
    },
    {
      title: "Burning smell or electrical odor",
      body: "Turn the system off and call right away — safety first.",
    },
    {
      title: "Water leaking",
      body: "Leaks can cause damage fast. We’ll help figure out if it’s a drain line, coil, or other issue.",
    },
    {
      title: "Loud noises",
      body: "Grinding, banging, or screeching can mean a part is failing — shutting down early can prevent bigger damage.",
    },
  ];

  const tips = [
    {
      title: "Check your thermostat",
      body: "Make sure it’s set to the right mode and the temperature is set past the current room temp.",
    },
    {
      title: "Replace the filter",
      body: "A clogged filter can shut a system down or cause it to freeze up.",
    },
    {
      title: "If you smell gas",
      body: "Leave the area and contact the gas company immediately. Then call us once you’re safe.",
    },
  ];

  const signCards = signs.map((s) => (
    <Panel key={s.title} className="h-full">
      <Text tone="primary" className="font-semibold">
        {s.title}
      </Text>
      <Text tone="secondary" className="mt-2">
        {s.body}
      </Text>
    </Panel>
  ));

  const tipCards = tips.map((t) => (
    <Panel key={t.title} className="h-full">
      <Text tone="primary" className="font-semibold">
        {t.title}
      </Text>
      <Text tone="secondary" className="mt-2">
        {t.body}
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
        title="Emergency Service | Goldey's Heating & Cooling"
        description="Emergency HVAC help in the Louisville Metro. Family-owned heating and cooling serving Louisville, Oldham County, and Shelbyville, KY. Call 502-262-0913."
        keywords="emergency hvac, no heat, no ac, furnace repair, ac repair, louisville hvac emergency"
        ogImage={HERO_IMAGE_URL}
      />

      <section>
        <Heading level={1} className="text-2xl md:text-3xl">
          Emergency Service
        </Heading>
        <Text className="mt-2 max-w-3xl" tone="secondary">
          If you have no heat, no AC, or a system issue that can’t wait, call
          now. If you can’t call, send us a note and we’ll reach out.
        </Text>
      </section>

      <section className="mt-6 md:mt-8">
        <Heading level={2} className="text-xl md:text-2xl">
          Common emergency issues
        </Heading>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {signCards}
        </div>
      </section>

      <section className="mt-6 md:mt-8">
        <Heading level={2} className="text-xl md:text-2xl">
          Quick checks (if it’s safe)
        </Heading>
        <Text className="mt-2 max-w-3xl" tone="secondary">
          These can help in a pinch — but if you see smoke, sparks, or smell
          gas, stop and get to safety.
        </Text>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {tipCards}
        </div>
      </section>

      <LeadCaptureForm
        pageLabel="Emergency Service"
        title="Emergency Service"
        description="If this can’t wait, call now. Otherwise, send the details and we’ll contact you as soon as possible."
        callout="We will get back to you soon — thanks for contacting Goldey’s."
      />
    </Page>
  );
}
