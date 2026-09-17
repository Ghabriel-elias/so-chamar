"use client";

import { Check, CircleAlert, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { FormProblems } from "@/components/ui/form-problems";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody } from "@/components/ui/sheet";
import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { DEFAULT_LUNCH, turnDayOn } from "@/utils/booking/hours";
import { cn } from "@/utils/cn";
import { goToField, type FormProblem } from "@/utils/forms/problems";
import type { WorkingHours } from "@/types/provider";

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function openPicker(event: { currentTarget: HTMLInputElement }) {
  try {
    event.currentTarget.showPicker();
  } catch {
  }
}

const TIME_INPUT =
  "tabular touchable mt-1 min-h-touch w-full rounded-card border border-border bg-white px-4 text-body focus:border-action aria-invalid:border-red";

function problemOf(entry: WorkingHours) {
  if (!entry.active) return null;
  if (entry.start >= entry.end) return "hoursInvalid" as const;

  const lunch = entry.lunch;
  if (
    lunch &&
    !(entry.start < lunch.start && lunch.start < lunch.end && lunch.end < entry.end)
  ) {
    return "lunchInvalid" as const;
  }

  return null;
}

function TimeRange({
  id,
  fromLabel,
  toLabel,
  start,
  end,
  invalid,
  onChange,
}: {
  id: string;
  fromLabel: string;
  toLabel: string;
  start: string;
  end: string;
  invalid: boolean;
  onChange: (range: { start: string; end: string }) => void;
}) {
  return (
    <div className="flex gap-3">
      <label className="flex-1">
        <span className="block text-note text-gray">{fromLabel}</span>
        <input
          id={`${id}-start`}
          type="time"
          value={start}
          aria-invalid={invalid || undefined}
          onPointerDown={openPicker}
          onFocus={openPicker}
          onChange={(event) => onChange({ start: event.target.value, end })}
          className={TIME_INPUT}
        />
      </label>
      <label className="flex-1">
        <span className="block text-note text-gray">{toLabel}</span>
        <input
          id={`${id}-end`}
          type="time"
          value={end}
          aria-invalid={invalid || undefined}
          onPointerDown={openPicker}
          onFocus={openPicker}
          onChange={(event) => onChange({ start, end: event.target.value })}
          className={TIME_INPUT}
        />
      </label>
    </div>
  );
}

