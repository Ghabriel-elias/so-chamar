"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { Loading } from "@/components/ui/loading";

const subscribe = () => () => {};

export function ClientOnly({
  children,
  fallback = <Loading />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return inBrowser ? children : fallback;
}
