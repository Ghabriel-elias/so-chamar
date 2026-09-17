import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";

import { BrandIcon } from "./brand-icon";

export function Logo({ className }: { className?: string }) {
  const t = useTranslations("brand");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.4em] font-title font-extrabold leading-none tracking-[-0.035em] whitespace-nowrap",
        className,
      )}
    >
      <BrandIcon className="size-[1.6em] shrink-0" />
      <span className="sr-only">{t("name")}</span>
      <span aria-hidden="true" className="text-blue">
        S
        <span className="relative inline-block">
          o
          <span className="absolute top-[0.03em] left-[0.25em] h-[0.26em] w-[0.12em] origin-bottom rotate-[38deg] rounded-full bg-current" />
        </span>
        <span className="ml-[0.28em]">Chamar</span>
      </span>
    </span>
  );
}
