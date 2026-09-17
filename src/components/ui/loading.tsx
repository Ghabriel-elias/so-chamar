import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";

export function Loading({ className }: { className?: string }) {
  const t = useTranslations("ui");

  return (
    <p
      role="status"
      className={cn(
        "flex items-center justify-center gap-2 py-8 text-body text-gray",
        className,
      )}
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-6 animate-spin motion-reduce:animate-none"
      />
      {t("loading")}
    </p>
  );
}
