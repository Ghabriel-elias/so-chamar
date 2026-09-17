"use client";

import { Camera, CircleAlert, Images, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Avatar } from "@/components/provider/avatar";
import { Button, ButtonLabel } from "@/components/ui/button";
import { DIALOG_ACTION, InfoDialog } from "@/components/ui/dialog";
import { PHONE, useMedia } from "@/utils/ui/media";
import { PhotoError, preparePhoto } from "@/utils/provider/photo";

export function PhotoPicker({
  id,
  name,
  value,
  onChange,
  hint,
  shape = "row",
}: {
  id: string;
  name: string;
  value: string;
  onChange: (photo: string) => void;
  hint?: string;
  shape?: "row" | "badge";
}) {
  const t = useTranslations("photo");
  const tUi = useTranslations("ui");
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const phone = useMedia(PHONE);
  const [asking, setAsking] = useState(false);
  const cameraId = `${id}-camera`;
  const galleryId = `${id}-gallery`;

  async function pick(file: File | undefined) {
    setAsking(false);
    if (!file) return;
    setProblem(null);
    try {
      onChange(await preparePhoto(file));
    } catch (failure) {
      const reason =
        failure instanceof PhotoError ? failure.reason : ("read" as const);
      setProblem(t(`problem_${reason}` as "problem_read"));
    }
  }

  function start() {
    setProblem(null);
    if (phone) {
      setAsking(true);
      return;
    }
    input.current?.click();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {shape === "badge" ? (
          <button
            type="button"
            id={id}
            aria-label={value ? t("change") : t("choose")}
            onClick={start}
            className="touchable relative shrink-0 rounded-full"
          >
            <Avatar name={name} photo={value} className="size-16 text-title" />
            <span
              aria-hidden="true"
              className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-border bg-white text-ink shadow-soft"
            >
              <Pencil className="size-4" />
            </span>
          </button>
        ) : (
          <Avatar name={name} photo={value} className="size-20 text-title" />
        )}

        {shape === "row" ? (
          <div className="flex min-w-0 flex-col items-start gap-1">
            <Button
              id={id}
              look="secondary"
              icon={Pencil}
              className="min-h-touch!"
              onClick={start}
            >
              {value ? t("change") : t("choose")}
            </Button>

            {value ? (
              <Button
                look="plain"
                icon={Trash2}
                className="px-0! text-note! text-red!"
                onClick={() => {
                  setProblem(null);
                  onChange("");
                }}
              >
                {t("remove")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {hint && !problem ? <p className="text-note text-gray">{hint}</p> : null}

      {problem ? (
        <p role="alert" className="flex items-start gap-2 text-note text-red">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>{problem}</span>
        </p>
      ) : null}

      {phone ? null : (
        <input
          ref={input}
          type="file"
          accept="image/*"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => void pick(event.target.files?.[0])}
        />
      )}

      {phone ? (
        <InfoDialog
          open={asking}
          icon={Camera}
          title={t("sheetTitle")}
          closeLabel={tUi("close")}
          returnFocusId={id}
          onClose={() => setAsking(false)}
          actions={
            <>
              <ButtonLabel
                htmlFor={cameraId}
                look="secondary"
                icon={Camera}
                className={DIALOG_ACTION}
              >
                {t("camera")}
              </ButtonLabel>
              <ButtonLabel
                htmlFor={galleryId}
                look="primary"
                icon={Images}
                className={DIALOG_ACTION}
              >
                {t("gallery")}
              </ButtonLabel>
            </>
          }
        >
          <p className="text-center text-body text-gray">{t("sheetBody")}</p>

          <input
            id={cameraId}
            type="file"
            accept="image/*"
            capture="user"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(event) => void pick(event.target.files?.[0])}
          />
          <input
            id={galleryId}
            type="file"
            accept="image/*"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(event) => void pick(event.target.files?.[0])}
          />
        </InfoDialog>
      ) : null}
    </div>
  );
}
