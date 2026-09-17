"use client";

import { useState } from "react";

import { useAgenda as useAgendaQuery } from "@/utils/api/queries";
import { now } from "@/utils/time/clock";
import { isOnZonedDay, zonedDateKey, zonedInstant } from "@/utils/time/zone";

const AHEAD = 14;
const STRIP_BEHIND = 7;
const STRIP_AHEAD = 60;

export const dateOf = (key: string) => zonedInstant(key, "12:00");
export const keyPlus = (key: string, days: number) =>
  zonedDateKey(dateOf(key), days);

export function useSchedule() {
  const today = zonedDateKey(now());
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(today);

  const stripStart = keyPlus(today, -STRIP_BEHIND);
  const strip = Array.from(
    { length: STRIP_BEHIND + STRIP_AHEAD + 1 },
    (_, index) => keyPlus(stripStart, index),
  );

  const from = zonedInstant(stripStart, "00:00");
  const to = zonedInstant(strip[strip.length - 1], "23:59");

  const { data, loading, error } = useAgendaQuery(from, to);

  const items = (data ?? []).filter(
    (item) => item.booking.state !== "payment_expired",
  );

  const onDay = (key: string) =>
    items.filter((item) => isOnZonedDay(item.booking.startsAt, key));

  return {
    today,
    view,
    setView,
    selected,
    setSelected,
    strip,
    loading,
    error,
    days: Array.from({ length: AHEAD + 1 }, (_, index) =>
      keyPlus(selected, index),
    )
      .map((key) => ({ key, items: onDay(key) }))
      .filter((day) => day.items.length > 0),
    selectedItems: onDay(selected),
  };
}
