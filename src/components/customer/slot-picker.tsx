"use client";

import { useLocale, useTranslations } from "next-intl";

import { ChipsSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { useOpenSlots } from "@/utils/api/queries";
import { cn } from "@/utils/cn";
import { longDay, time as formatTime } from "@/utils/format/date";
import { zonedDateKey } from "@/utils/time/zone";
import type { Locale } from "@/i18n/config";

export function SlotPicker({
  providerId,
  serviceId,
  selected,
  onPick,
  daysAhead = 14,
}: {
  providerId: string;
  serviceId: string;
  selected?: string;
  onPick: (startsAt: string) => void;
  daysAhead?: number;
}) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;

  const { data, loading, error } = useOpenSlots({
    providerId,
    serviceId,
    daysAhead,
  });

  if (loading) return <ChipsSkeleton count={10} className="mt-4" />;

  if (error) {
    return (
      <Notice kind="error" live>
        {error}
      </Notice>
    );
  }

  const slots = data ?? [];

  if (slots.length === 0) {
    return <Notice kind="attention">{t("noSlots")}</Notice>;
  }

  const days = new Map<string, string[]>();
  for (const slot of slots) {
    const key = zonedDateKey(new Date(slot.startsAt));
    days.set(key, [...(days.get(key) ?? []), slot.startsAt]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...days.entries()].map(([key, hours], dayIndex) => (
        <section
          key={key}
          style={{ "--index": Math.min(dayIndex, 6) } as React.CSSProperties}
          className="stagger"
        >
          <h3 className="text-body font-semibold text-ink first-letter:uppercase">
            {longDay(new Date(hours[0]), locale)}
          </h3>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {hours.map((startsAt) => {
              const chosen = selected === startsAt;

              return (
                <button
                  key={startsAt}
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => onPick(startsAt)}
                  className={cn(
                    "tabular touchable min-h-touch rounded-full border text-body active:scale-95",
                    chosen
                      ? "border-action bg-action text-white shadow-soft"
                      : "border-border bg-white text-ink hover:border-action",
                  )}
                >
                  {formatTime(new Date(startsAt), locale)}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
