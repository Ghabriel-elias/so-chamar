"use client";

import { X, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useDragDismiss } from "@/utils/ui/drag-dismiss";
import { PHONE, useMedia } from "@/utils/ui/media";

const CLOSE_MS = 180;

const SIDE_BY_SIDE = "min-h-touch-lg! grow basis-0 whitespace-nowrap px-4!";

export const DIALOG_ACTION = SIDE_BY_SIDE;

const DIALOG =
  "max-h-[90dvh] overflow-y-auto p-0 backdrop:animate-fade backdrop:bg-[rgb(0_0_0/0.6)] backdrop:backdrop-blur-[3px]";

const SHEET =
  "m-0 mt-auto w-full max-w-none animate-slide-up rounded-t-lg rounded-b-none border-0 bg-white shadow-[0_-16px_48px_-8px_rgb(0_0_0/0.35)] data-closing:pointer-events-none data-closing:animate-slide-down data-closing:backdrop:animate-fade-out md:m-auto md:w-[calc(100%-2*var(--spacing-gutter))] md:max-w-120 md:animate-dialog-in md:rounded-lg md:shadow-[0_24px_64px_-12px_rgb(0_0_0/0.45)] md:data-closing:animate-dialog-out";

function Grip() {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 touch-none justify-center pt-2.5 pb-1 md:hidden"
    >
      <span className="h-1 w-9 rounded-full bg-border-strong" />
    </span>
  );
}

function useModal(
  ref: RefObject<HTMLDialogElement | null>,
  {
    open,
    focusId,
    returnFocusId,
  }: {
    open: boolean;
    focusId: string;
    returnFocusId?: string;
  },
) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      delete dialog.dataset.closing;
      if (!dialog.open) {
        dialog.showModal();
        document.getElementById(focusId)?.focus({ preventScroll: true });
      }
      return;
    }

    if (!dialog.open) return;

    function closeNow() {
      if (!dialog) return;
      delete dialog.dataset.closing;
      dialog.close();
      if (returnFocusId) document.getElementById(returnFocusId)?.focus();
    }

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) {
      closeNow();
      return;
    }

    dialog.dataset.closing = "";
    const timer = window.setTimeout(closeNow, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [ref, open, focusId, returnFocusId]);
}

function useKeyboardLift(open: boolean) {
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const view = window.visualViewport;
    if (!open || !view) return;

    function measure() {
      if (!view) return;
      const covered = window.innerHeight - view.height - view.offsetTop;
      setLift(covered > 24 ? Math.round(covered) : 0);
    }

    view.addEventListener("resize", measure);
    view.addEventListener("scroll", measure);

    return () => {
      view.removeEventListener("resize", measure);
      view.removeEventListener("scroll", measure);
      setLift(0);
    };
  }, [open]);

  return lift;
}

function DialogIcon({
  icon: Icon,
  tone,
}: {
  icon: LucideIcon;
  tone: "red" | "blue";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex size-16 shrink-0 animate-icon-in items-center justify-center rounded-full",
        tone === "red" ? "bg-red-soft text-red" : "bg-blue-soft text-blue",
      )}
    >
      <span
        className={cn(
          "absolute inset-0 animate-halo rounded-full",
          tone === "red" ? "bg-red/30" : "bg-blue/30",
        )}
      />
      <Icon className="relative size-8" strokeWidth={2.25} />
    </span>
  );
}

