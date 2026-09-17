"use client";

import { useLayoutEffect, useRef } from "react";

import { cn } from "@/utils/cn";

export type TabItem = {
  id: string;
  label: string;
  count?: number;
};

const COMPACT = "group-data-[compact=true]/tabs:";

export function Tabs({
  items,
  active,
  onChange,
  label,
  className,
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useLayoutEffect(() => {
    const container = list.current;
    if (!container) return;
    let gone = false;

    function layout() {
      const button = refs.current[active];
      if (gone || !container || !button) return;

      delete container.dataset.compact;
      if (container.scrollWidth > container.clientWidth + 1) {
        container.dataset.compact = "true";
      }

      container.style.setProperty("--pill-x", `${button.offsetLeft}px`);
      container.style.setProperty("--pill-w", `${button.offsetWidth}px`);
      container.dataset.ready = "true";
    }

    layout();

    const frame = requestAnimationFrame(() => {
      container.dataset.animate = "true";
    });

    const observer = new ResizeObserver(layout);
    observer.observe(container);
    document.fonts?.ready.then(layout);

    return () => {
      gone = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active, items]);

  function onKeyDown(event: React.KeyboardEvent) {
    const index = items.findIndex((item) => item.id === active);
    if (index < 0) return;

    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;

    event.preventDefault();
    const id = items[next].id;
    onChange(id);
    refs.current[id]?.focus();
  }

  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "group/tabs relative flex gap-1 rounded-full bg-surface p-1",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-1 left-0 w-(--pill-w) translate-x-(--pill-x) rounded-full bg-white opacity-0 shadow-soft",
          "group-data-[ready=true]/tabs:opacity-100",
          "group-data-[animate=true]/tabs:transition-[translate,width] group-data-[animate=true]/tabs:duration-300 group-data-[animate=true]/tabs:ease-card",
        )}
      />

      {items.map((item) => {
        const selected = item.id === active;

        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[item.id] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative z-10 flex min-h-touch flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-body transition-colors duration-200",
              "group-data-[compact=true]/tabs:px-2 group-data-[compact=true]/tabs:text-note",
              selected
                ? "font-semibold text-ink"
                : "font-medium text-gray hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cn(
                  "tabular text-note text-gray transition-colors duration-200",
                  `${COMPACT}hidden`,
                )}
              >
                ({item.count})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
}: {
  id: string;
  active: string;
  children: React.ReactNode;
}) {
  const selected = id === active;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!selected}
      tabIndex={0}
      className="animate-fade"
    >
      {selected ? children : null}
    </div>
  );
}
