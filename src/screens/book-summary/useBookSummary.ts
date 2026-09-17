"use client";

import { useState } from "react";

import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { useCustomerLookup, usePublicPage } from "@/utils/api/queries";
import { clearDraft, useDraft } from "@/utils/booking/draft";
import { computeAmounts } from "@/utils/booking/money";
import { rememberPendingPayment } from "@/utils/booking/pending-payment";
import {
  cancellationRefundsAll,
  HOURS_FREE_CANCELLATION,
} from "@/utils/booking/rules";
import { useStepArrival } from "@/utils/motion/step-arrival";
import { useRouter } from "@/utils/navigation";
import { HOUR } from "@/utils/time/clock";

export function useBookSummary(slug: string) {
  const router = useRouter();
  const { draft } = useDraft();
  const arrival = useStepArrival("booking", 3);

  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const pageQuery = usePublicPage(slug);
  const customerQuery = useCustomerLookup(draft.customerPhone);

  const loading =
    Boolean(draft.customerPhone) &&
    (pageQuery.loading || customerQuery.loading);

  const page = draft.customerPhone && !loading ? pageQuery.data : null;
  const customer = customerQuery.data ?? {
    customer: null,
    mustPayInFull: false,
    pendingPayment: null,
  };
  const service = page?.services.find((item) => item.id === draft.serviceId);

  const ready = Boolean(
    page && service && draft.startsAt && draft.customerName && draft.address,
  );

  const direct = !page?.provider.collectsDeposit;
  const mustPayInFull = !direct && customer.mustPayInFull;
  const percent = mustPayInFull ? 100 : (page?.provider.depositPercent ?? 0);

  const amounts = computeAmounts({
    price: service?.priceFrom ?? 0,
    depositPercent: percent,
    depositMode: direct ? "pay_direct" : "with_deposit",
  });

  const startsAt = draft.startsAt ? new Date(draft.startsAt) : new Date();

  async function confirm() {
    if (!page || !service || !draft.startsAt) return;

    setSaving(true);
    setFailure(null);

    try {
      const { booking: created, customerToken } = await api.createPublicBooking({
        providerId: page.provider.id,
        serviceId: service.id,
        startsAt: draft.startsAt,
        customerName: draft.customerName ?? "",
        customerPhone: draft.customerPhone ?? "",
        address: draft.address ?? "",
        problemDescription: draft.problemDescription ?? "",
      });

      clearDraft();

      if (created.depositMode !== "with_deposit") {
        router.replace(`/a/${customerToken}`);
        return;
      }

      rememberPendingPayment({
        token: customerToken,
        slug,
        dueAt: created.paymentDueAt,
      });
      router.replace(`/a/${customerToken}/pagar`);
    } catch (problem) {
      setFailure(messageFrom(problem));
      setSaving(false);
    }
  }

  return {
    draft,
    arrival,
    loading,
    ready,
    page,
    service,
    direct,
    mustPayInFull,
    percent,
    amounts,
    startsAt,
    refundsAll: draft.startsAt ? cancellationRefundsAll(draft.startsAt) : true,
    deadline: new Date(startsAt.getTime() - HOURS_FREE_CANCELLATION * HOUR),
    saving,
    failure,
    confirm,
  };
}
