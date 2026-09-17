"use client";

import { MessageSquare, UserRound, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/utils/cn";
import { isDateVariable, isMoneyVariable } from "@/utils/whatsapp/templates";
import type { WhatsappMessage } from "@/types/provider";

function prepareVariables(variables: Record<string, string | number>) {
  const ready: Record<string, string | number | Date> = {};

  for (const [key, value] of Object.entries(variables)) {
    if (isMoneyVariable(key)) {
      ready[key] = Number(value) / 100;
    } else if (isDateVariable(key)) {
      ready[key] = new Date(String(value));
    } else {
      ready[key] = value;
    }
  }

  return ready;
}

export function WhatsappSimulator({
  messages,
  emptyText,
}: {
  messages: WhatsappMessage[];
  emptyText: string;
}) {
  const t = useTranslations("whatsapp");
  const tLog = useTranslations("whatsappLog");

  if (messages.length === 0) {
    return (
      <p className="rounded-card border border-border bg-surface px-4 py-6 text-center text-body text-gray">
        {emptyText}
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {messages.map((message) => {
        const toCustomer = message.target === "customer";
        const Icon = toCustomer ? UserRound : Wrench;

        return (
          <li
            key={message.id}
            className={cn(
              "rounded-card border px-4 py-3",
              toCustomer
                ? "border-green bg-green-soft"
                : "border-blue bg-blue-soft",
            )}
          >
            <p className="flex flex-wrap items-center gap-2 text-note text-gray">
              <MessageSquare aria-hidden="true" className="size-5 shrink-0" />
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className="font-medium text-ink">
                {toCustomer ? tLog("toCustomer") : tLog("toProvider")}
              </span>
              <span>{message.phone}</span>
              <span className="tabular">{message.template}</span>
            </p>

            <p className="mt-2 text-body text-ink">
              {t(message.template, prepareVariables(message.variables))}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
