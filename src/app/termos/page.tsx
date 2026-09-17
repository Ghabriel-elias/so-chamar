import { LegalPage } from "@/screens/legal";
import { SiteHeader } from "@/components/site/site-header";

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <LegalPage namespace="terms" sectionCount={8} />
    </>
  );
}
