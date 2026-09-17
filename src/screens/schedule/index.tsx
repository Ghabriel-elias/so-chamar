"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type PointerEvent } from "react";

import { BookingCard } from "./booking-card";
import { NewJobFab } from "./new-job-fab";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { TabPanel } from "@/components/ui/tabs";
import { type AgendaItem } from "@/utils/api";
import { cn } from "@/utils/cn";
import {
  dayAndMonth,
  longDay,
  upperFirst,
  weekdayLetter,
  weekdayLong,
} from "@/utils/format/date";
import type { Locale } from "@/i18n/config";

import { dateOf, keyPlus, useSchedule } from "./useSchedule";


export function AgendaView() {
  const t = useTranslations("panel.agenda");
  const locale = useLocale() as Locale;

  const {
    today,
    view,
    setView,
    selected,
    setSelected,
    strip,
    loading,
    error,
    days,
    selectedItems,
  } = useSchedule();

  return (
    <>
      <div
        role="tablist"
        aria-label={t("viewLabel")}
        className="animate-rise flex items-center gap-2 pt-4"
      >
        {[
          { id: "list", label: t("listView") },
          { id: "day", label: t("dayView") },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={view === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={view === item.id ? 0 : -1}
            onClick={() => setView(item.id)}
            className={cn(
              "touchable min-h-touch rounded-full px-4 text-body transition-colors duration-150",
              view === item.id
                ? "bg-ink font-semibold text-paper"
                : "bg-surface font-medium text-gray active:bg-border",
            )}
          >
            {item.label}
          </button>
        ))}

        {selected === today ? null : (
          <button
            type="button"
            onClick={() => setSelected(today)}
            className="touchable ml-auto min-h-touch shrink-0 rounded-full px-4 text-body font-semibold text-blue active:bg-surface"
          >
            {t("today")}
          </button>
        )}
      </div>

      <WeekStrip
        days={strip}
        selected={selected}
        today={today}
        locale={locale}
        label={t("daysLabel")}
        backLabel={t("daysBack")}
        aheadLabel={t("daysAhead")}
        onPick={setSelected}
      />

      {error ? (
        <Notice kind="error" live className="mt-6">
          {error}
        </Notice>
      ) : null}

      <div className="mt-5">
        <TabPanel id="list" active={view}>
          {loading ? (
            <ListSkeleton rows={3} />
          ) : days.length === 0 ? (
            <Notice kind="info">{t("emptyAhead")}</Notice>
          ) : (
            <ol className="flex flex-col gap-6">
              {days.map((day, index) => (
                <li
                  key={day.key}
                  style={
                    { "--index": Math.min(index, 6) } as React.CSSProperties
                  }
                  className="stagger"
                >
                  <DayHeading dayKey={day.key} today={today} locale={locale} />
                  <Cards items={day.items} className="mt-2" />
                </li>
              ))}
            </ol>
          )}
        </TabPanel>

        <TabPanel id="day" active={view}>
          <DayHeading dayKey={selected} today={today} locale={locale} />
          {loading ? (
            <ListSkeleton rows={2} className="mt-2" />
          ) : selectedItems.length === 0 ? (
            <Notice kind="info" className="mt-2">
              {t("emptyDay")}
            </Notice>
          ) : (
            <Cards items={selectedItems} className="mt-2" />
          )}
        </TabPanel>
      </div>

      <NewJobFab />
    </>
  );
}

function DayHeading({
  dayKey,
  today,
  locale,
}: {
  dayKey: string;
  today: string;
  locale: Locale;
}) {
  const t = useTranslations("panel.agenda");
  const date = dateOf(dayKey);

  const relative =
    dayKey === today
      ? t("today")
      : dayKey === keyPlus(today, 1)
        ? t("tomorrow")
        : weekdayLong(date, locale);

  return (
    <h2 className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="tabular text-lead font-semibold text-ink">
        {dayAndMonth(date, locale)}
      </span>
      <span className="text-note text-gray first-letter:uppercase">
        {relative}
      </span>
    </h2>
  );
}

function Cards({
  items,
  className,
}: {
  items: AgendaItem[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item, index) => (
        <BookingCard
          key={item.booking.id}
          index={index}
          href={`/painel/agendamentos/${item.booking.id}`}
          state={item.booking.state}
          startsAt={new Date(item.booking.startsAt)}
          minutes={item.booking.durationMinutes}
          customer={item.booking.customerName}
          service={item.service.name}
        />
      ))}
    </ul>
  );
}

