import type { Cents } from "@/types/booking";
import { CURRENCY } from "@/i18n/config";

export function toUnits(cents: Cents) {
  return cents / 100;
}

export function fromUnits(units: number): Cents {
  return Math.round(units * 100);
}

export function depositOf(total: Cents, percent: number): Cents {
  return Math.round((total * percent) / 100);
}

export type AmountPart = { kind: "symbol" | "digits" | "space"; text: string };

export function amountParts(cents: Cents, locale: string): AmountPart[] {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).formatToParts(toUnits(cents));

  return parts.map((part) => {
    if (part.type === "currency") return { kind: "symbol", text: part.value };
    if (part.type === "literal" && part.value.trim() === "")
      return { kind: "space", text: part.value };
    return { kind: "digits", text: part.value };
  });
}

export function amountText(cents: Cents, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(toUnits(cents));
}
