"use client";

import { useCallback, useSyncExternalStore } from "react";

const PREFIX = "sochamar:dismissed:";
const EVENT = "sochamar:dismissed";
const memory = new Set<string>();

function read(key: string) {
  if (memory.has(key)) return true;
  try {
    return window.localStorage.getItem(PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function clearDismissed() {
  memory.clear();
  try {
    const gone = Object.keys(window.localStorage).filter((key) =>
      key.startsWith(PREFIX),
    );
    for (const key of gone) window.localStorage.removeItem(key);
  } catch {
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useDismissed(key: string) {
  const dismissed = useSyncExternalStore(subscribe, () => read(key), () => false);

  const dismiss = useCallback(() => {
    memory.add(key);
    try {
      window.localStorage.setItem(PREFIX + key, "1");
    } catch {
    }
    window.dispatchEvent(new Event(EVENT));
  }, [key]);

  return [dismissed, dismiss] as const;
}
