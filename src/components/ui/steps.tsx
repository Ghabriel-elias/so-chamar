"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

export function Steps({
  current,
  total,
  from,
  className,
}: {
  current: number;
  total: number;
  from?: number | null;
  className?: string;
}) {
  const t = useTranslations("ui");
  const [shown, setShown] = useState(() =>
    Math.max(0, Math.min(total, from ?? current)),
  );

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setShown(current));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [current]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-note font-medium text-gray">
        {t("step", { current, total })}
      </p>
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface"
          >
            <span
              data-segment={index + 1}
              style={{ transform: `scaleX(${index < shown ? 1 : 0})` }}
              className="absolute inset-0 origin-left rounded-full bg-action transition-transform duration-300 ease-card"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
