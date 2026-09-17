import { SignInForm } from "@/screens/sign-in";
import { SiteHeader } from "@/components/site/site-header";

export default function SignInPage() {
  return (
    <>
      <SiteHeader showAccount={false} />
      <SignInForm />
    </>
  );
}
