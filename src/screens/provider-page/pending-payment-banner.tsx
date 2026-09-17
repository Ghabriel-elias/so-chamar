"use client";

import { Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { Locale } from "@/i18n/config";
import { useBookingByToken } from "@/utils/api/queries";
import {
  forgetPendingPayment,
  readPendingPayment,
} from "@/utils/booking/pending-payment";
import { paymentWindowOver } from "@/utils/booking/rules";
import { dayAndTime, time } from "@/utils/format/date";

export function PendingPaymentBanner({ slug }: { slug: string }) {
  const t = useTranslations("pendingPayment");
  const locale = useLocale() as Locale;

  const [remembered] = useState(() => readPendingPayment());
  const mine = remembered?.slug === slug ? remembered : null;

  const { data, loading } = useBookingByToken(mine?.token ?? "", {
    enabled: Boolean(mine),
  });

  const booking = data?.booking;
  const stillPending =
    booking?.state === "pending_payment" &&
    booking.paymentDueAt !== undefined &&
    !paymentWindowOver(booking.paymentDueAt);

  useEffect(() => {
    if (mine && !loading && !stillPending) forgetPendingPayment();
  }, [mine, loading, stillPending]);

  if (!mine || !data || !booking?.paymentDueAt || !stillPending) return null;

  return (
    <Notice
      kind="attention"
      title={t("title")}
      live
      className="on-attention mt-6"
    >
      {t("body", {
        service: data.service.name,
        when: dayAndTime(new Date(booking.startsAt), locale),
        time: time(new Date(booking.paymentDueAt), locale),
      })}
      <ButtonLink
        look="primary"
        icon={Wallet}
        fullWidth
        href={`/a/${mine.token}/pagar`}
        className="mt-3"
      >
        {t("continue")}
      </ButtonLink>
    </Notice>
  );
}
