"use client";

import { createTranslator } from "next-intl";

import { LOCALE } from "@/i18n/config";
import { Link } from "@/utils/navigation";

import messages from "@/i18n/messages/pt-BR.json";
import "./globals.css";

const t = createTranslator({ locale: LOCALE, messages, namespace: "errorPage" });

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang={LOCALE}>
      <body>
        <title>{t("title")}</title>
        <main className="mx-auto w-full max-w-136 px-gutter pb-16 pt-10">
          <h1 className="text-display">{t("title")}</h1>
          <p className="mt-3 text-lead text-gray">{t("body")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="touchable inline-flex min-h-touch-lg items-center justify-center rounded-full border border-action bg-action px-6 text-body font-semibold text-white"
            >
              {t("retry")}
            </button>
            <Link
              href="/"
              className="touchable inline-flex min-h-touch items-center justify-center rounded-full border border-border-strong bg-white px-6 text-body font-medium text-ink"
            >
              {t("home")}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
