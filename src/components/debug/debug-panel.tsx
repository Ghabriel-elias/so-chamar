"use client";

import {
  Bug,
  ChevronDown,
  Eye,
  MessageSquare,
  RotateCcw,
  TimerReset,
  Trash2,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { WhatsappSimulator } from "@/components/whatsapp/simulator";
import { clearDismissed } from "@/utils/ui/dismissed";
import { api, debug } from "@/utils/api";
import { useMessages } from "@/utils/api/queries";
import { DAY, HOUR, now } from "@/utils/time/clock";
import { dayAndTime } from "@/utils/format/date";
import type { Locale } from "@/i18n/config";

const FLAG = "sochamar:debug";
const FLAG_EVENT = "sochamar:debug";

function readFlag() {
  try {
    return window.localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

function subscribeToFlag(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(FLAG_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(FLAG_EVENT, callback);
  };
}

function useDebugEnabled() {
  const enabled = useSyncExternalStore(subscribeToFlag, readFlag, () => false);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("debug");
    if (wanted === null) return;
    try {
      if (wanted === "0") window.localStorage.removeItem(FLAG);
      else window.localStorage.setItem(FLAG, "1");
    } catch {
    }
    window.dispatchEvent(new Event(FLAG_EVENT));
  }, []);

  return enabled;
}

export function DebugPanel({ onChange }: { onChange?: () => void }) {
  const enabled = useDebugEnabled();

  if (process.env.NODE_ENV === "production" || !enabled) return null;

  return <DebugTools onChange={onChange} />;
}

function DebugTools({ onChange }: { onChange?: () => void }) {
  const t = useTranslations("debug");
  const tLog = useTranslations("whatsappLog");
  const locale = useLocale() as Locale;

  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState<string>("");
  const [jobs, setJobs] = useState<string[]>([]);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showingMessages, setShowingMessages] = useState(false);

  const messages = useMessages();

  function toggle() {
    if (!open) setClock(dayAndTime(now(), locale));
    setOpen((value) => !value);
  }

  async function withFeedback(action: () => Promise<string[]>) {
    setBusy(true);
    try {
      setJobs(await action());
      setClock(dayAndTime(now(), locale));
      await messages.reload();
      onChange?.();
    } finally {
      setBusy(false);
    }
  }

  const jumps = [
    { label: t("skip30m"), ms: HOUR / 2 },
    { label: t("skip1h"), ms: HOUR },
    { label: t("skip6h"), ms: 6 * HOUR },
    { label: t("skip1d"), ms: DAY },
    { label: t("skip3d"), ms: 3 * DAY },
    { label: t("skip8d"), ms: 8 * DAY },
  ];

  return (
    <div className="fixed bottom-0 right-0 z-50 m-3 max-h-[85dvh] max-w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto">
      <div className="rounded-card border border-border-strong bg-paper">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex min-h-touch w-full items-center justify-between gap-2 rounded-card bg-ink px-4 text-body font-medium text-paper"
        >
          <span className="flex items-center gap-2">
            <Bug aria-hidden="true" className="size-5 shrink-0" />
            debug
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div className="flex flex-col gap-3 p-4">
            <p className="text-note text-gray">
              {t("systemNow")}
              <span className="tabular mt-1 block text-body text-ink">
                {clock}
              </span>
            </p>

            <div className="flex flex-wrap gap-2">
              {jumps.map((jump) => (
                <Button
                  key={jump.ms}
                  look="secondary"
                  disabled={busy}
                  className="px-3 text-note"
                  onClick={() =>
                    withFeedback(
                      async () => (await debug.skipAhead(jump.ms)).jobsRun,
                    )
                  }
                >
                  {jump.label}
                </Button>
              ))}
            </div>

            <Button
              look="secondary"
              icon={Zap}
              fullWidth
              disabled={busy}
              onClick={() =>
                withFeedback(async () => (await debug.runJobs()).jobsRun)
              }
            >
              {t("runJobs")}
            </Button>

            <Button
              look="secondary"
              icon={TimerReset}
              fullWidth
              disabled={busy}
              onClick={() =>
                withFeedback(async () => {
                  await debug.backToRealTime();
                  return [];
                })
              }
            >
              {t("realTime")}
            </Button>

            <p role="status" className="text-note text-gray">
              <span className="font-medium text-ink">{t("jobsRun")}: </span>
              {jobs.length ? jobs.join(" · ") : t("noJobs")}
            </p>

            <Button
              look="secondary"
              icon={MessageSquare}
              fullWidth
              onClick={() => setShowingMessages((value) => !value)}
            >
              {t("messages", { count: messages.data?.length ?? 0 })}
            </Button>

            {showingMessages ? (
              <div className="flex flex-col gap-3">
                <Button
                  look="secondary"
                  icon={Trash2}
                  className="px-3 text-note"
                  onClick={async () => {
                    await api.clearMessages();
                    await messages.reload();
                  }}
                >
                  {tLog("clear")}
                </Button>
                <WhatsappSimulator
                  messages={messages.data ?? []}
                  emptyText={tLog("empty")}
                />
              </div>
            ) : null}

            <Button
              look="secondary"
              icon={Eye}
              fullWidth
              onClick={clearDismissed}
            >
              {t("showHints")}
            </Button>

            <Button
              look="destructive"
              icon={RotateCcw}
              fullWidth
              disabled={busy}
              onClick={() => setConfirmingReset(true)}
            >
              {t("reset")}
            </Button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmingReset}
        title={t("resetConfirm")}
        consequence={t("resetConsequence")}
        confirmLabel={t("reset")}
        onCancel={() => setConfirmingReset(false)}
        onConfirm={async () => {
          await debug.reset();
          setConfirmingReset(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
