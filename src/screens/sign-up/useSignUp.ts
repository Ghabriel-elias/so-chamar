"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { api, ApiError } from "@/utils/api";
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

export function useSignUp() {
  const t = useTranslations("auth");
  const tError = useTranslations("errors");
  const tField = useTranslations("fieldNames");
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const found: FieldErrors = {
    name: name.trim().length >= 2 ? null : "nameShort",
    phone: !phone ? "phoneRequired" : isValidPhone(phone) ? null : "phoneShort",
    password: !password
      ? "passwordRequired"
      : password.length >= 6
        ? null
        : "passwordShort",
  };

  const fields: FieldSpec[] = [
    {
      key: "name",
      name: tField("name"),
      target: "sign-up-name",
      empty: !name.trim(),
    },
    {
      key: "phone",
      name: tField("phone"),
      target: "sign-up-phone",
      empty: !phone,
    },
    {
      key: "password",
      name: tField("password"),
      target: "sign-up-password",
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
      await api.signUp({
        name: name.trim(),
        phone,
        password,
        collectsDeposit: true,
      });
      router.replace("/comecar");
    } catch (problem) {
      setFailure(
        problem instanceof ApiError && problem.code === "conflict"
          ? t("phoneTaken")
          : messageFrom(problem),
      );
      setBusy(false);
    }
  }

  return {
    name,
    setName,
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
