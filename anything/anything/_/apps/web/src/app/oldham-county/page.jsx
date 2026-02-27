import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function OldhamCountyPage() {
  const areaName = "Oldham County, KY";
  const title =
    "HVAC Service in Oldham County, KY | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Oldham County, KY and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Oldham County KY, AC repair Oldham County, heating repair Oldham County, furnace service Oldham County";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
