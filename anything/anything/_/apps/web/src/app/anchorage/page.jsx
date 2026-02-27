import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function AnchoragePage() {
  const areaName = "Anchorage, KY";
  const title = "HVAC Service in Anchorage, KY | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Anchorage, KY and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Anchorage KY, heating repair Anchorage, air conditioning Anchorage, furnace service Anchorage";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
