"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/utils/cn";

export function ActionBar({
  children,
  note,
  alert,
  aboveNav = false,
  enter = true,
  narrow = false,
}: {
  children: ReactNode;
  note?: ReactNode;
  alert?: ReactNode;
  aboveNav?: boolean;
  enter?: boolean;
  narrow?: boolean;
}) {
  const bar = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = bar.current;
    if (!element) return;

    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      const next = Math.ceil(element.getBoundingClientRect().height);
      setHeight(next);
      root.style.setProperty("--bar-height", `${next}px`);
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--bar-height");
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className={height === null ? "h-bar" : undefined}
        style={height === null ? undefined : { height }}
      />
      <div
        ref={bar}
        className={cn(
          enter && "animate-slide-up",
          "fixed inset-x-0 z-20 border-t border-border bg-paper pt-3 shadow-bar short:pt-2",
          "safe-bottom bottom-0",
          aboveNav && "md:left-64",
        )}
      >
        <div
          className={cn(
            "mx-auto flex flex-col gap-2 px-gutter short:gap-1",
            narrow ? "max-w-136" : "max-w-160",
          )}
        >
          {alert}
          {note ? <p className="text-note text-gray">{note}</p> : null}
          {children}
        </div>
      </div>
    </>
  );
}
