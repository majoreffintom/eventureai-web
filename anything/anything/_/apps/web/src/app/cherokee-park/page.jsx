import ServiceAreaTemplate from "../../components/ServiceAreaTemplate.jsx";

export default function CherokeeParkPage() {
  const areaName = "Cherokee Park (Louisville, KY)";
  const title = "HVAC Service near Cherokee Park | Goldey's Heating & Cooling";
  const description =
    "Shelbyville-based HVAC serving Cherokee Park and Louisville Metro since 2003. Heating, cooling, repair, and maintenance with small-town values. Call 502-262-0913.";
  const keywords =
    "HVAC Cherokee Park, HVAC Highlands Louisville, heating repair near Cherokee Park, air conditioning repair Highlands";

  return (
    <ServiceAreaTemplate
      areaName={areaName}
      title={title}
      description={description}
      keywords={keywords}
    />
  );
}
