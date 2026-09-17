"use client";

import { useSyncExternalStore } from "react";

export function useMedia(query: string) {
  const subscribe = (change: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", change);
    return () => list.removeEventListener("change", change);
  };

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const PHONE = "(max-width: 767px)";
