"use client";

import type { ReactNode } from "react";

import { ActionBar } from "@/components/ui/action-bar";
import { FormProblems } from "@/components/ui/form-problems";
import { StepTransition } from "@/components/ui/step-transition";
import type { FormProblem } from "@/utils/forms/problems";

export function AuthShell({
  title,
  subtitle,
  formId,
  onSubmit,
  children,
  footer,
  action,
  note,
  problems = [],
}: {
  title: string;
  subtitle?: string;
  formId: string;
  onSubmit: () => void;
  children: ReactNode;
  footer: ReactNode;
  action: ReactNode;
  note?: ReactNode;
  problems?: FormProblem[];
}) {
  return (
    <main className="mx-auto w-full max-w-136 px-gutter pt-6 short:pt-3 sm:pt-10">
      <StepTransition>
        <h1 className="text-title sm:text-display">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-body text-gray sm:mt-3 sm:text-lead">
            {subtitle}
          </p>
        ) : null}
      </StepTransition>

      <StepTransition order={1}>
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="mt-5 flex flex-col gap-4 short:mt-2 short:gap-2 sm:mt-8 sm:gap-5 sm:rounded-card sm:border sm:border-border sm:bg-white sm:p-6 sm:shadow-soft"
        >
          {children}
        </form>
      </StepTransition>

      <StepTransition order={2}>
        <div className="mt-6 hidden flex-col gap-2 sm:flex">
          <FormProblems problems={problems} />
          {note ? <p className="text-note text-gray">{note}</p> : null}
          {action}
        </div>

        <p className="mt-5 pb-2 text-center text-body text-gray short:mt-2 short:pb-1">
          {footer}
        </p>
      </StepTransition>

      <div className="sm:hidden">
        <ActionBar
          narrow
          note={note}
          alert={<FormProblems problems={problems} />}
        >
          {action}
        </ActionBar>
      </div>
    </main>
  );
}
