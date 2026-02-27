import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function LouisvillePage() {
  const areaName = "Louisville, KY";
  const title = "HVAC Service in Louisville, KY | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Louisville, KY since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913 today.";
  const keywords =
    "HVAC Louisville KY, heating repair Louisville, air conditioning repair Louisville, furnace service Louisville";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
