"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

import { PanelShell } from "@/components/panel/panel-shell";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";
import { BookingDetailView } from "@/screens/booking-detail";
import { CustomerDetails } from "@/screens/book-details";
import { BookingSummary } from "@/screens/book-summary";
import { PickTime } from "@/screens/book-time";
import { CustomerHub } from "@/screens/customer";
import { PaymentScreen } from "@/screens/customer-payment";
import { LeaveReview } from "@/screens/customer-review";
import { ProviderPage } from "@/screens/provider-page";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const subscribe = () => () => {};

function pathNow() {
  const path = window.location.pathname;
  const clean = BASE && path.startsWith(BASE) ? path.slice(BASE.length) : path;
  return clean.replace(/\/+$/, "") || "/";
}

function Customer({ parts }: { parts: string[] }) {
  const [, token, page] = parts;

  return (
    <main className={`mx-auto max-w-160 px-gutter${page ? " pb-4" : ""}`}>
      {page === "pagar" ? (
        <PaymentScreen token={token} />
      ) : page === "avaliar" ? (
        <LeaveReview token={token} />
      ) : (
        <CustomerHub token={token} />
      )}
    </main>
  );
}

function Booking({ parts }: { parts: string[] }) {
  const [slug, , step] = parts;

  return (
    <main className="mx-auto max-w-160 px-gutter pb-4">
      {step === "dados" ? (
        <CustomerDetails slug={slug} />
      ) : step === "resumo" ? (
        <BookingSummary slug={slug} />
      ) : (
        <PickTime slug={slug} />
      )}
    </main>
  );
}

function pick(path: string) {
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "a" && parts[1]) return <Customer parts={parts} />;

  if (parts[0] === "painel" && parts[1] === "agendamentos" && parts[2]) {
    return (
      <main>
        <PanelShell>
          <BookingDetailView id={parts[2]} />
        </PanelShell>
      </main>
    );
  }

  if (parts.length === 1) {
    return (
      <main className="mx-auto max-w-160 px-gutter">
        <ProviderPage slug={parts[0]} />
      </main>
    );
  }

  if (parts[1] === "agendar") return <Booking parts={parts} />;

  return null;
}

function Missing() {
  const t = useTranslations("notFound");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-136 px-gutter pb-16 pt-10">
        <h1 className="text-display">{t("title")}</h1>
        <p className="mt-3 text-lead text-gray">{t("body")}</p>
        <ButtonLink look="primary" href="/" className="mt-8">
          {t("home")}
        </ButtonLink>
      </main>
    </>
  );
}

export default function NotFound() {
  const path = useSyncExternalStore(
    subscribe,
    pathNow,
    () => "/",
  );

  if (path === "/") return <Missing />;

  return pick(path) ?? <Missing />;
}
