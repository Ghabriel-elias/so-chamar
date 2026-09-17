import { Onboarding } from "@/screens/setup";
import { SiteHeader } from "@/components/site/site-header";

export default function StartPage() {
  return (
    <>
      <SiteHeader showAccount={false} />
      <main>
        <Onboarding />
      </main>
    </>
  );
}
