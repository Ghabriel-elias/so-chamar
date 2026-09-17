"use client";

import type { Route } from "next";
import NextLink from "next/link";
import {
  usePathname,
  useRouter as useNextRouter,
} from "next/navigation";
import { useMemo, type ComponentProps } from "react";

export function Link({
  href,
  ...rest
}: Omit<ComponentProps<typeof NextLink>, "href"> & { href: string }) {
  return <NextLink href={href as Route} {...rest} />;
}

export function useRouter() {
  const router = useNextRouter();

  return useMemo(
    () => ({
      push: (href: string) => router.push(href as Route),
      replace: (href: string) => router.replace(href as Route),
      back: () => router.back(),
      refresh: () => router.refresh(),
    }),
    [router],
  );
}

export { usePathname };
