"use client";

import { LogOut, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { Logo } from "@/components/brand/logo";
import { PANEL_PLACES } from "@/utils/panel/places";
import { Link, usePathname, useRouter } from "@/utils/navigation";
import { api } from "@/utils/api";
import { cn } from "@/utils/cn";
import { useDragDismiss } from "@/utils/ui/drag-dismiss";

export function PanelDrawer({
  open,
  onClose,
  returnFocusId,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusId?: string;
}) {
  const t = useTranslations("panel.nav");
  const tSettings = useTranslations("panel.settings");
  const tUi = useTranslations("ui");
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);

  const drag = useDragDismiss(ref, {
    open,
    axis: "x",
    towards: -1,
    onDismiss: onClose,
  });

  useEffect(() => {
    const drawer = ref.current;
    if (!drawer) return;

    if (open) {
      delete drawer.dataset.closing;
      if (!drawer.open) {
        drawer.showModal();
        document.getElementById("drawer-close")?.focus({ preventScroll: true });
      }
      return;
    }

    if (!drawer.open) return;

    function closeNow() {
      if (!drawer) return;
      delete drawer.dataset.closing;
      drawer.close();
      if (returnFocusId) document.getElementById(returnFocusId)?.focus();
    }

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      closeNow();
      return;
    }
    drawer.dataset.closing = "";
    const timer = window.setTimeout(closeNow, 200);
    return () => window.clearTimeout(timer);
  }, [open, returnFocusId]);

  const isCurrent = (href: string) =>
    href === "/painel" ? pathname === "/painel" : pathname.startsWith(href);

  return (
    <dialog
      ref={ref}
      aria-label={t("label")}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      {...drag}
      className={cn(
        "m-0 mr-auto h-dvh max-h-none w-72 max-w-[86vw] touch-pan-y rounded-none border-0 bg-paper p-0",
        "animate-drawer-in data-closing:animate-drawer-out data-closing:pointer-events-none",
        "backdrop:animate-fade backdrop:bg-[rgb(16_42_67/0.55)] data-closing:backdrop:animate-fade-out",
        "md:hidden",
      )}
    >
      <div className="safe-bottom flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 px-gutter pt-4 pb-6">
          <Logo className="text-lead" />
          <button
            id="drawer-close"
            type="button"
            aria-label={tUi("close")}
            onClick={onClose}
            className="touchable -mr-2 flex size-11 items-center justify-center rounded-card text-gray active:bg-surface"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <nav className="px-2">
          <ul className="flex flex-col gap-1">
            {PANEL_PLACES.map((place) => {
              const current = isCurrent(place.href);
              const Icon = place.icon;

              return (
                <li key={place.href}>
                  <Link
                    href={place.href}
                    aria-current={current ? "page" : undefined}
                    onClick={onClose}
                    className={cn(
                      "touchable flex min-h-touch items-center gap-3 rounded-card px-3 text-body",
                      current
                        ? "bg-ink font-semibold text-paper"
                        : "font-medium text-ink active:bg-surface",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-5 shrink-0" />
                    {t(place.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto border-t border-border px-2 pt-2 pb-4">
          <button
            type="button"
            onClick={async () => {
              onClose();
              await api.signOut();
              router.push("/");
            }}
            className="touchable flex min-h-touch w-full items-center gap-3 rounded-card px-3 text-body font-medium text-red active:bg-red-soft"
          >
            <LogOut aria-hidden="true" className="size-5 shrink-0" />
            {tSettings("signOut")}
          </button>

          <p className="tabular px-3 pt-2 text-note text-gray">
            {t("version", { version: process.env.NEXT_PUBLIC_VERSION ?? "" })}
          </p>
        </div>
      </div>
    </dialog>
  );
}
