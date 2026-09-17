"use client";

import { useSyncExternalStore } from "react";

export type Platform = "android" | "ios" | "other";

function detect(): Platform {
  const agent = navigator.userAgent;
  if (/android/i.test(agent)) return "android";
  if (
    /iphone|ipad|ipod/i.test(agent) ||
    (/macintosh/i.test(agent) && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  return "other";
}

const noChanges = () => () => {};

export function usePlatform(): Platform {
  return useSyncExternalStore(noChanges, detect, () => "other");
}
