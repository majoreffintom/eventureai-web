import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Seo from "../../components/Seo";
import { Page } from "../../components/ds.jsx";

export default function AboutPage() {
  return (
    <Page header={<SiteHeader />} footer={<SiteFooter />}>
      <Seo
        title="About Us | Goldey's Heating & Cooling"
        description="Two generations serving the Louisville Metro for over two decades. Goldey's Heating & Cooling serves Louisville, Oldham County, and Shelbyville, KY."
      />
      {/* Intentionally minimal for now */}
    </Page>
  );
}
