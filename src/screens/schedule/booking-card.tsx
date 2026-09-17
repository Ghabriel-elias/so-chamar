import { useLocale } from "next-intl";
import type { ComponentProps } from "react";

import { Duration } from "@/components/ui/duration";
import { StatusChip } from "@/components/ui/status-chip";
import { Link } from "@/utils/navigation";
import { cn } from "@/utils/cn";
import { STATE_LOOK } from "@/utils/booking/states";
import { time as formatTime } from "@/utils/format/date";
import { MINUTE, now } from "@/utils/time/clock";
import type { Locale } from "@/i18n/config";
import type { BookingState, Viewpoint } from "@/types/booking";

export function BookingCard({
  href,
  state,
  viewpoint = "provider",
  startsAt,
  minutes,
  customer,
  service,
  index = 0,
}: {
  href: ComponentProps<typeof Link>["href"];
  state: BookingState;
  viewpoint?: Viewpoint;
  startsAt: Date;
  minutes?: number;
  customer: string;
  service: string;
  index?: number;
}) {
  const locale = useLocale() as Locale;
  const look = STATE_LOOK[state];

  const over = startsAt.getTime() + (minutes ?? 0) * MINUTE < now().getTime();

  return (
    <li
      style={{ "--index": index } as React.CSSProperties}
      className={cn(
        "stagger touchable relative flex overflow-hidden rounded-card border border-border bg-white shadow-soft hover:border-border-strong",
        over && "faded",
      )}
    >
      <div className="flex w-14 shrink-0 flex-col items-end py-3 pl-3">
        <p className="tabular text-body font-semibold text-ink">
          {formatTime(startsAt, locale)}
        </p>
        {minutes ? (
          <p className="tabular text-note text-gray">
            <Duration minutes={minutes} />
          </p>
        ) : null}
      </div>

      <span
        aria-hidden="true"
        className={cn("my-3 ml-3 w-1 shrink-0 rounded-full", look.bar)}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1 py-3 pr-3 pl-3">
        <h3 className="text-body font-semibold text-ink">
          <Link
            href={href}
            className="rounded-card after:absolute after:inset-0 after:content-['']"
          >
            {customer}
          </Link>
        </h3>

        <p className="text-note text-gray">{service}</p>

        <StatusChip
          state={state}
          viewpoint={viewpoint}
          className="mt-0.5 w-fit"
        />
      </div>
    </li>
  );
}
