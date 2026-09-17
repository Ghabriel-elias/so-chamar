"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAddressForm } from "@/utils/address/form";
import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { useServices, useSession } from "@/utils/api/queries";
import { computeAmounts } from "@/utils/booking/money";
import { clampDeposit } from "@/utils/booking/rules";
import {
  goToField,
  hasErrors,
  problemsFrom,
  type FieldErrors,
  type FieldSpec,
} from "@/utils/forms/problems";
import { useRouter } from "@/utils/navigation";
import {
  customerDetailsSchema,
  fieldErrors,
} from "@/utils/validation/booking";
import type { DepositMode } from "@/types/booking";
import type { StepDirection } from "@/utils/motion/step-arrival";

const STEP_FIELDS: Record<number, string[]> = {
  1: ["service"],
  2: ["slot"],
  3: ["customerName", "customerPhone", "problemDescription"],
  4: ["cep", "street", "number", "complement", "neighbourhood", "city", "state"],
  5: [],
};

export function useNewBooking() {
  const tError = useTranslations("errors");
  const tField = useTranslations("fieldNames");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<StepDirection>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<string | undefined>();
  const [chosenMode, setMode] = useState<DepositMode | null>(null);
  const [values, setValues] = useState({
    customerName: "",
    customerPhone: "",
    problemDescription: "",
  });
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const address = useAddressForm(
    {},
    { onModeSwitch: () => setAttempted(false) },
  );

  const servicesQuery = useServices();
  const sessionQuery = useSession();
  const loading = servicesQuery.loading || sessionQuery.loading;

  const services = [...(servicesQuery.data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
  const provider = sessionQuery.data ?? null;
  const service = services.find((item) => item.id === serviceId) ?? null;

  const collectsDeposit = provider?.collectsDeposit ?? true;
  const mode: DepositMode =
    chosenMode ?? (collectsDeposit ? "with_deposit" : "pay_direct");
  const percent = clampDeposit(provider?.depositPercent ?? 30);

  const composed = address.compose();
  const parsed = customerDetailsSchema.safeParse({
    ...values,
    address: composed?.address ?? "",
  });

  const found: FieldErrors = !service
    ? { service: "serviceRequired" }
    : {
        slot: startsAt ? null : "slotRequired",
        ...(parsed.success ? {} : fieldErrors(parsed.error)),
        ...address.issues,
      };

  const fields: FieldSpec[] = [
    {
      key: "service",
      name: tField("service"),
      target: "new-service",
      empty: true,
    },
    { key: "slot", name: tField("slot"), target: "new-slots", empty: true },
    {
      key: "customerName",
      name: tField("name"),
      target: "new-name",
      empty: !values.customerName.trim(),
    },
    {
      key: "customerPhone",
      name: tField("phone"),
      target: "new-phone",
      empty: !values.customerPhone.trim(),
    },
    ...address.fields,
    {
      key: "problemDescription",
      name: tField("problem"),
      target: "new-problem",
      empty: !values.problemDescription.trim(),
    },
  ];

  const errors: FieldErrors = attempted ? found : {};

  const fieldsOf = (which: number) =>
    fields.filter((item) => STEP_FIELDS[which].includes(item.key));

  const stepOf = (key: string) =>
    Number(
      Object.keys(STEP_FIELDS).find((which) =>
        STEP_FIELDS[Number(which)].includes(key),
      ) ?? step,
    );

  function go(next: number, showProblems = false) {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
    setAttempted(showProblems);
    window.scrollTo({ top: 0 });
  }

  function forward() {
    const missing = problemsFrom(found, fieldsOf(step));
    if (missing.length > 0) {
      setAttempted(true);
      goToField(missing[0].target);
      return;
    }
    go(step + 1);
  }

  async function submit() {
    if (!service || !startsAt || !parsed.success || hasErrors(found)) {
      const first = fields.find((item) => Boolean(found[item.key]));
      if (first) {
        const owner = stepOf(first.key);
        if (owner === step) setAttempted(true);
        else go(owner, true);
        goToField(first.target);
      }
      return;
    }

    setSaving(true);
    setFailure(null);

    try {
      const booking = await api.createManualBooking({
        serviceId: service.id,
        startsAt,
        ...parsed.data,
        depositMode: mode,
        depositPercent: percent,
      });

      router.replace(`/painel/agendamentos/${booking.id}`);
    } catch (problem) {
      setFailure(messageFrom(problem));
      setSaving(false);
    }
  }

  return {
    loading,
    step,
    direction,
    go,
    forward,
    submit,
    services,
    provider,
    service,
    serviceId,
    setServiceId,
    startsAt,
    setStartsAt,
    collectsDeposit,
    mode,
    setMode,
    percent,
    amounts: service
      ? computeAmounts({
          price: service.priceFrom,
          depositPercent: percent,
          depositMode: mode,
        })
      : null,
    address,
    values,
    set: (field: keyof typeof values, value: string) =>
      setValues((previous) => ({ ...previous, [field]: value })),
    saving,
    failure,
    problemsOf: (which: number) => problemsFrom(errors, fieldsOf(which)),
    errorFor: (field: string) =>
      errors[field] ? tError(errors[field] as string) : undefined,
  };
}