const TURN = 0.25;
const FLICK = 0.4;

function WeekStrip({
  days,
  selected,
  today,
  locale,
  label,
  backLabel,
  aheadLabel,
  onPick,
}: {
  days: string[];
  selected: string;
  today: string;
  locale: Locale;
  label: string;
  backLabel: string;
  aheadLabel: string;
  onPick: (key: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    at: number;
    live: boolean;
  } | null>(null);

  const opening = dateOf(days[0]).getDay();
  const first = keyPlus(days[0], -opening);
  const weeks = Array.from(
    { length: Math.ceil((days.length + opening) / 7) },
    (_, week) =>
      Array.from({ length: 7 }, (_, day) => keyPlus(first, week * 7 + day)),
  );

  const holding = Math.max(
    0,
    weeks.findIndex((week) => week.includes(selected)),
  );

  const [shown, setShown] = useState({ page: holding, of: holding });
  if (shown.of !== holding) setShown({ page: holding, of: holding });
  const page = shown.of === holding ? shown.page : holding;

  const [offset, setOffset] = useState(0);

  const turn = (way: -1 | 1) =>
    setShown((at) => ({
      of: at.of,
      page: Math.min(weeks.length - 1, Math.max(0, at.page + way)),
    }));

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      at: event.timeStamp,
      live: false,
    };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const held = drag.current;
    if (!held) return;

    const dx = event.clientX - held.x;
    const dy = event.clientY - held.y;

    if (!held.live) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      held.live = true;
      track.current?.setPointerCapture(event.pointerId);
    }

    const stuck =
      (dx > 0 && page === 0) || (dx < 0 && page === weeks.length - 1);
    setOffset(stuck ? dx / 4 : dx);
  }

  function up(event: PointerEvent<HTMLDivElement>) {
    const held = drag.current;
    drag.current = null;
    setOffset(0);
    if (!held?.live) return;

    const dx = event.clientX - held.x;
    const width = track.current?.clientWidth ?? 1;
    const speed = Math.abs(dx) / Math.max(1, event.timeStamp - held.at);

    if (Math.abs(dx) > width * TURN || speed > FLICK) turn(dx < 0 ? 1 : -1);
  }

  return (
    <div className="mt-3 flex items-center gap-1">
      <StripArrow side="back" label={backLabel} onClick={() => turn(-1)} />

      <div className="min-w-0 flex-1 overflow-hidden">
        <div aria-hidden="true" className="grid grid-cols-7">
          {weeks[0].map((key, index) => (
            <span key={index} className="text-center text-note text-gray">
              {weekdayLetter(dateOf(key), locale)}
            </span>
          ))}
        </div>

        <div
          ref={track}
          role="group"
          aria-label={label}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="flex w-full touch-pan-y"
          style={{
            transform: `translateX(calc(${-page * 100}% + ${offset}px))`,
            transition: offset ? "none" : "transform 260ms var(--ease-card)",
          }}
        >
          {weeks.map((week, index) => (
            <div
              key={week[0]}
              data-week={index}
              inert={index !== page ? true : undefined}
              className="grid w-full shrink-0 grid-cols-7"
            >
              {week.map((key) => {
                const date = dateOf(key);
                const isSelected = key === selected;
                const isToday = key === today;

                return (
                  <button
                    key={key}
                    type="button"
                    data-day={key}
                    aria-pressed={isSelected}
                    aria-label={upperFirst(longDay(date, locale))}
                    onClick={() => onPick(key)}
                    className="touchable flex min-h-touch flex-col items-center justify-center rounded-card py-1 active:bg-surface"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "tabular flex size-8 items-center justify-center rounded-full text-body",
                        isSelected
                          ? "bg-action font-semibold text-white"
                          : isToday
                            ? "font-semibold text-action"
                            : "text-ink",
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <StripArrow side="ahead" label={aheadLabel} onClick={() => turn(1)} />
    </div>
  );
}

function StripArrow({
  side,
  label,
  onClick,
}: {
  side: "back" | "ahead";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "back" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="touchable hidden size-9 shrink-0 items-center justify-center rounded-full text-gray hover:bg-surface hover:text-ink md:flex"
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
