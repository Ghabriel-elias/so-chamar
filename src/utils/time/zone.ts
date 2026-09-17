import { TIME_ZONE } from "@/i18n/config";

import { DAY } from "./clock";

const OFFSET = "-03:00";

export function zonedDateKey(instant: Date, offsetDays = 0) {
  const shifted = new Date(instant.getTime() + offsetDays * DAY);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(
    shifted,
  );
}

export function zonedMonthKey(instant: Date) {
  return zonedDateKey(instant).slice(0, 7);
}

export function zonedInstant(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00${OFFSET}`);
}

export function zonedDayRange(reference: Date, offsetDays = 0, days = 1) {
  const key = zonedDateKey(reference, offsetDays);
  const from = zonedInstant(key, "00:00");
  const to = new Date(from.getTime() + days * DAY - 1);
  return { from, to };
}

export function zonedWeekday(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

export function isOnZonedDay(instant: string, dateKey: string) {
  return zonedDateKey(new Date(instant)) === dateKey;
}
