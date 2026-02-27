import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function MiddletownPage() {
  const areaName = "Middletown, KY";
  const title = "HVAC Service in Middletown, KY | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Middletown, KY and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Middletown KY, heating repair Middletown, air conditioning Middletown, furnace service Middletown";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