export function WorkingHoursForm({
  hours,
  onSaved,
  saveLabel,
  onBack,
  backLabel,
  bar,
  className,
}: {
  hours: WorkingHours[];
  onSaved: () => Promise<void> | void;
  saveLabel?: string;
  onBack?: () => void;
  backLabel?: string;
  bar?: { enter: boolean; aboveNav?: boolean };
  className?: string;
}) {
  const t = useTranslations("panel.settings");
  const tField = useTranslations("fieldNames");
  const formId = useId();

  const [draft, setDraft] = useState(hours);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  function update(id: string, changes: Partial<WorkingHours>) {
    setSaved(false);
    setCopiedFrom(null);
    setDraft((previous) =>
      previous.map((entry) =>
        entry.id === id ? { ...entry, ...changes } : entry,
      ),
    );
  }

  function copyToOthers(source: WorkingHours) {
    setSaved(false);
    setDraft((previous) =>
      previous.map((entry) =>
        entry.id === source.id || !entry.active
          ? entry
          : {
              ...entry,
              start: source.start,
              end: source.end,
              lunch: source.lunch ? { ...source.lunch } : null,
            },
      ),
    );
    setCopiedFrom(source.id);
  }

  const ordered = [...draft].sort((a, b) => a.weekday - b.weekday);
  const workingDays = draft.filter((entry) => entry.active).length;
  const hasProblems = draft.some((entry) => problemOf(entry) !== null);

  const rangeId = (entry: WorkingHours, part: "hours" | "lunch") =>
    `${formId}-${entry.id}-${part}`;
  const problems: FormProblem[] = attempted
    ? ordered.flatMap((entry) => {
        const problem = problemOf(entry);
        if (!problem) return [];
        const day = t(WEEKDAY_KEYS[entry.weekday]);
        const lunch = problem === "lunchInvalid";
        return [
          {
            name: tField(lunch ? "lunchOfDay" : "hoursOfDay", { day }),
            target: `${rangeId(entry, lunch ? "lunch" : "hours")}-start`,
            kind: "invalid" as const,
          },
        ];
      })
    : [];

  async function save() {
    if (hasProblems) {
      setAttempted(true);
      const first = ordered.find((entry) => problemOf(entry) !== null);
      if (first) {
        const part = problemOf(first) === "lunchInvalid" ? "lunch" : "hours";
        goToField(`${rangeId(first, part)}-start`);
      }
      return;
    }

    setBusy(true);
    setFailure(null);
    try {
      await api.saveWorkingHours(draft);
      setSaved(true);
      await onSaved();
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setBusy(false);
    }
  }

  const actions = (
    <div className="flex gap-2">
      {onBack ? (
        <Button
          look="secondary"
          onClick={onBack}
          className="min-h-touch-lg flex-1"
        >
          {backLabel}
        </Button>
      ) : null}
      <Button
        look="primary"
        icon={saved ? Check : undefined}
        loading={busy}
        className="flex-2"
        onClick={save}
      >
        {saved ? t("savedHours") : (saveLabel ?? t("saveHours"))}
      </Button>
    </div>
  );

  const days = (
    <div className={cn("flex flex-col gap-3", className)}>
      <Notice kind="info">{t("hoursNote")}</Notice>

      {ordered.map((entry, index) => {
        const problem = problemOf(entry);

        return (
          <div
            key={entry.id}
            style={{ "--index": Math.min(index, 6) } as React.CSSProperties}
            className="stagger"
          >
            <Sheet>
              <SheetBody className="flex flex-col gap-3">
                <label className="flex min-h-touch items-center gap-3">
                  <input
                    type="checkbox"
                    checked={entry.active}
                    onChange={(event) =>
                      update(
                        entry.id,
                        event.target.checked
                          ? turnDayOn(entry)
                          : { active: false },
                      )
                    }
                    className="size-6 shrink-0 accent-blue"
                  />
                  <span className="text-lead capitalize">
                    {t(WEEKDAY_KEYS[entry.weekday])}
                  </span>
                </label>

                {entry.active ? (
                  <>
                    <TimeRange
                      id={rangeId(entry, "hours")}
                      fromLabel={t("from")}
                      toLabel={t("to")}
                      start={entry.start}
                      end={entry.end}
                      invalid={problem === "hoursInvalid"}
                      onChange={(range) => update(entry.id, range)}
                    />

                    <label className="flex min-h-touch items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(entry.lunch)}
                        onChange={(event) =>
                          update(entry.id, {
                            lunch: event.target.checked
                              ? { ...DEFAULT_LUNCH }
                              : null,
                          })
                        }
                        className="size-6 shrink-0 accent-blue"
                      />
                      <span className="text-body text-ink">
                        {t("lunchLabel")}
                      </span>
                    </label>

                    {entry.lunch ? (
                      <TimeRange
                        id={rangeId(entry, "lunch")}
                        fromLabel={t("from")}
                        toLabel={t("to")}
                        start={entry.lunch.start}
                        end={entry.lunch.end}
                        invalid={problem === "lunchInvalid"}
                        onChange={(range) => update(entry.id, { lunch: range })}
                      />
                    ) : null}

                    {problem ? (
                      <p
                        role="alert"
                        className="flex items-start gap-2 text-note text-red"
                      >
                        <CircleAlert
                          aria-hidden="true"
                          className="mt-0.5 size-5 shrink-0"
                        />
                        <span>{t(problem)}</span>
                      </p>
                    ) : null}

                    {workingDays > 1 ? (
                      <Button
                        look="plain"
                        icon={copiedFrom === entry.id ? Check : Copy}
                        disabled={problem !== null}
                        className="self-start px-0!"
                        onClick={() => copyToOthers(entry)}
                      >
                        {copiedFrom === entry.id
                          ? t("copiedToOthers")
                          : t("copyToOthers")}
                      </Button>
                    ) : null}

                    {copiedFrom === entry.id ? (
                      <p role="status" className="sr-only">
                        {t("copiedToOthers")}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-body text-gray">{t("dayOff")}</p>
                )}
              </SheetBody>
            </Sheet>
          </div>
        );
      })}

      {failure ? (
        <Notice kind="error" live>
          {failure}
        </Notice>
      ) : null}

      {bar ? null : (
        <>
          <FormProblems problems={problems} />
          {actions}
        </>
      )}
    </div>
  );

  if (!bar) return days;

  return (
    <>
      {days}
      <ActionBar
        narrow={!bar.aboveNav}
        aboveNav={bar.aboveNav}
        enter={bar.enter}
        alert={<FormProblems problems={problems} />}
      >
        {actions}
      </ActionBar>
    </>
  );
}
