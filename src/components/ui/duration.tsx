"use client";

import { useTranslations } from "next-intl";

export function useDurationText() {
  const t = useTranslations("ui");
  return (minutes: number) =>
    t("duration", { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}

export function Duration({ minutes }: { minutes: number }) {
  const durationText = useDurationText();
  return <>{durationText(minutes)}</>;
}
