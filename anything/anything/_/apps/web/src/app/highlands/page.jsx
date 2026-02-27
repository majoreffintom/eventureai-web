import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function HighlandsPage() {
  const areaName = "The Highlands, Louisville, KY";
  const title = "HVAC Service in The Highlands | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving The Highlands (Louisville, KY) and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Highlands Louisville, AC repair Highlands, heating repair Highlands Louisville KY, furnace service Highlands";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
