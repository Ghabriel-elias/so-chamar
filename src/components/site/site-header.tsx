"use client";

import { useTranslations } from "next-intl";

import { Logo } from "@/components/brand/logo";
import { Link } from "@/utils/navigation";

export function SiteHeader({ showAccount = true }: { showAccount?: boolean }) {
  const t = useTranslations("site");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-gutter py-3 short:py-2">
        <Link
          href="/"
          className="touchable -mx-2 inline-flex min-h-touch items-center rounded-card px-2"
        >
          <Logo className="text-lead sm:text-title" />
        </Link>

        {showAccount ? (
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/entrar"
              className="touchable inline-flex h-10 items-center rounded-full px-4 text-note font-medium text-ink hover:bg-surface"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/cadastro"
              className="touchable inline-flex h-10 items-center rounded-full border border-action bg-action px-4 text-note font-semibold text-white shadow-soft hover:shadow-lift"
            >
              {t("signUp")}
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
