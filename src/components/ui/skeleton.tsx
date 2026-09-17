import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";

export function Skeleton({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(
        "shimmer block h-5 rounded-full motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function SkeletonLines({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={index === lines - 1 && lines > 1 ? "w-2/3" : undefined}
        />
      ))}
    </span>
  );
}

function Announce({ className }: { className?: string }) {
  const t = useTranslations("ui");

  return (
    <p role="status" className={cn("sr-only", className)}>
      {t("loading")}
    </p>
  );
}

export function ListSkeleton({
  rows = 3,
  lead = "square",
  className,
}: {
  rows?: number;
  lead?: "square" | "circle" | "none";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Announce />
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-center gap-3 rounded-card border border-border bg-white p-3"
        >
          {lead === "none" ? null : (
            <Skeleton
              delay={index * 90}
              className={cn(
                "size-11 shrink-0",
                lead === "circle" ? "rounded-full" : "rounded-card",
              )}
            />
          )}
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton delay={index * 90} className="h-4 w-2/5" />
            <Skeleton delay={index * 90 + 45} className="h-3 w-3/5" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScreenSkeleton({
  rows = 3,
  lead = "square",
  className,
}: {
  rows?: number;
  lead?: "square" | "circle" | "none";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 pt-2", className)}>
      <Announce />
      <span aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </span>
      <ListSkeleton rows={rows} lead={lead} />
    </div>
  );
}

export function FormSkeleton({
  fields = 3,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <Announce />
      {Array.from({ length: fields }, (_, index) => (
        <span key={index} aria-hidden="true" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-12 rounded-card" />
        </span>
      ))}
    </div>
  );
}

export function ChipsSkeleton({
  count = 10,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Announce />
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-11 w-24 rounded-full" />
      ))}
    </div>
  );
}
