"use client";

import { Check, ChevronLeft, ChevronRight, Info, UserX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Amount } from "@/components/ui/amount";
import { InfoDialog } from "@/components/ui/dialog";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Link } from "@/utils/navigation";
import type { MoneyEntryKind } from "@/utils/booking/money";
import { DEFAULT_DEPOSIT } from "@/utils/booking/rules";
import { walletListHref } from "@/utils/booking/wallet";
import { cn } from "@/utils/cn";
import { depositOf } from "@/utils/format/currency";
import { monthAndYear, upperFirst } from "@/utils/format/date";
import type { Locale } from "@/i18n/config";
import type { Cents } from "@/types/booking";

import { useWallet } from "./useWallet";

const EXAMPLE_PRICE = 20000;
const exampleDeposit = depositOf(EXAMPLE_PRICE, DEFAULT_DEPOSIT);

const INFO_BUTTON = "money-flow-info";

function MonthArrow({
  side,
  href,
  label,
}: {
  side: "back" | "ahead";
  href: string | null;
  label: string;
}) {
  const Icon = side === "back" ? ChevronLeft : ChevronRight;
  const look = "flex size-10 shrink-0 items-center justify-center rounded-full";

  if (!href) {
    return (
      <span aria-hidden="true" className={cn(look, "text-border-strong/50")}>
        <Icon className="size-5" />
      </span>
    );
  }

  return (
    <Link
      replace
      href={href}
      aria-label={label}
      className={cn(
        look,
        "touchable text-gray hover:bg-surface hover:text-ink active:bg-surface",
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
    </Link>
  );
}

export function MoneyView() {
  const t = useTranslations("panel.money");
  const locale = useLocale() as Locale;

  const screen = useWallet();
  const { loading, error, flowOpen, flowHidden, gotIt, setGotIt } = screen;

  if (loading) {
    return (
      <div className="mt-5 flex flex-col gap-5">
        <Skeleton className="h-28 rounded-card" />
        <ListSkeleton rows={3} />
      </div>
    );
  }

  const data = screen.report;

  if (error || !data) {
    return (
      <Notice kind="error" live className="mt-6">
        {error ?? t("failed")}
      </Notice>
    );
  }

  const { current, previous, next, hrefFor, listMonth } = screen;
  const shown = monthAndYear(data.month, locale);

  const rows: Array<{
    kind: MoneyEntryKind;
    label: string;
    amount: Cents;
    hint: string;
    tone?: string;
  }> = [
    {
      kind: "received",
      label: t("received"),
      amount: data.received,
      hint: t("jobsCount", { count: data.counts.received }),
      tone: "text-green",
    },
    ...(current
      ? [
          {
            kind: "held" as const,
            label: t("held"),
            amount: data.held,
            hint: t("jobsNow", { count: data.counts.held }),
          },
          {
            kind: "incoming" as const,
            label: t("incoming"),
            amount: data.incoming,
            hint: t("jobsNow", { count: data.counts.incoming }),
          },
        ]
      : []),
    {
      kind: "refunded",
      label: t("refunded"),
      amount: data.refunded,
      hint: t("jobsCount", { count: data.counts.refunded }),
    },
  ];

  const noShows: ReactNode = (
    <>
      <UserX aria-hidden="true" className="mt-1 size-6 shrink-0 text-red" />
      <span className="min-w-0 flex-1">
        <span className="block text-lead text-ink">
          {t("noShows", { count: data.customerNoShows })}
        </span>
        {data.customerNoShows > 0 ? (
          <span className="mt-1 block text-note text-gray">
            {t("noShowsNote")}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <>
      <header className="animate-rise pt-6">
        <h1 className="text-title">{t("title")}</h1>
      </header>

      <nav
        aria-label={t("monthsLabel")}
        className="mt-4 flex items-center justify-between gap-2"
      >
        <MonthArrow
          side="back"
          href={previous ? hrefFor(previous) : null}
          label={
            previous
              ? t("previousMonth", { month: monthAndYear(previous, locale) })
              : ""
          }
        />

        <p className="text-body font-semibold text-ink">{upperFirst(shown)}</p>

        <MonthArrow
          side="ahead"
          href={next ? hrefFor(next) : null}
          label={
            next ? t("nextMonth", { month: monthAndYear(next, locale) }) : ""
          }
        />
      </nav>

      <div className="carbon animate-pop mt-4 rounded-card bg-ink px-5 py-4 text-paper">
        <div className="flex items-start justify-between gap-3">
          <p className="text-note text-surface">{t("received")}</p>
          {
            <button
              id={INFO_BUTTON}
              type="button"
              aria-label={t("flowTitle")}
              aria-haspopup="dialog"
              onClick={screen.openFlow}
              className="touchable -mt-3 -mr-3 flex size-12 shrink-0 items-center justify-center rounded-full text-surface hover:bg-white/10 active:bg-white/20"
            >
              <Info aria-hidden="true" className="size-6" />
            </button>
          }
        </div>
        <p className="text-green-bright">
          <Amount cents={data.received} size="display" />
        </p>
      </div>

      <Sheet className="mt-4">
        <SheetHeader
          title={
            current
              ? t("monthDetail")
              : t("monthDetailPast", { month: upperFirst(shown) })
          }
        />
        <SheetBody>
          <ul>
            {rows.map((row) => (
              <li
                key={row.kind}
                className="border-b border-border last:border-b-0"
              >
                <Link
                  href={walletListHref(
                    row.kind,
                    row.kind === "held" || row.kind === "incoming"
                      ? undefined
                      : listMonth,
                  )}
                  className="touchable -mx-2 flex min-h-touch items-center gap-3 rounded-card px-2 py-3 hover:bg-paper active:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-body text-ink">
                      {row.label}
                    </span>
                    <span className="block text-note text-gray">
                      {row.hint}
                    </span>
                  </span>
                  <Amount
                    cents={row.amount}
                    className={row.tone ?? "text-ink"}
                  />
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-gray"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </SheetBody>
      </Sheet>

      <Sheet className="mt-4 mb-8">
        {data.customerNoShows > 0 ? (
          <Link
            href={walletListHref("no_shows", listMonth)}
            className="touchable flex items-start gap-3 p-4 hover:bg-paper active:bg-surface"
          >
            {noShows}
            <ChevronRight
              aria-hidden="true"
              className="size-5 shrink-0 self-center text-gray"
            />
          </Link>
        ) : (
          <SheetBody className="flex items-start gap-3">{noShows}</SheetBody>
        )}
      </Sheet>

      <InfoDialog
        open={flowOpen}
        title={t("flowTitle")}
        closeLabel={t("flowClose")}
        returnFocusId={INFO_BUTTON}
        onClose={screen.closeFlow}
      >
        <MoneyFlow />

        {flowHidden ? null : (
          <button
            type="button"
            role="checkbox"
            aria-checked={gotIt}
            onClick={() => setGotIt((was) => !was)}
            className="touchable mt-5 flex min-h-touch w-full items-center gap-3 rounded-card py-1 text-left active:bg-surface"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-sm border transition-colors duration-150",
                gotIt
                  ? "border-action bg-action text-white"
                  : "border-border bg-white",
              )}
            >
              {gotIt ? <Check className="size-4 animate-check" /> : null}
            </span>
            <span className="text-body text-ink">{t("flowHide")}</span>
          </button>
        )}
      </InfoDialog>
    </>
  );
}

function MoneyFlow() {
  const t = useTranslations("panel.money");

  const steps = [
    {
      title: t("held"),
      body: t("heldExplained"),
      dot: "border-blue bg-blue-soft text-blue",
    },
    {
      title: t("incoming"),
      body: t("incomingExplained"),
      dot: "border-orange bg-yellow-soft text-ink",
    },
    {
      title: t("received"),
      body: t("receivedExplained"),
      dot: "border-green bg-green-soft text-green",
    },
  ];

  return (
    <div>
      <ol data-money-flow className="flex flex-col">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-0 left-4 w-0.5 -translate-x-1/2 bg-border"
              />
            ) : null}
            <span
              aria-hidden="true"
              data-step-dot
              className={cn(
                "tabular flex size-8 shrink-0 items-center justify-center rounded-full border text-note font-semibold",
                step.dot,
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p data-step-title className="text-body font-semibold text-ink">
                {step.title}
              </p>
              <p className="mt-0.5 text-note text-gray">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 rounded-card bg-surface px-3 py-2 text-note text-ink">
        {t("flowExample", {
          total: EXAMPLE_PRICE / 100,
          deposit: exampleDeposit / 100,
          rest: (EXAMPLE_PRICE - exampleDeposit) / 100,
        })}
      </p>
    </div>
  );
}
