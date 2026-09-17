"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import type { WorkingHours } from "@/types/provider";

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type Range = { start: string; end: string };
type DayShape = { hours: Range; lunch: Range | null } | null;

function shapeOf(day: WorkingHours | undefined): DayShape {
  if (!day?.active) return null;
  return {
    hours: { start: day.start, end: day.end },
    lunch: day.lunch ? { start: day.lunch.start, end: day.lunch.end } : null,
  };
}

function groupWeek(hours: WorkingHours[]) {
  const groups: { weekdays: number[]; shape: DayShape; key: string }[] = [];

  for (const weekday of WEEK_ORDER) {
    const shape = shapeOf(hours.find((entry) => entry.weekday === weekday));
    const key = JSON.stringify(shape);
    const last = groups[groups.length - 1];

    if (last && last.key === key) last.weekdays.push(weekday);
    else groups.push({ weekdays: [weekday], shape, key });
  }

  return groups;
}

export function WorkingHoursSummary({
  hours,
  children,
}: {
  hours: WorkingHours[];
  children?: ReactNode;
}) {
  const t = useTranslations("panel.settings");
  const locale = useLocale();

  const capitalise = (text: string) =>
    text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

  function daysLabel(weekdays: number[]) {
    const first = t(DAY_KEYS[weekdays[0]]);
    const last = t(DAY_KEYS[weekdays[weekdays.length - 1]]);

    if (weekdays.length === 1) return capitalise(first);
    if (weekdays.length === 2) {
      return capitalise(t("hoursDaysPair", { first, second: last }));
    }
    return capitalise(t("hoursDaysRange", { from: first, to: last }));
  }

  return (
    <Sheet>
      <SheetHeader title={t("hoursSummaryTitle")} />
      <SheetBody className="flex flex-col gap-3">
        <dl className="flex flex-col">
          {groupWeek(hours).map((group) => (
            <div
              key={group.weekdays.join("-")}
              className="flex items-start justify-between gap-4 border-b border-border py-3 first:pt-0 last:border-b-0"
            >
              <dt className="text-body font-medium text-ink">
                {daysLabel(group.weekdays)}
              </dt>
              <dd className="text-right">
                {group.shape === null ? (
                  <span className="text-body text-gray">{t("hoursOff")}</span>
                ) : (
                  <>
                    <span className="tabular block text-body text-ink">
                      {group.shape.hours.start} – {group.shape.hours.end}
                    </span>
                    {group.shape.lunch ? (
                      <span className="tabular block text-note text-gray">
                        {t("hoursLunch", {
                          start: group.shape.lunch.start,
                          end: group.shape.lunch.end,
                        })}
                      </span>
                    ) : null}
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {children}
      </SheetBody>
    </Sheet>
  );
}
