import { LegalPage } from "@/screens/legal";
import { SiteHeader } from "@/components/site/site-header";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <LegalPage namespace="privacy" sectionCount={7} />
    </>
  );
}
