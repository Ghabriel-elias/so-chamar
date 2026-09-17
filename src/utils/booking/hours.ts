import type { WorkingHours } from "@/types/provider";

export const DEFAULT_DAY = { start: "08:00", end: "18:00" } as const;
export const DEFAULT_LUNCH = { start: "12:00", end: "14:00" } as const;

export function lunchOf(hours: Pick<WorkingHours, "start" | "end" | "lunch">) {
  if (hours.lunch !== undefined) return hours.lunch;

  return hours.start < DEFAULT_LUNCH.start && hours.end > DEFAULT_LUNCH.end
    ? { ...DEFAULT_LUNCH }
    : null;
}

export function turnDayOn(entry: WorkingHours): Partial<WorkingHours> {
  if (entry.lunch) return { active: true };

  return {
    active: true,
    start: entry.start < DEFAULT_LUNCH.start ? entry.start : DEFAULT_DAY.start,
    end: entry.end > DEFAULT_LUNCH.end ? entry.end : DEFAULT_DAY.end,
    lunch: { ...DEFAULT_LUNCH },
  };
}
