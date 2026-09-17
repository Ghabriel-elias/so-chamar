"use client";

import { useId, type CSSProperties } from "react";

export function RangeField({
  id: given,
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  valueText,
  detail,
  minText,
  maxText,
  disabled = false,
}: {
  id?: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  valueText: string;
  detail?: string;
  minText: string;
  maxText: string;
  disabled?: boolean;
}) {
  const own = useId();
  const id = given ?? own;
  const fill = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-body font-medium text-ink">
          {label}
        </label>
        <span aria-hidden="true" className="tabular text-lead text-ink">
          {valueText}
        </span>
      </div>

      {hint ? (
        <p id={`${id}-hint`} className="text-note text-gray">
          {hint}
        </p>
      ) : null}

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={detail ? `${valueText}, ${detail}` : valueText}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ "--fill": `${fill}%` } as CSSProperties}
        className="range h-touch w-full cursor-pointer disabled:cursor-not-allowed"
      />

      <div
        aria-hidden="true"
        className="-mt-1 flex justify-between text-note text-gray"
      >
        <span>{minText}</span>
        <span>{maxText}</span>
      </div>

      {detail ? <p className="text-body text-ink">{detail}</p> : null}
    </div>
  );
}
