"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useId,
  type ComponentProps,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/utils/cn";

const BOX =
  "touchable w-full min-h-touch rounded-card border border-border bg-white px-4 py-3 short:py-2.5 focus:border-action text-body text-ink placeholder:text-gray aria-invalid:border-red disabled:bg-surface disabled:text-gray";

function Wrapper({
  id,
  label,
  labelHidden = false,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: ReactNode;
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("ui");

  return (
    <div className="flex flex-col gap-2 short:gap-1">
      <label
        htmlFor={id}
        className={cn(
          labelHidden ? "sr-only" : "text-body font-medium text-ink",
        )}
      >
        {label}
        {optional ? (
          <span className="font-normal text-gray"> ({t("optional")})</span>
        ) : null}
      </label>

      {hint ? (
        <p id={`${id}-hint`} className="text-note text-gray">
          {hint}
        </p>
      ) : null}

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-2 text-note text-red"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  const parts = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

type FieldBase = {
  label: ReactNode;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function TextField({
  label,
  hint,
  error,
  optional,
  className,
  id,
  ...rest
}: FieldBase & ComponentProps<"input">) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <Wrapper
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
    >
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(BOX, className)}
        {...rest}
      />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  labelHidden = false,
  hint,
  error,
  optional,
  className,
  id,
  rows = 4,
  ...rest
}: FieldBase & {
  labelHidden?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const fieldId = id ?? generated;

  return (
    <Wrapper
      id={fieldId}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      optional={optional}
    >
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(BOX, "resize-y", className)}
        {...rest}
      />
    </Wrapper>
  );
}

export function ChoiceField<T extends string>({
  label,
  labelHidden = false,
  hint,
  error,
  name,
  options,
  value,
  onChoose,
  onClear,
}: FieldBase & {
  name: string;
  labelHidden?: boolean;
  options: ReadonlyArray<{ value: T; label: string; detail?: string }>;
  value: T | null;
  onChoose: (value: T) => void;
  onClear?: () => void;
}) {
  const generated = useId();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend
        className={cn(
          labelHidden ? "sr-only" : "mb-2 text-body font-medium text-ink",
        )}
      >
        {label}
      </legend>

      {hint ? <p className="mb-1 text-note text-gray">{hint}</p> : null}

      {options.map((option) => {
        const id = `${generated}-${option.value}`;
        const checked = value === option.value;

        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              "touchable flex min-h-touch cursor-pointer items-start gap-3 rounded-card border px-4 py-4 active:scale-[0.99]",
              checked
                ? "border-action bg-blue-soft shadow-soft"
                : "border-border bg-white",
            )}
          >
            <input
              type="radio"
              id={id}
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChoose(option.value)}
              onClick={
                onClear
                  ? () => {
                      if (checked) onClear();
                    }
                  : undefined
              }
              className="mt-1 size-5 shrink-0 accent-blue"
            />
            <span className="min-w-0">
              <span className="block text-body font-medium text-ink">
                {option.label}
              </span>
              {option.detail ? (
                <span className="block text-note text-gray">
                  {option.detail}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}

      {error ? (
        <p role="alert" className="flex items-start gap-2 text-note text-red">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </fieldset>
  );
}
