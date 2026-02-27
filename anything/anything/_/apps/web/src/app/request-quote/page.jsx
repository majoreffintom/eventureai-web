import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Seo from "../../components/Seo";
import { Heading, Page, Panel, Text } from "../../components/ds.jsx";
import LeadCaptureForm from "../../components/LeadCaptureForm";

const HERO_IMAGE_URL =
  "https://ucarecdn.com/b6ee1956-442f-4b9f-a47e-8fa4f7ed1808/-/format/auto/";

export default function RequestQuotePage() {
  const quoteTypes = [
    {
      title: "System replacement",
      body: "AC, furnace, heat pump, and full system replacements with honest guidance and clean installs.",
    },
    {
      title: "New installs",
      body: "New construction or additions — we’ll help design the right setup for comfort and efficiency.",
    },
    {
      title: "Major repairs",
      body: "If the repair is big, we’ll explain options so you can choose what makes the most sense.",
    },
  ];

  const prep = [
    {
      title: "What brand/model (if you know)",
      body: "A quick photo of the data plate helps — but it’s optional.",
    },
    {
      title: "Home size & comfort issues",
      body: "Hot/cold rooms, humidity, airflow, and any rooms you struggle to keep comfortable.",
    },
    {
      title: "Timeline",
      body: "Is this urgent, this month, or just planning ahead? We’ll work with your schedule.",
    },
  ];

  const quoteCards = quoteTypes.map((q) => (
    <Panel key={q.title} className="h-full">
      <Text tone="primary" className="font-semibold">
        {q.title}
      </Text>
      <Text tone="secondary" className="mt-2">
        {q.body}
      </Text>
    </Panel>
  ));

  const prepCards = prep.map((p) => (
    <Panel key={p.title} className="h-full">
      <Text tone="primary" className="font-semibold">
        {p.title}
      </Text>
      <Text tone="secondary" className="mt-2">
        {p.body}
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
        title="Request a Quote | Goldey's Heating & Cooling"
        description="Request an HVAC quote in the Louisville Metro. Family-owned heating and cooling serving Louisville, Oldham County, and Shelbyville, KY."
        keywords="hvac quote, furnace replacement, ac replacement, heat pump quote, louisville hvac"
        ogImage={HERO_IMAGE_URL}
      />

      <section>
        <Heading level={1} className="text-2xl md:text-3xl">
          Request a Quote
        </Heading>
        <Text className="mt-2 max-w-3xl" tone="secondary">
          Interested in a new system, replacement, or a big repair? Share a few
          details and we’ll reach back with next steps.
        </Text>
      </section>

      <section className="mt-6 md:mt-8">
        <Heading level={2} className="text-xl md:text-2xl">
          Quotes for
        </Heading>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {quoteCards}
        </div>
      </section>

      <section className="mt-6 md:mt-8">
        <Heading level={2} className="text-xl md:text-2xl">
          Helpful details to include
        </Heading>
        <Text className="mt-2 max-w-3xl" tone="secondary">
          The more we know, the faster we can guide you to the right options.
        </Text>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {prepCards}
        </div>
      </section>

      <LeadCaptureForm
        pageLabel="Request a Quote"
        title="Request a Quote"
        description="Call now or fill out the form and we’ll contact you soon."
        callout="We will get back to you soon — thanks for contacting Goldey’s."
      />
    </Page>
  );
}
