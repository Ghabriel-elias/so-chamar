import { ptBR } from "date-fns/locale";

import { TIME_ZONE, type Locale } from "@/i18n/config";

export function dateFnsLocale(locale: Locale) {
  void locale;
  return ptBR;
}

function format(date: Date, locale: Locale, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    ...options,
  }).format(date);
}

export function time(date: Date, locale: Locale) {
  return format(date, locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function shortDay(date: Date, locale: Locale) {
  return format(date, locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function compactDay(date: Date, locale: Locale) {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  const weekday = part("weekday");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${part("day")} ${part("month")}`;
}

export function dayParts(date: Date, locale: Locale) {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return { day: part("day"), month: part("month") };
}

export function weekdayLetter(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    weekday: "narrow",
  })
    .format(date)
    .toUpperCase();
}

export function weekdayLong(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    weekday: "long",
  }).format(date);
}

export function dayAndMonth(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

export function longDay(date: Date, locale: Locale) {
  return format(date, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const middleOf = (monthKey: string) => new Date(`${monthKey}-15T12:00:00Z`);

export function monthAndYear(monthKey: string, locale: Locale) {
  return format(middleOf(monthKey), locale, { month: "long", year: "numeric" });
}

export function monthName(monthKey: string, locale: Locale) {
  return format(middleOf(monthKey), locale, { month: "long" });
}

export function upperFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function dayAndTime(date: Date, locale: Locale) {
  return format(date, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
