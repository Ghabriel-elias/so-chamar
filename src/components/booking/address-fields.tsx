"use client";

import { LoaderCircle, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import type { AddressForm } from "@/utils/address/form";
import { cn } from "@/utils/cn";

export function AddressFields({
  form,
  errorFor,
  onDone,
  className,
}: {
  form: AddressForm;
  errorFor: (field: string) => string | undefined;
  onDone?: () => void;
  className?: string;
}) {
  const t = useTranslations("booking");
  const [opened, setOpened] = useState(false);

  const trouble = Boolean(
    errorFor("street") || errorFor("city") || errorFor("state"),
  );
  const collapsed = form.fromCep && !opened && !trouble;

  const place = [
    form.parts.neighbourhood,
    [form.parts.city, form.parts.state].filter(Boolean).join("/"),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {form.mode === "cep" ? (
        <TextField
          id="address-cep"
          label={t("cepLabel")}
          hint={t("cepHint")}
          inputMode="numeric"
          autoComplete="postal-code"
          value={form.cep}
          onChange={(event) => form.setCep(event.target.value)}
          error={errorFor("cep")}
        />
      ) : (
        <Button
          look="plain"
          className="self-start px-0!"
          onClick={form.lookUpByCep}
        >
          {t("useCep")}
        </Button>
      )}

      {form.searching ? (
        <p role="status" className="flex items-center gap-2 text-body text-gray">
          <LoaderCircle
            aria-hidden="true"
            className="size-5 shrink-0 animate-spin motion-reduce:animate-none"
          />
          {t("cepSearching")}
        </p>
      ) : null}

      {form.notFound || form.failed ? (
        <Notice kind="attention" live>
          {form.notFound ? t("cepNotFound") : t("cepFailed")}
        </Notice>
      ) : null}

      {form.mode === "cep" && !form.showFields && !form.searching ? (
        <Button
          look="plain"
          className="self-start px-0!"
          onClick={form.typeByHand}
        >
          {t("noCep")}
        </Button>
      ) : null}

      {form.showFields ? (
        <div className="animate-rise flex flex-col gap-5">
          {collapsed ? (
            <div className="flex items-start gap-3 rounded-card bg-surface px-3 py-2.5">
              <p className="min-w-0 flex-1 text-body text-ink">
                {form.parts.street || t("cepWholeTown")}
                {place ? (
                  <span className="block text-note text-gray">{place}</span>
                ) : null}
              </p>
              <Button
                look="secondary"
                icon={Pencil}
                className="min-h-touch! shrink-0 px-3!"
                onClick={() => setOpened(true)}
              >
                {t("editAddress")}
              </Button>
            </div>
          ) : (
            <>
              <TextField
                id="address-street"
                label={t("streetLabel")}
                autoComplete="address-line1"
                value={form.parts.street}
                onChange={(event) => form.setPart("street", event.target.value)}
                error={errorFor("street")}
              />
              <TextField
                id="address-neighbourhood"
                label={t("neighbourhoodLabel")}
                optional
                autoComplete="address-level3"
                value={form.parts.neighbourhood}
                onChange={(event) =>
                  form.setPart("neighbourhood", event.target.value)
                }
                error={errorFor("neighbourhood")}
              />
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_8rem] sm:gap-3">
                <TextField
                  id="address-city"
                  label={t("cityLabel")}
                  autoComplete="address-level2"
                  value={form.parts.city}
                  onChange={(event) => form.setPart("city", event.target.value)}
                  error={errorFor("city")}
                />
                <TextField
                  id="address-state"
                  label={t("stateLabel")}
                  autoComplete="address-level1"
                  autoCapitalize="characters"
                  maxLength={2}
                  placeholder="SP"
                  value={form.parts.state}
                  onChange={(event) =>
                    form.setPart(
                      "state",
                      event.target.value
                        .replace(/[^a-zA-Z]/g, "")
                        .slice(0, 2)
                        .toUpperCase(),
                    )
                  }
                  error={errorFor("state")}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
            <TextField
              id="address-number"
              label={t("numberLabel")}
              inputMode="numeric"
              value={form.number}
              onChange={(event) => form.setNumber(event.target.value)}
              error={errorFor("number")}
            />
            <TextField
              id="address-complement"
              label={t("complementLabel")}
              optional
              autoComplete="address-line2"
              value={form.complement}
              onChange={(event) => form.setComplement(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && onDone) onDone();
              }}
              error={errorFor("complement")}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
