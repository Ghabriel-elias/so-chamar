"use client";

import { useEffect, useState } from "react";

const SETTLE_MS = 450;

export function useScrolling() {
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    const onScroll = () => {
      setScrolling(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setScrolling(false), SETTLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  return scrolling;
}
