import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function ProspectPage() {
  const areaName = "Prospect, KY";
  const title = "HVAC Service in Prospect, KY | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Prospect, KY and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Prospect KY, heating repair Prospect, air conditioning Prospect, furnace service Prospect";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
