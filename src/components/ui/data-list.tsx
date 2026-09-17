import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function DataList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={cn("flex flex-col", className)}>{children}</dl>;
}

export function DataRow({
  label,
  children,
  highlight = false,
}: {
  label: string;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0",
        highlight && "border-b border-border",
      )}
    >
      <dt
        className={cn(
          "text-body",
          highlight ? "font-semibold text-ink" : "text-gray",
        )}
      >
        {label}
      </dt>
      <dd className="text-right text-body font-medium text-ink">{children}</dd>
    </div>
  );
}
