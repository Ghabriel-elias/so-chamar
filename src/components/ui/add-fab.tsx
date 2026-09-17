"use client";

import { Plus } from "lucide-react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Link } from "@/utils/navigation";
import { cn } from "@/utils/cn";
import { useScrolling } from "@/utils/ui/scrolling";

const subscribe = () => () => {};

export function AddFab({
  id,
  label,
  onClick,
  href,
  aboveBar = false,
}: {
  id: string;
  label: string;
  onClick?: () => void;
  href?: string;
  aboveBar?: boolean;
}) {
  const scrolling = useScrolling();
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const look = cn(
    "touchable fixed right-gutter z-20 flex h-14 items-center rounded-full border border-action bg-action px-3.5 text-body font-semibold text-white shadow-lift active:bg-action-pressed sm:hidden",
    aboveBar
      ? "bottom-[calc(var(--bar-height,5rem)+0.75rem)]"
      : "bottom-[max(1.25rem,env(safe-area-inset-bottom))]",
  );

  const inside = (
    <>
      <Plus aria-hidden="true" className="size-6 shrink-0" />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-200",
          scrolling ? "max-w-0 opacity-0" : "mr-1 ml-2 max-w-48 opacity-100",
        )}
      >
        {label}
      </span>
    </>
  );

  const button = href ? (
    <Link id={id} href={href} aria-label={label} className={look}>
      {inside}
    </Link>
  ) : (
    <button
      type="button"
      id={id}
      aria-label={label}
      onClick={onClick}
      className={look}
    >
      {inside}
    </button>
  );

  return (
    <>
      {aboveBar ? null : <div aria-hidden="true" className="h-20 sm:hidden" />}

      {inBrowser ? createPortal(button, document.body) : null}
    </>
  );
}
