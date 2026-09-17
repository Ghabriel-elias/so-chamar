"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ retry }: { retry: () => void }) {
  const t = useTranslations("errorPage");

  return (
    <main className="mx-auto w-full max-w-136 px-gutter pb-16 pt-10">
      <h1 className="text-display">{t("title")}</h1>
      <p className="mt-3 text-lead text-gray">{t("body")}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button look="primary" icon={RotateCcw} onClick={() => retry()}>
          {t("retry")}
        </Button>
        <ButtonLink look="secondary" href="/">
          {t("home")}
        </ButtonLink>
      </div>
    </main>
  );
}
