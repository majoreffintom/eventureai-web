import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function JeffersontownPage() {
  const areaName = "Jeffersontown, KY";
  const title =
    "HVAC Service in Jeffersontown, KY | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Jeffersontown, KY and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Jeffersontown KY, heating repair J-town, air conditioning Jeffersontown, furnace service Jeffersontown";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
