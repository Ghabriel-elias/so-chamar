import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";

import { Link } from "@/utils/navigation";

export function Header({
  title,
  subtitle,
  backTo,
  onBack,
  backLabel,
  steps,
  rowTitle,
  aside,
}: {
  title?: string;
  subtitle?: string;
  steps?: ReactNode;
  rowTitle?: string;
  backTo?: ComponentProps<typeof Link>["href"];
  onBack?: () => void;
  backLabel?: string;
  aside?: ReactNode;
}) {
  const t = useTranslations("ui");

  return (
    <header className="flex flex-col gap-3 pb-4 pt-3">
      {backTo || onBack || rowTitle ? (
        <div className="relative flex min-h-touch items-center">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="touchable relative z-10 -ml-2 inline-flex min-h-touch w-fit items-center gap-1 rounded-card px-2 text-body font-medium text-blue"
            >
              <ChevronLeft aria-hidden="true" className="size-6 shrink-0" />
              {backLabel ?? t("back")}
            </button>
          ) : backTo ? (
            <Link
              href={backTo}
              className="relative z-10 -ml-2 inline-flex min-h-touch w-fit items-center gap-1 rounded-card px-2 text-body font-medium text-blue"
            >
              <ChevronLeft aria-hidden="true" className="size-6 shrink-0" />
              {backLabel ?? t("back")}
            </Link>
          ) : null}

          {rowTitle ? (
            <p className="pointer-events-none absolute inset-x-12 truncate text-center text-body font-semibold text-ink">
              {rowTitle}
            </p>
          ) : null}
        </div>
      ) : null}

      {steps}

      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-title">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-body text-gray">{subtitle}</p>
            ) : null}
          </div>
          {aside}
        </div>
      ) : null}
    </header>
  );
}
