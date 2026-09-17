"use client";

import {
  AirVent,
  ArrowRight,
  CalendarCheck,
  Car,
  CircleCheckBig,
  Clock,
  Droplets,
  HandCoins,
  Hammer,
  Hand,
  PaintRoller,
  Scissors,
  Sparkles,
  SprayCan,
  Sprout,
  Wallet,
  WashingMachine,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ProviderWork } from "@/components/provider/provider-work";
import { Amount } from "@/components/ui/amount";
import { ButtonLink } from "@/components/ui/button";
import { useDurationText } from "@/components/ui/duration";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Sheet, SheetBody } from "@/components/ui/sheet";
import { Stars } from "@/components/ui/stars";
import { Link } from "@/utils/navigation";
import { cn } from "@/utils/cn";
import { SITE_DOMAIN } from "@/utils/site";
import { MONTHLY_FEE_CENTS } from "@/utils/booking/rules";

import { useLanding } from "./useLanding";

const TRUST_KEYS = ["trust1", "trust2", "trust3"] as const;

const TRADE_TONES = {
  fix: "text-blue",
  home: "text-green",
  care: "text-orange",
  auto: "text-gray",
} as const;

const TRADES = [
  { key: "tradeAppliance", icon: WashingMachine, tone: "fix" },
  { key: "tradeAc", icon: AirVent, tone: "fix" },
  { key: "tradeElectrician", icon: Zap, tone: "fix" },
  { key: "tradePlumber", icon: Droplets, tone: "fix" },
  { key: "tradeMason", icon: Hammer, tone: "fix" },
  { key: "tradePainter", icon: PaintRoller, tone: "fix" },
  { key: "tradeCleaner", icon: SprayCan, tone: "home" },
  { key: "tradeGardener", icon: Sprout, tone: "home" },
  { key: "tradeHair", icon: Scissors, tone: "care" },
  { key: "tradeNails", icon: Hand, tone: "care" },
  { key: "tradeEsthetics", icon: Sparkles, tone: "care" },
  { key: "tradeMechanic", icon: Car, tone: "auto" },
] as const satisfies ReadonlyArray<{
  key: string;
  icon: LucideIcon;
  tone: keyof typeof TRADE_TONES;
}>;

const DEPOSIT_OPTIONS = [
  { key: "with", icon: Wallet, items: ["with1", "with2", "with3"] },
  { key: "without", icon: HandCoins, items: ["without1", "without2", "without3"] },
] as const;

