"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { digitsOnly, formatPhone } from "@/utils/format/phone";
import { Link } from "@/utils/navigation";

import { useSignIn } from "./useSignIn";

export function SignInForm() {
  const t = useTranslations("auth");
  const screen = useSignIn();

  return (
    <AuthShell
      title={t("signInTitle")}
      subtitle={t("signInSubtitle")}
      formId="sign-in"
      onSubmit={screen.submit}
      problems={screen.problems}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link
            href="/cadastro"
            className="font-medium text-blue underline underline-offset-4"
          >
            {t("signUpLink")}
          </Link>
        </>
      }
      action={
        <Button
          type="submit"
          form="sign-in"
          look="primary"
          fullWidth
          icon={LogIn}
          loading={screen.busy}
        >
          {t("signIn")}
        </Button>
      }
    >
      <TextField
        id="sign-in-phone"
        label={t("phone")}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={formatPhone(screen.phone)}
        onChange={(event) => screen.setPhone(digitsOnly(event.target.value))}
        error={screen.errorFor("phone")}
      />
      <TextField
        id="sign-in-password"
        label={t("password")}
        type="password"
        autoComplete="current-password"
        value={screen.password}
        onChange={(event) => screen.setPassword(event.target.value)}
        error={screen.errorFor("password")}
      />

      {screen.failure ? (
        <Notice kind="error" live>
          {screen.failure}
        </Notice>
      ) : null}
    </AuthShell>
  );
}
