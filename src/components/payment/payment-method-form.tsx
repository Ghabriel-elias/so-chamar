"use client";

import { Check, Copy, CreditCard, Lock, QrCode, WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { FakeQr } from "@/components/customer/fake-qr";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { cn } from "@/utils/cn";
import type { FieldSpec } from "@/utils/forms/problems";
import {
  CARD_FIELDS,
  cardDigits,
  cardFieldEmpty,
  cardProblems,
  cvvDigits,
  expiryDigits,
  formatCardNumber,
  formatExpiry,
  type CardField,
  type CardInput,
} from "@/utils/payments/card";
import type { PaymentMethod } from "@/types/booking";
import { copyText } from "@/utils/ui/clipboard";

const METHODS = [
  { value: "pix", icon: QrCode },
  { value: "credit_card", icon: CreditCard },
  { value: "debit_card", icon: WalletCards },
] as const satisfies ReadonlyArray<{ value: PaymentMethod; icon: unknown }>;

export function cardFieldSpecs(
  names: Record<CardField, string>,
  idPrefix: string,
  card: CardInput,
): FieldSpec[] {
  return CARD_FIELDS.map((field) => ({
    key: field,
    name: names[field],
    target: `${idPrefix}-${field}`,
    empty: cardFieldEmpty(card, field),
  }));
}

export function PaymentMethodForm({
  method,
  onMethodChange,
  card,
  onCardChange,
  pixSeed,
  pixCode,
  allowCard = true,
  idPrefix = "card",
  errors,
  className,
}: {
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  card: CardInput;
  onCardChange: (card: CardInput) => void;
  pixSeed: string;
  pixCode: string;
  allowCard?: boolean;
  idPrefix?: string;
  errors?: Partial<Record<CardField, string>>;
  className?: string;
}) {
  const t = useTranslations("payment");
  const [copied, setCopied] = useState(false);

  const byCard = allowCard && method !== "pix";
  const live = cardProblems(card);

  function update(field: keyof CardInput, value: string) {
    onCardChange({ ...card, [field]: value });
  }

  const errorFor = (field: CardField) => {
    const key =
      errors?.[field] ??
      (field === "number" ? live.number : field === "expiry" ? live.expiry : undefined);
    return key ? t(key as "cardNumberInvalid") : undefined;
  };

  async function copy() {
    if (!(await copyText(pixCode))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className={className}>
      {allowCard ? (
        <fieldset>
          <legend className="mb-2 text-body font-medium text-ink">
            {t("methodLabel")}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(({ value, icon: Icon }) => {
              const checked = method === value;

              return (
                <label
                  key={value}
                  className={cn(
                    "touchable flex min-h-touch cursor-pointer flex-col items-center justify-center gap-1 rounded-card border px-2 py-3 text-center text-note font-medium transition-colors duration-200 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue active:scale-[0.98]",
                    checked
                      ? "border-action bg-blue-soft text-ink shadow-soft"
                      : "border-border bg-white text-gray",
                  )}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={value}
                    checked={checked}
                    onChange={() => onMethodChange(value)}
                    className="sr-only"
                  />
                  <Icon
                    aria-hidden="true"
                    className={cn("size-6", checked ? "text-blue" : "text-gray")}
                  />
                  {t(`method_${value}`)}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {byCard ? (
        <div key={method} className="mt-6 flex animate-rise flex-col gap-5">
          <TextField
            id={`${idPrefix}-number`}
            label={t("cardNumber")}
            inputMode="numeric"
            autoComplete="cc-number"
            value={formatCardNumber(card.number)}
            onChange={(event) => update("number", cardDigits(event.target.value))}
            error={errorFor("number")}
          />
          <TextField
            id={`${idPrefix}-name`}
            label={t("cardName")}
            hint={t("cardNameHint")}
            autoComplete="cc-name"
            autoCapitalize="characters"
            value={card.name}
            onChange={(event) => update("name", event.target.value)}
            error={errorFor("name")}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id={`${idPrefix}-expiry`}
              label={t("cardExpiry")}
              inputMode="numeric"
              autoComplete="cc-exp"
              value={formatExpiry(card.expiry)}
              onChange={(event) =>
                update("expiry", expiryDigits(event.target.value))
              }
              error={errorFor("expiry")}
            />
            <TextField
              id={`${idPrefix}-cvv`}
              label={t("cardCvv")}
              inputMode="numeric"
              autoComplete="cc-csc"
              value={card.cvv}
              onChange={(event) => update("cvv", cvvDigits(event.target.value))}
              error={errorFor("cvv")}
            />
          </div>

          {method === "debit_card" ? (
            <p className="text-note text-gray">{t("debitNote")}</p>
          ) : null}

          <p className="flex items-start gap-2 text-note text-gray">
            <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {t("cardSafe")}
          </p>
        </div>
      ) : (
        <>
          <div className={allowCard ? "mt-8" : undefined}>
            <FakeQr seed={pixSeed} label={t("qrLabel")} />
          </div>

          <div className="mt-6">
            <Button
              look="secondary"
              fullWidth
              icon={copied ? Check : Copy}
              onClick={copy}
            >
              {copied ? t("copied") : t("copyCode")}
            </Button>
            <p className="tabular mt-2 break-all text-note text-gray">
              {pixCode}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
