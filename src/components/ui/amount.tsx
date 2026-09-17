import { useLocale } from "next-intl";

import { cn } from "@/utils/cn";
import { amountParts } from "@/utils/format/currency";
import type { Cents } from "@/types/booking";

const SIZES = {
  note: "text-note",
  body: "text-body",
  lead: "text-lead",
  display: "text-display",
  money: "text-money",
} as const;

const COLUMN_SIZES = new Set(["note", "body", "lead"]);

export function Amount({
  cents,
  size = "body",
  className,
}: {
  cents: Cents;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const locale = useLocale();
  const parts = amountParts(cents, locale);

  return (
    <span
      className={cn(
        COLUMN_SIZES.has(size) ? "tabular" : "figures",
        "whitespace-nowrap",
        SIZES[size],
        className,
      )}
    >
      {parts.map((part, index) =>
        part.kind === "symbol" ? (
          <span key={index} className="align-baseline text-[0.62em]">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  );
}
