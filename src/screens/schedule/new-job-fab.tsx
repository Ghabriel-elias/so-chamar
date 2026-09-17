"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/utils/navigation";
import { cn } from "@/utils/cn";
import { useScrolling } from "@/utils/ui/scrolling";

export function NewJobFab() {
  const t = useTranslations("panel.nav");
  const scrolling = useScrolling();

  return (
    <>
      <div aria-hidden="true" className="h-20 md:hidden" />

      <Link
        href="/painel/novo"
        aria-label={t("newJob")}
        data-collapsed={scrolling || undefined}
        className="touchable fixed right-gutter bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 flex h-14 items-center rounded-full border border-action bg-action px-3.5 text-body font-semibold text-white shadow-lift active:bg-action-pressed md:hidden"
      >
        <Plus aria-hidden="true" className="size-6 shrink-0" />
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap transition-all duration-200",
            scrolling ? "max-w-0 opacity-0" : "mr-1 ml-2 max-w-40 opacity-100",
          )}
        >
          {t("newJob")}
        </span>
      </Link>
    </>
  );
}
