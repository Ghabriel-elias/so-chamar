"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { digitsOnly, formatPhone } from "@/utils/format/phone";
import { Link } from "@/utils/navigation";

import { useSignUp } from "./useSignUp";

export function SignUpForm() {
  const t = useTranslations("auth");
  const screen = useSignUp();

  return (
    <AuthShell
      title={t("signUpTitle")}
      formId="sign-up"
      onSubmit={screen.submit}
      problems={screen.problems}
      footer={
        <>
          {t("hasAccount")}{" "}
          <Link
            href="/entrar"
            className="font-medium text-blue underline underline-offset-4"
          >
            {t("signInLink")}
          </Link>
        </>
      }
      action={
        <Button
          type="submit"
          form="sign-up"
          look="primary"
          fullWidth
          icon={ArrowRight}
          loading={screen.busy}
        >
          {t("signUp")}
        </Button>
      }
    >
      <TextField
        id="sign-up-name"
        label={t("name")}
        hint={t("nameHint")}
        autoComplete="name"
        value={screen.name}
        onChange={(event) => screen.setName(event.target.value)}
        error={screen.errorFor("name")}
      />
      <TextField
        id="sign-up-phone"
        label={t("phone")}
        hint={t("phoneHint")}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={formatPhone(screen.phone)}
        onChange={(event) => screen.setPhone(digitsOnly(event.target.value))}
        error={screen.errorFor("phone")}
      />
      <TextField
        id="sign-up-password"
        label={t("password")}
        hint={t("passwordHint")}
        type="password"
        autoComplete="new-password"
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
