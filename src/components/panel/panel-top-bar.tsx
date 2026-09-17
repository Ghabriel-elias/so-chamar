"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Link } from "@/utils/navigation";

import { PanelDrawer } from "./panel-drawer";

const MENU = "panel-menu";

export function PanelTopBar() {
  const t = useTranslations("panel.nav");
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        data-panel-top-bar
        className="fixed inset-x-0 top-0 z-30 border-b border-border bg-paper/95 backdrop-blur-sm md:hidden"
      >
        <div className="mx-auto flex h-14 max-w-160 items-center gap-1 px-gutter">
          <button
            id={MENU}
            type="button"
            aria-label={t("menu")}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="touchable -ml-2 flex size-11 shrink-0 items-center justify-center rounded-card text-ink active:bg-surface"
          >
            <Menu aria-hidden="true" className="size-6" />
          </button>

          <Link
            href="/painel"
            className="touchable inline-flex min-h-touch items-center rounded-card px-2"
          >
            <Logo className="text-lead" />
          </Link>
        </div>
      </header>

      <PanelDrawer
        open={open}
        onClose={() => setOpen(false)}
        returnFocusId={MENU}
      />
    </>
  );
}