export function InfoDialog({
  open,
  title,
  closeLabel,
  onClose,
  icon,
  returnFocusId,
  actions,
  children,
}: {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  actions?: ReactNode;
  icon?: LucideIcon;
  returnFocusId?: string;
  children: ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useModal(ref, { open, focusId: `${id}-close`, returnFocusId });

  const phone = useMedia(PHONE);
  const drag = useDragDismiss(ref, {
    open,
    axis: "y",
    towards: 1,
    onDismiss: onClose,
    enabled: phone,
  });

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      {...drag}
      className={cn(DIALOG, SHEET, "overflow-hidden!")}
    >
      <div className="relative flex max-h-[90dvh] flex-col">
        <Grip />
        {actions ? (
          <button
            id={`${id}-close`}
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="touchable absolute top-3 right-2 z-10 flex size-12 items-center justify-center rounded-full text-gray hover:bg-surface active:bg-surface md:top-2"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        <div className="flex flex-col gap-4 overflow-y-auto px-6 pt-5 pb-4 md:pt-8">
          {icon ? (
            <div className="flex justify-center">
              <DialogIcon icon={icon} tone="blue" />
            </div>
          ) : null}
          <h2 id={`${id}-title`} className="text-center text-title">
            {title}
          </h2>
          <div>{children}</div>
        </div>
        <div className="border-t border-border px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-6">
          {actions ? (
            <div className="flex w-full flex-wrap gap-3">{actions}</div>
          ) : (
            <Button
              id={`${id}-close`}
              look="primary"
              fullWidth
              onClick={onClose}
            >
              {closeLabel}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}

export function FormDialog({
  open,
  title,
  closeLabel,
  onClose,
  focusId,
  returnFocusId,
  children,
}: {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  focusId?: string;
  returnFocusId?: string;
  children: ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useModal(ref, {
    open,
    focusId: focusId ?? `${id}-close`,
    returnFocusId,
  });

  const phone = useMedia(PHONE);
  const drag = useDragDismiss(ref, {
    open,
    axis: "y",
    towards: 1,
    onDismiss: onClose,
    enabled: phone,
  });
  const lift = useKeyboardLift(open);

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      style={lift ? { marginBottom: lift } : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      {...drag}
      className={cn(DIALOG, SHEET, "overflow-hidden!")}
    >
      <div className="relative flex max-h-[90dvh] flex-col">
        <Grip />
        <button
          id={`${id}-close`}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="touchable absolute top-3 right-2 z-10 flex size-12 items-center justify-center rounded-full text-gray hover:bg-surface active:bg-surface md:top-2"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <div className="overflow-y-auto px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pt-8 md:pb-6">
          <h2 id={`${id}-title`} className="pr-10 text-title">
            {title}
          </h2>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  consequence,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = true,
  loading = false,
  icon,
  failure,
  returnFocusId,
  cancelLabel,
}: {
  open: boolean;
  title: string;
  consequence: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  failure?: string | null;
  returnFocusId?: string;
}) {
  const t = useTranslations("ui");
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);

  useModal(ref, { open, focusId: `${id}-back`, returnFocusId });

  const phone = useMedia(PHONE);
  const drag = useDragDismiss(ref, {
    open,
    axis: "y",
    towards: 1,
    onDismiss: onCancel,
    enabled: phone,
  });

  const back = (
    <Button
      id={`${id}-back`}
      look="secondary"
      disabled={loading}
      className={SIDE_BY_SIDE}
      onClick={onCancel}
    >
      {cancelLabel ?? t("back")}
    </Button>
  );

  const confirm = (
    <Button
      look={destructive ? "destructive_solid" : "primary"}
      loading={loading}
      className={SIDE_BY_SIDE}
      onClick={onConfirm}
    >
      {confirmLabel}
    </Button>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-consequence`}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onCancel();
      }}
      {...drag}
      className={cn(DIALOG, SHEET)}
    >
      <Grip />
      <div className="flex flex-col items-center gap-4 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center md:pt-8 md:pb-6">
        {icon ? (
          <DialogIcon icon={icon} tone={destructive ? "red" : "blue"} />
        ) : null}

        <h2 id={`${id}-title`} className="text-title">
          {title}
        </h2>
        <p
          id={`${id}-consequence`}
          className="text-body text-gray"
        >
          {consequence}
        </p>

        {failure ? (
          <p role="alert" className="text-body text-red">
            {failure}
          </p>
        ) : null}

        <div className="mt-2 flex w-full flex-wrap gap-3">
          {back}
          {confirm}
        </div>
      </div>
    </dialog>
  );
}
