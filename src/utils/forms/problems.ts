
export type ProblemKind = "missing" | "invalid" | "rule";

export type FormProblem = {
  name: string;
  target: string;
  kind: ProblemKind;
};

export type FieldSpec = {
  key: string;
  name: string;
  target: string;
  empty?: boolean;
};

export type FieldErrors = Record<string, string | null | undefined>;

export function problemsFrom(
  errors: FieldErrors,
  fields: FieldSpec[],
): FormProblem[] {
  return fields
    .filter((field) => Boolean(errors[field.key]))
    .map((field) => ({
      name: field.name,
      target: field.target,
      kind: field.empty ? "missing" : "invalid",
    }));
}

export function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

export function goToField(id: string | undefined) {
  if (!id || typeof document === "undefined") return;

  const element = document.getElementById(id);
  if (!element) return;

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isControl = element.matches("input, textarea, select, button");
  const focusable = isControl
    ? element
    : element.querySelector<HTMLElement>(
        "input, textarea, select, button:not([disabled])",
      );

  element.scrollIntoView({
    block: isControl ? "center" : "start",
    behavior: still ? "auto" : "smooth",
  });
  focusable?.focus({ preventScroll: true });
}
