"use client";

import { useLocale, useTranslations } from "next-intl";

import { Amount } from "@/components/ui/amount";
import { Header } from "@/components/ui/header";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Link } from "@/utils/navigation";
import type { MoneyEntry } from "@/utils/api/contract";
import type { MoneyEntryKind } from "@/utils/booking/money";
import { walletHref, walletListHref } from "@/utils/booking/wallet";
import { withBack } from "@/utils/panel/back";
import { cn } from "@/utils/cn";
import { dayParts, monthAndYear, time } from "@/utils/format/date";
import type { Locale } from "@/i18n/config";

import { useWalletList } from "./useWalletList";

export function MoneyEntriesView({ kind }: { kind: MoneyEntryKind }) {
  const t = useTranslations("panel.moneyList");
  const locale = useLocale() as Locale;

  const screen = useWalletList(kind);

  if (screen.loading) return <ListSkeleton rows={4} className="mt-5" />;

  if (!screen.report || !screen.list) {
    return (
      <Notice kind="error" live className="mt-6">
        {screen.error ?? t("failed")}
      </Notice>
    );
  }

  const { monthly, pastMonth, total, list } = screen;
  const shown = monthAndYear(screen.report.month, locale);
  const onMonth = screen.report.month;

  return (
    <>
      <Header
        title={t(`title_${kind}` as "title_received")}
        subtitle={
          monthly
            ? t("inMonth", { month: shown })
            : t(`subtitle_${kind}` as "subtitle_held")
        }
        backTo={walletHref(pastMonth ? screen.report.month : undefined)}
      />

      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <span className="text-body text-gray">
          {t("count", { count: list.length })}
        </span>
        <Amount
          cents={total}
          size="lead"
          className={kind === "received" ? "text-green" : "text-ink"}
        />
      </div>

      {list.length === 0 ? (
        <Notice kind="info" className="mt-4 mb-8">
          {t(`empty_${kind}` as "empty_received", { month: shown })}
        </Notice>
      ) : (
        <ul className="mt-4 mb-8 flex flex-col gap-2">
          {list.map((entry, index) => (
            <EntryRow
              key={entry.booking.id}
              entry={entry}
              kind={kind}
              month={monthly && pastMonth ? onMonth : undefined}
              index={index}
            />
          ))}
        </ul>
      )}
    </>
  );
}

const KIND_BAR: Record<MoneyEntryKind, string> = {
  received: "bg-green",
  held: "bg-blue",
  incoming: "bg-yellow",
  refunded: "bg-gray",
  no_shows: "bg-red",
};

function EntryRow({
  entry,
  kind,
  month,
  index,
}: {
  entry: MoneyEntry;
  kind: MoneyEntryKind;
  month?: string;
  index: number;
}) {
  const t = useTranslations("panel.moneyList");
  const tState = useTranslations("stateProvider");
  const locale = useLocale() as Locale;

  const at = new Date(entry.at);
  const when = dayParts(at, locale);

  const kinds = new Set(entry.payments.map((payment) => payment.kind));
  const part =
    entry.booking.depositMode === "no_deposit"
      ? "total"
      : kinds.has("deposit") && kinds.has("balance")
        ? "both"
        : kinds.has("deposit")
          ? "deposit"
          : "balance";
  const methods = [
    ...new Set(
      entry.payments.flatMap((payment) =>
        payment.method ? [payment.method] : [],
      ),
    ),
  ]
    .map((method) => t(`method_${method}` as "method_pix"))
    .join(", ");
  const withMethods = (text: string) =>
    methods ? `${text} · ${methods}` : text;
  const outside = entry.payments.some((payment) => payment.outsideApp);

  const detail = (() => {
    switch (kind) {
      case "received":
        return outside
          ? t("outside")
          : withMethods(t(`what_${part}` as "what_both"));
      case "held":
        return kinds.has("balance") ? t("heldBoth") : t("heldDeposit");
      case "incoming":
        return entry.booking.state === "finished"
          ? t("incomingFinished")
          : t("incomingScheduled");
      case "refunded":
        return withMethods(
          tState(entry.booking.state as "cancelled_by_customer"),
        );
      case "no_shows":
        return entry.amount > 0 ? t("noShowKept") : t("noShowNothing");
    }
  })();

  return (
    <li
      style={{ "--index": Math.min(index, 8) } as React.CSSProperties}
      className="stagger touchable relative flex overflow-hidden rounded-card border border-border bg-white shadow-soft hover:border-border-strong"
    >
      <div className="flex w-12 shrink-0 flex-col items-end py-3 pl-3">
        <p className="tabular text-body font-semibold text-ink">{when.day}</p>
        <p className="tabular text-note text-gray">{when.month}</p>
        {kind === "incoming" || kind === "no_shows" ? (
          <p className="tabular text-note text-gray">{time(at, locale)}</p>
        ) : null}
      </div>

      <span
        aria-hidden="true"
        className={cn("my-3 ml-3 w-1 shrink-0 rounded-full", KIND_BAR[kind])}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1 py-3 pr-3 pl-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="min-w-0 truncate text-body font-semibold text-ink">
            <Link
              href={withBack(
                `/painel/agendamentos/${entry.booking.id}`,
                walletListHref(kind, month),
              )}
              className="rounded-card after:absolute after:inset-0 after:content-['']"
            >
              {entry.booking.customerName}
            </Link>
          </h2>
          <Amount
            cents={entry.amount}
            className={cn(
              "shrink-0 font-semibold",
              kind === "received" ? "text-green" : "text-ink",
            )}
          />
        </div>

        <p className="text-note text-gray">{entry.service.name}</p>
        <p className="text-note text-gray">{detail}</p>
      </div>
    </li>
  );
}
