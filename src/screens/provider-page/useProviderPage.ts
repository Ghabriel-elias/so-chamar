"use client";

import { useRef, useState } from "react";

import { usePublicPage } from "@/utils/api/queries";

export function useProviderPage(slug: string) {
  const [tab, setTab] = useState("services");
  const tabsSection = useRef<HTMLDivElement>(null);
  const { data, loading, error } = usePublicPage(slug);

  function showReviews() {
    setTab("reviews");
    document.getElementById("tab-reviews")?.focus({ preventScroll: true });
    tabsSection.current?.scrollIntoView({ block: "start" });
  }

  return { page: data, loading, error, tab, setTab, tabsSection, showReviews };
}
