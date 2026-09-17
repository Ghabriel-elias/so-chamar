import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";
import { STATE_LOOK } from "@/utils/booking/states";
import type { BookingState, Viewpoint } from "@/types/booking";

export function StatusChip({
  state,
  viewpoint = "provider",
  announce = false,
  className,
}: {
  state: BookingState;
  viewpoint?: Viewpoint;
  announce?: boolean;
  className?: string;
}) {
  const t = useTranslations(
    viewpoint === "provider" ? "stateProvider" : "stateCustomer",
  );
  const look = STATE_LOOK[state];
  const Icon = look.icon;

  return (
    <span
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.8125rem] leading-5 font-medium",
        announce && "animate-pop",
        look.chip,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {t(state)}
    </span>
  );
}
