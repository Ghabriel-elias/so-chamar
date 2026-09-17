import {
  CircleCheckBig,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type NoticeKind = "info" | "attention" | "error" | "ok";

const KINDS: Record<NoticeKind, { icon: LucideIcon; classes: string }> = {
  info: { icon: Info, classes: "border-blue bg-blue-soft text-ink" },
  attention: {
    icon: TriangleAlert,
    classes: "border-orange bg-yellow-soft text-ink",
  },
  error: {
    icon: OctagonAlert,
    classes: "border-red bg-red-soft text-ink",
  },
  ok: { icon: CircleCheckBig, classes: "border-green bg-green-soft text-ink" },
};

export function Notice({
  kind = "info",
  title,
  children,
  live = false,
  className,
}: {
  kind?: NoticeKind;
  title?: string;
  children: ReactNode;
  live?: boolean;
  className?: string;
}) {
  const { icon: Icon, classes } = KINDS[kind];

  return (
    <div
      role={live ? (kind === "error" ? "alert" : "status") : undefined}
      aria-live={live ? (kind === "error" ? "assertive" : "polite") : undefined}
      className={cn(
        "animate-rise flex items-start gap-3 rounded-card border px-4 py-4 shadow-soft",
        classes,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="text-body font-semibold">{title}</p> : null}
        <div className="text-body">{children}</div>
      </div>
    </div>
  );
}
