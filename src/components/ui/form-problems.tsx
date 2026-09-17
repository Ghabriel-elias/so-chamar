"use client";

import { CircleAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { cn } from "@/utils/cn";
import { goToField, type FormProblem } from "@/utils/forms/problems";

export function FormProblems({
  problems,
  className,
}: {
  problems: FormProblem[];
  className?: string;
}) {
  const t = useTranslations("formProblems");
  const format = useFormatter();

  if (problems.length === 0) return null;

  const names = (kind: FormProblem["kind"]) =>
    problems.filter((problem) => problem.kind === kind).map((p) => p.name);
  const missing = names("missing");
  const invalid = names("invalid");
  const rules = names("rule");

  return (
    <div role="alert" className={cn("animate-rise", className)}>
      <button
        type="button"
        onClick={() => goToField(problems[0].target)}
        className="touchable flex w-full items-start gap-2 rounded-card border border-red bg-red-soft px-3 py-2 text-left text-note text-red"
      >
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          {missing.length > 0 ? (
            <span className="block font-semibold">
              {t("missing", {
                count: missing.length,
                fields: format.list(missing, { type: "conjunction" }),
              })}
            </span>
          ) : null}
          {invalid.length > 0 ? (
            <span className="block font-semibold">
              {t("invalid", {
                count: invalid.length,
                fields: format.list(invalid, { type: "conjunction" }),
              })}
            </span>
          ) : null}
          {rules.map((rule) => (
            <span key={rule} className="block font-semibold">
              {rule}
            </span>
          ))}
          <span className="block underline underline-offset-2">
            {t("goTo")}
          </span>
        </span>
      </button>
    </div>
  );
}
