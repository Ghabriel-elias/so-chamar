import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function Sheet({
  children,
  className,
  asList = false,
}: {
  children: ReactNode;
  className?: string;
  asList?: boolean;
}) {
  const classes = cn(
    "overflow-hidden rounded-card border border-border bg-white shadow-soft",
    className,
  );

  return asList ? (
    <ul className={classes}>{children}</ul>
  ) : (
    <div className={classes}>{children}</div>
  );
}

export function SheetHeader({
  title,
  aside,
}: {
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
      <h2 className="text-body font-medium text-ink">{title}</h2>
      {aside}
    </div>
  );
}

export function SheetBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
