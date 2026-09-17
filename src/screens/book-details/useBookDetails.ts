"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { useAddressForm } from "@/utils/address/form";
import { api } from "@/utils/api";
import { useCustomerLookup } from "@/utils/api/queries";
import { useDraft } from "@/utils/booking/draft";
import { digitsOnly } from "@/utils/format/phone";
import {
  goToField,
  hasErrors,
  problemsFrom,
  type FieldErrors,
  type FieldSpec,
} from "@/utils/forms/problems";
import { useStepArrival } from "@/utils/motion/step-arrival";
import { useRouter } from "@/utils/navigation";
import {
  contactSchema,
  fieldErrors,
  problemSchema,
} from "@/utils/validation/booking";

export function useBookDetails(slug: string) {
  const tError = useTranslations("errors");
  const tField = useTranslations("fieldNames");
  const router = useRouter();
  const { draft, update } = useDraft();
  const arrival = useStepArrival("booking", 2);

  const [values, setValues] = useState({
    customerName: draft.customerName ?? "",
    customerPhone: draft.customerPhone ?? "",
  });
  const [problem, setProblem] = useState(draft.problemDescription ?? "");
  const [attempted, setAttempted] = useState(false);
  const [resend, setResend] = useState<"idle" | "sending" | "sent">("idle");

  const address = useAddressForm(
    {
      mode: draft.addressMode,
      cep: draft.cep,
      street: draft.street,
      number: draft.number,
      complement: draft.complement,
      neighbourhood: draft.neighbourhood,
      city: draft.city,
      state: draft.state,
    },
    { onModeSwitch: () => setAttempted(false) },
  );

  const phoneDigits = digitsOnly(values.customerPhone);
  const complete = phoneDigits.length === 11;
  const lookup = useCustomerLookup(complete ? phoneDigits : undefined);
  const pending = complete ? (lookup.data?.pendingPayment ?? null) : null;

  const contact = contactSchema.safeParse(values);
  const said = problemSchema.safeParse({ problemDescription: problem });

  const found: FieldErrors = {
    ...(contact.success ? {} : fieldErrors(contact.error)),
    ...address.issues,
    ...(said.success ? {} : fieldErrors(said.error)),
  };
  if (phoneDigits.length === 0) found.customerPhone = "phoneRequired";

  const fields: FieldSpec[] = [
    {
      key: "customerName",
      name: tField("name"),
      target: "details-name",
      empty: !values.customerName.trim(),
    },
    {
      key: "customerPhone",
      name: tField("phone"),
      target: "details-phone",
      empty: phoneDigits.length === 0,
    },
    ...address.fields,
    {
      key: "problemDescription",
      name: tField("problem"),
      target: "problem-description",
      empty: !problem.trim(),
    },
  ];

  const errors: FieldErrors = attempted ? found : {};

  async function sendLink() {
    setResend("sending");
    try {
      const { sent } = await api.resendPaymentLink(phoneDigits);
      setResend(sent ? "sent" : "idle");
    } catch {
      setResend("idle");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (address.searching) return;

    if (!contact.success || !said.success || hasErrors(found)) {
      setAttempted(true);
      goToField(problemsFrom(found, fields)[0]?.target);
      return;
    }

    const done = address.compose();
    if (!done) return;

    update({
      ...contact.data,
      ...said.data,
      ...done.parts,
      cep: done.cep,
      addressMode: done.mode,
      address: done.address,
    });
    router.push(`/${slug}/agendar/resumo`);
  }

  return {
    draft,
    arrival,
    address,
    values,
    set: (field: keyof typeof values, value: string) =>
      setValues((previous) => ({ ...previous, [field]: value })),
    problem,
    setProblem,
    pending,
    resend,
    sendLink,
    problems: problemsFrom(errors, fields),
    errorFor: (field: string) =>
      errors[field] ? tError(errors[field] as string) : undefined,
    backToTime: draft.serviceId
      ? `/${slug}/agendar/horario?servico=${draft.serviceId}`
      : `/${slug}/agendar/horario`,
    submit,
  };
}
