"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { isValidPhone } from "@/utils/format/phone";
import {
  goToField,
  hasErrors,
  problemsFrom,
  type FieldErrors,
  type FieldSpec,
} from "@/utils/forms/problems";
import { useRouter } from "@/utils/navigation";

export function useSignIn() {
  const t = useTranslations("auth");
  const tError = useTranslations("errors");
  const tField = useTranslations("fieldNames");
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const found: FieldErrors = {
    phone: !phone ? "phoneRequired" : isValidPhone(phone) ? null : "phoneShort",
    password: password ? null : "passwordRequired",
  };

  const fields: FieldSpec[] = [
    {
      key: "phone",
      name: tField("phone"),
      target: "sign-in-phone",
      empty: !phone,
    },
    {
      key: "password",
      name: tField("password"),
      target: "sign-in-password",
      empty: !password,
    },
  ];

  const errors = attempted ? found : {};

  async function submit() {
    if (busy) return;

    if (hasErrors(found)) {
      setAttempted(true);
      goToField(problemsFrom(found, fields)[0]?.target);
      return;
    }

    setBusy(true);
    setFailure(null);

    try {
      const provider = await api.signIn({ phone, password });
      if (!provider) {
        setFailure(t("wrongCredentials"));
        return;
      }
      router.replace("/painel");
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setBusy(false);
    }
  }

  return {
    phone,
    setPhone,
    password,
    setPassword,
    busy,
    failure,
    problems: problemsFrom(errors, fields),
    errorFor: (key: string) =>
      errors[key] ? tError(errors[key] as string) : undefined,
    submit,
  };
}