export function Landing() {
  const t = useTranslations("landing");

  return (
    <>
      <section className="mx-auto max-w-5xl px-gutter pb-12 pt-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-20 lg:pt-16">
        <div className="animate-rise">
          <h1 className="text-[2rem] leading-[1.15] font-semibold text-ink lg:text-[2.75rem] lg:leading-[1.1]">
            {t("headline")}
          </h1>
          <p className="mt-5 max-w-lg text-lead text-gray">{t("subhead")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink look="primary" href="/cadastro" icon={ArrowRight}>
              {t("cta")}
            </ButtonLink>
            <ButtonLink look="secondary" href="/entrar">
              {t("ctaSecondary")}
            </ButtonLink>
          </div>

          <Trust className="mt-6" />
        </div>

        <div className="mt-12 lg:mt-0">
          <LivePreview />
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-5xl px-gutter py-12 lg:py-16">
          <h2 className="text-title">{t("problemTitle")}</h2>
          <p className="mt-3 max-w-3xl text-lead text-gray">
            {t("problemBody")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-gutter py-12 lg:py-16">
        <h2 className="text-title">{t("howTitle")}</h2>

        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { key: "step1", icon: CalendarCheck },
            { key: "step2", icon: Wallet },
            { key: "step3", icon: CircleCheckBig },
          ].map((step, index) => {
            const Icon = step.icon;

            return (
              <li
                key={step.key}
                style={{ "--index": index } as React.CSSProperties}
                className="stagger"
              >
                <Sheet className="h-full">
                  <SheetBody className="flex h-full flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex size-12 items-center justify-center rounded-full bg-blue-soft">
                        <Icon aria-hidden="true" className="size-6 text-blue" />
                      </span>
                      <span
                        aria-hidden="true"
                        className="tabular text-display leading-none font-semibold text-border"
                      >
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="text-lead">{t(`${step.key}Title`)}</h3>
                    <p className="text-body text-gray">{t(`${step.key}Body`)}</p>
                  </SheetBody>
                </Sheet>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-5xl px-gutter py-12 lg:py-16">
          <h2 className="text-title">{t("forWhoTitle")}</h2>
          <p className="mt-3 max-w-3xl text-lead text-gray">
            {t("forWhoLead")}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {TRADES.map((trade, index) => {
              const Icon = trade.icon;
              const tone = TRADE_TONES[trade.tone];

              return (
                <li
                  key={trade.key}
                  style={
                    { "--index": Math.min(index, 6) } as React.CSSProperties
                  }
                  className="stagger flex items-center gap-2 rounded-full border border-border bg-paper py-1.5 pr-3 pl-2.5 text-note text-ink"
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("size-4 shrink-0", tone)}
                  />
                  {t(trade.key)}
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-lead font-semibold text-ink">
            {t("forWhoClosing")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-gutter py-12 lg:py-16">
        <h2 className="text-title">{t("priceTitle")}</h2>

        <div className="carbon mt-6 rounded-card bg-ink p-6 text-paper lg:p-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div>
              <p className="text-note text-surface">{t("priceLabel")}</p>
              <p className="mt-1 text-green-bright">
                <Amount cents={MONTHLY_FEE_CENTS} size="money" />
              </p>
              <p className="mt-2 text-lead text-surface">
                {t("pricePerMonth")}
              </p>

              <ButtonLink
                look="primary"
                href="/cadastro"
                icon={ArrowRight}
                className="mt-6 w-full sm:w-auto"
              >
                {t("cta")}
              </ButtonLink>

              <p className="mt-3 text-note text-surface">{t("priceNote")}</p>
            </div>

            <ul className="flex flex-col gap-4 border-t border-gray pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
              {["price1", "price2", "price3", "price4"].map((key) => (
                <li key={key} className="flex items-start gap-3 text-body">
                  <CircleCheckBig
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-green-bright"
                  />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-title">{t("depositTitle")}</h3>
          <p className="mt-3 max-w-3xl text-lead text-gray">
            {t("depositLead")}
          </p>

          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {DEPOSIT_OPTIONS.map((option, index) => {
              const Icon = option.icon;

              return (
                <li
                  key={option.key}
                  style={{ "--index": index } as React.CSSProperties}
                  className="stagger"
                >
                  <Sheet className="h-full">
                    <SheetBody className="flex h-full flex-col gap-4">
                      <div className="flex flex-col items-start gap-3">
                        <span className="flex items-center gap-3">
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-soft">
                            <Icon
                              aria-hidden="true"
                              className="size-6 text-blue"
                            />
                          </span>
                          <span className="text-lead text-ink">
                            {t(`${option.key}Title`)}
                          </span>
                        </span>
                      </div>

                      <ul className="flex flex-col gap-3">
                        {option.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 text-body text-ink"
                          >
                            <CircleCheckBig
                              aria-hidden="true"
                              className="mt-1 size-5 shrink-0 text-green"
                            />
                            {t(item)}
                          </li>
                        ))}
                      </ul>
                    </SheetBody>
                  </Sheet>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-blue-soft">
        <div className="mx-auto max-w-5xl px-gutter py-14 text-center lg:py-20">
          <h2 className="mx-auto max-w-xl text-title lg:text-[2rem] lg:leading-[1.2]">
            {t("finalTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-lead text-gray">
            {t("finalBody")}
          </p>

          <ButtonLink
            look="primary"
            href="/cadastro"
            icon={ArrowRight}
            className="mt-8 w-full sm:w-auto"
          >
            {t("cta")}
          </ButtonLink>

          <Trust className="mt-6 justify-center" />
        </div>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-gutter py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-note text-gray">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>

          <nav
            aria-label={t("footerNav")}
            className="flex flex-col sm:flex-row sm:items-center sm:gap-6"
          >
            <Link
              href="/termos"
              className="inline-flex min-h-touch items-center text-note font-medium text-blue underline underline-offset-4 sm:min-h-0 sm:py-1"
            >
              {t("terms")}
            </Link>
            <Link
              href="/privacidade"
              className="inline-flex min-h-touch items-center text-note font-medium text-blue underline underline-offset-4 sm:min-h-0 sm:py-1"
            >
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

function Trust({ className }: { className?: string }) {
  const t = useTranslations("landing");

  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
      {TRUST_KEYS.map((key) => (
        <li key={key} className="flex items-center gap-2 text-note text-gray">
          <CircleCheckBig
            aria-hidden="true"
            className="size-4 shrink-0 text-green"
          />
          {t(key)}
        </li>
      ))}
    </ul>
  );
}

function LivePreview() {
  const t = useTranslations("landing");
  const durationText = useDurationText();
  const screen = useLanding();

  if (screen.loading) return <ListSkeleton rows={3} />;
  if (!screen.page || !screen.service) return null;

  const { provider, stats, services } = screen.page;
  const { service, deposit, firstName } = screen;

  return (
    <figure className="animate-pop">
      <Link
        href={`/${provider.slug}`}
        className="group mx-auto block max-w-sm rounded-lg border border-border-strong bg-paper p-4 shadow-lift transition-shadow hover:shadow-soft"
      >
        <p className="tabular text-note text-gray">
          {SITE_DOMAIN}/{provider.slug}
        </p>

        <div className="mt-3 flex items-start gap-3">
          <span
            aria-hidden="true"
            className="figures flex size-14 shrink-0 items-center justify-center rounded-card bg-ink text-title text-paper"
          >
            {provider.name
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")}
          </span>
          <div className="min-w-0">
            <p className="text-lead text-ink">{provider.name}</p>
            <ProviderWork services={services} className="text-note text-gray" />
          </div>
        </div>

        <div className="mt-3">
          <Stars rating={stats.rating} reviewCount={stats.reviewCount} />
        </div>

        <Sheet className="mt-4">
          <SheetBody className="flex flex-col gap-2">
            <p className="text-body font-medium text-ink">{service.name}</p>
            <p className="flex items-baseline gap-2">
              <Amount cents={service.priceFrom} size="lead" className="text-ink" />
              <span className="text-note text-gray">
                {durationText(service.durationMinutes)}
              </span>
            </p>
            <p className="flex items-start gap-2 text-note text-gray">
              <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              {t("previewDeposit", { amount: deposit / 100 })}
            </p>
          </SheetBody>
        </Sheet>

        <span className="touchable mt-4 flex min-h-touch items-center justify-center gap-2 rounded-full border border-action bg-action text-body font-semibold text-white group-hover:bg-action-pressed">
          {t("previewCta", { name: firstName })}
          <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
        </span>
      </Link>

      <figcaption className="mt-4 text-center text-body text-gray">
        {t("previewCaption", { name: firstName })}
      </figcaption>
    </figure>
  );
}
