import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function CrescentHillPage() {
  const areaName = "Crescent Hill, Louisville, KY";
  const title = "HVAC Service in Crescent Hill | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Crescent Hill (Louisville, KY) and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Crescent Hill Louisville, AC repair Crescent Hill, heating repair Crescent Hill Louisville KY, furnace service Crescent Hill";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
