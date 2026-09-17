import { SignUpForm } from "@/screens/sign-up";
import { SiteHeader } from "@/components/site/site-header";

export default function SignUpPage() {
  return (
    <>
      <SiteHeader showAccount={false} />
      <SignUpForm />
    </>
  );
}
