
const KEY = "sochamar:clock:offset";

let offsetMs = 0;
let hydrated = false;

function inBrowser() {
  return typeof window !== "undefined";
}

function hydrate() {
  if (hydrated || !inBrowser()) return;
  hydrated = true;

  try {
    const stored = window.localStorage.getItem(KEY);
    offsetMs = stored ? Number(stored) || 0 : 0;
  } catch {
    offsetMs = 0;
  }
}

function persist() {
  if (!inBrowser()) return;
  try {
    window.localStorage.setItem(KEY, String(offsetMs));
  } catch {
  }
}

export function now(): Date {
  hydrate();
  return new Date(Date.now() + offsetMs);
}

export function nowIso(): string {
  return now().toISOString();
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function skipAhead(ms: number) {
  hydrate();
  offsetMs += ms;
  persist();
  return now();
}

export function currentOffset() {
  hydrate();
  return offsetMs;
}

export function backToRealTime() {
  hydrate();
  offsetMs = 0;
  persist();
  return now();
}

export function hoursBetween(from: Date | string, to: Date | string) {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return (b.getTime() - a.getTime()) / HOUR;
}

export function addMs(instant: Date | string, ms: number) {
  const base = typeof instant === "string" ? new Date(instant) : instant;
  return new Date(base.getTime() + ms);
}

export function hasPassed(instant: Date | string) {
  const target = typeof instant === "string" ? new Date(instant) : instant;
  return target.getTime() <= now().getTime();
}
