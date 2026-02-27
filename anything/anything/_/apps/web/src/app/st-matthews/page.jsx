import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function StMatthewsPage() {
  const areaName = "St. Matthews, KY";
  const title = "HVAC Service in St. Matthews, KY | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving St. Matthews, KY and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC St Matthews KY, heating repair St Matthews, air conditioning St Matthews, furnace service St Matthews";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
