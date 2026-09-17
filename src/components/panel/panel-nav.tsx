"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/brand/logo";
import { PANEL_PLACES } from "@/utils/panel/places";
import { Link, usePathname } from "@/utils/navigation";
import { cn } from "@/utils/cn";

export function PanelNav() {
  const t = useTranslations("panel.nav");
  const pathname = usePathname();

  const isCurrent = (href: string) =>
    href === "/painel" ? pathname === "/painel" : pathname.startsWith(href);

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-paper pt-6 pb-6 md:block"
    >
      <p className="px-4 pb-6">
        <Link
          href="/painel"
          className="touchable inline-flex min-h-touch items-center rounded-card px-1"
        >
          <Logo className="text-title" />
        </Link>
      </p>

      <ul className="flex flex-col gap-1 px-3">
        {PANEL_PLACES.map((place) => {
          const current = isCurrent(place.href);
          const Icon = place.icon;

          return (
            <li key={place.href}>
              <Link
                href={place.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "touchable flex min-h-touch items-center gap-3 rounded-card px-4 text-body",
                  current
                    ? "bg-ink font-semibold text-paper"
                    : "font-medium text-ink hover:bg-surface",
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {t(place.key)}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="px-3 pt-6">
        <Link
          href="/painel/novo"
          className="touchable flex min-h-touch items-center justify-center gap-2 rounded-full border border-action bg-action px-4 text-body font-semibold text-white shadow-soft hover:shadow-lift"
        >
          <Plus aria-hidden="true" className="size-5 shrink-0" />
          {t("newJob")}
        </Link>
      </div>
    </nav>
  );
}
