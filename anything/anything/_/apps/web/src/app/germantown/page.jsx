import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function GermantownPage() {
  const areaName = "Germantown, Louisville, KY";
  const title = "HVAC Service in Germantown | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Germantown (Louisville, KY) and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Germantown Louisville, AC repair Germantown, heating repair Germantown Louisville KY, furnace service Germantown";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
