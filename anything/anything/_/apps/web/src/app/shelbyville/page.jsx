import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function ShelbyvillePage() {
  const areaName = "Shelbyville, KY";
  const title = "HVAC Service in Shelbyville, KY | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Shelbyville, KY and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Shelbyville KY, heating repair Shelbyville, air conditioning Shelbyville, furnace service Shelbyville";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
