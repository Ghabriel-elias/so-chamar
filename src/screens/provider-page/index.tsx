"use client";

import { CalendarCheck, Clock, MapPin, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { PendingPaymentBanner } from "./pending-payment-banner";
import { Avatar } from "@/components/provider/avatar";
import { ProviderWork } from "@/components/provider/provider-work";
import { Amount } from "@/components/ui/amount";
import { useDurationText } from "@/components/ui/duration";
import { ButtonLink } from "@/components/ui/button";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody } from "@/components/ui/sheet";
import { Stars } from "@/components/ui/stars";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { depositOf } from "@/utils/format/currency";
import type { Service } from "@/types/provider";

import { useProviderPage } from "./useProviderPage";

export function ProviderPage({ slug }: { slug: string }) {
  const t = useTranslations("publicPage");
  const { page, loading, error, tab, setTab, tabsSection, showReviews } =
    useProviderPage(slug);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <ListSkeleton rows={3} className="mt-4 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Notice kind="error" live className="mt-6">
        {error}
      </Notice>
    );
  }

  if (!page) {
    return (
      <Notice kind="attention" title={t("notFound")} className="mt-6">
        {t("notFoundBody")}
      </Notice>
    );
  }

  const { provider, stats, services, reviews, bookable } = page;

  return (
    <>
      <PendingPaymentBanner slug={slug} />

      <header className="animate-rise flex items-start gap-4 pt-8">
        <Avatar
          name={provider.name}
          photo={provider.photo}
          className="size-20 text-display"
        />

        <div className="min-w-0">
          <h1 className="text-title">{provider.name}</h1>
          <ProviderWork services={services} className="text-body text-gray" />
          {provider.city ? (
            <p className="mt-1 flex items-center gap-1 text-note text-gray">
              <MapPin aria-hidden="true" className="size-5 shrink-0" />
              {provider.city}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-2">
        <Stars
          rating={stats.rating}
          reviewCount={stats.reviewCount}
          onReviewsClick={showReviews}
        />
        <p className="flex items-center gap-2 text-note text-gray">
          <CalendarCheck aria-hidden="true" className="size-5 shrink-0" />
          {stats.showUpRate === null ? (
            t("newHere")
          ) : (
            <>
              {t("showUpRate", { rate: stats.showUpRate })} ·{" "}
              {t("jobsDone", { count: stats.jobCount })}
            </>
          )}
        </p>
      </div>

      {bookable ? null : (
        <Notice kind="attention" title={t("unavailableTitle")} className="mt-6">
          {t("unavailableBody", { provider: provider.name })}
        </Notice>
      )}

      <div ref={tabsSection} className="mt-10 scroll-mt-4 pb-16">
        <Tabs
          label={t("tabsLabel")}
          active={tab}
          onChange={setTab}
          items={[
            { id: "services", label: t("services"), count: services.length },
            { id: "reviews", label: t("reviews"), count: reviews.length },
          ]}
        />

        <TabPanel id="services" active={tab}>
          <ul className="mt-5 flex flex-col gap-3">
            {services.map((service, index) => (
              <ServiceRow
                key={service.id}
                slug={slug}
                service={service}
                collectsDeposit={provider.collectsDeposit}
                depositPercent={provider.depositPercent}
                bookable={bookable}
                index={index}
              />
            ))}
          </ul>
        </TabPanel>

        <TabPanel id="reviews" active={tab}>
          {reviews.length === 0 ? (
            <p className="mt-5 text-body text-gray">{t("noReviews")}</p>
          ) : (
            <ul className="mt-5 flex flex-col gap-3">
              {reviews.map((review, index) => (
                <li
                  key={review.id}
                  style={
                    { "--index": Math.min(index, 6) } as React.CSSProperties
                  }
                  className="stagger"
                >
                  <Sheet>
                    <SheetBody>
                      <Stars rating={review.rating} />
                      {review.comment ? (
                        <p className="mt-2 text-body text-ink">
                          {review.comment}
                        </p>
                      ) : null}
                      <p className="mt-2 text-note text-gray">
                        {review.author}
                      </p>
                    </SheetBody>
                  </Sheet>
                </li>
              ))}
            </ul>
          )}
        </TabPanel>
      </div>
    </>
  );
}

function ServiceRow({
  slug,
  service,
  collectsDeposit,
  depositPercent,
  bookable,
  index,
}: {
  slug: string;
  service: Service;
  collectsDeposit: boolean;
  depositPercent: number;
  bookable: boolean;
  index: number;
}) {
  const t = useTranslations("publicPage");
  const durationText = useDurationText();
  const deposit = depositOf(service.priceFrom, depositPercent);

  return (
    <li
      style={{ "--index": Math.min(index, 6) } as React.CSSProperties}
      className="stagger"
    >
      <Sheet className="transition-shadow duration-200 hover:shadow-lift">
        <SheetBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 text-lead">{service.name}</h3>
              <span className="mt-1 flex shrink-0 items-center gap-1 text-note text-gray">
                <Clock aria-hidden="true" className="size-4 shrink-0" />
                {durationText(service.durationMinutes)}
              </span>
            </div>

            <p className="flex items-baseline gap-2">
              <span className="text-note text-gray">{t("priceFrom")}</span>
              <Amount
                cents={service.priceFrom}
                size="lead"
                className="text-ink"
              />
            </p>
          </div>

          <div className="flex flex-col gap-1 rounded-card bg-surface px-3 py-2.5">
            <p className="flex items-start gap-2 text-body font-medium text-ink">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-green"
              />
              <span>
                {collectsDeposit
                  ? t("depositNow", { amount: deposit / 100 })
                  : t("noDepositNow")}
              </span>
            </p>
            <p className="pl-7 text-note text-gray">
              {collectsDeposit ? t("priceLater") : t("priceLaterDirect")}
            </p>
          </div>

          {bookable ? (
            <ButtonLink
              look="primary"
              fullWidth
              href={`/${slug}/agendar/horario?servico=${service.id}`}
            >
              {t("book")}
            </ButtonLink>
          ) : null}
        </SheetBody>
      </Sheet>
    </li>
  );
}
