"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "next-intl";

import {
  cepDigits,
  composeAddress,
  formatCep,
  useCepLookup,
  type CepAddress,
} from "@/utils/address/cep";
import type { FieldErrors, FieldSpec } from "@/utils/forms/problems";
import { addressPartsSchema, fieldErrors } from "@/utils/validation/booking";

function focusField(id: string) {
  document.getElementById(id)?.focus({ preventScroll: true });
}

export type LookedUp = Exclude<keyof CepAddress, "cep">;
const LOOKED_UP: LookedUp[] = ["street", "neighbourhood", "city", "state"];

export type AddressStart = {
  mode?: "cep" | "manual";
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighbourhood?: string;
  city?: string;
  state?: string;
};

export type AddressForm = ReturnType<typeof useAddressForm>;

export type AddressOptions = {
  onModeSwitch?: () => void;
};

export function useAddressForm(
  start: AddressStart = {},
  { onModeSwitch }: AddressOptions = {},
) {
  const tField = useTranslations("fieldNames");

  const [mode, setMode] = useState<"cep" | "manual">(start.mode ?? "cep");
  const [cep, setCep] = useState(formatCep(start.cep ?? ""));
  const [parts, setParts] = useState<Record<LookedUp, string>>({
    street: start.street ?? "",
    neighbourhood: start.neighbourhood ?? "",
    city: start.city ?? "",
    state: start.state ?? "",
  });
  const [number, setNumber] = useState(start.number ?? "");
  const [complement, setComplement] = useState(start.complement ?? "");

  const digits = cepDigits(cep);
  const lookingUp = mode === "cep" && digits.length === 8;
  const lookup = useCepLookup(lookingUp ? digits : "");

  const searching = lookingUp && lookup.isFetching;
  const found = lookingUp && !searching && lookup.data ? lookup.data : null;
  const notFound =
    lookingUp && !searching && lookup.isSuccess && lookup.data === null;
  const failed = lookingUp && !searching && lookup.isError;
  const showFields =
    mode === "manual" || Boolean(found) || notFound || failed;

  const [settled, setSettled] = useState<{
    cep: string | null;
    filled: Partial<Record<LookedUp, string>>;
  }>({ cep: null, filled: {} });

  const answeredCep = found ? found.cep : notFound || failed ? digits : null;

  if (answeredCep !== null && answeredCep !== settled.cep) {
    const reopening = settled.cep === null && answeredCep === start.cep;
    const next = { ...parts };
    const filled: Partial<Record<LookedUp, string>> = {};

    for (const part of LOOKED_UP) {
      const fromCep = found?.[part];

      if (reopening) {
        if (fromCep && next[part] === fromCep) filled[part] = fromCep;
        continue;
      }

      if (
        settled.filled[part] !== undefined &&
        next[part] === settled.filled[part]
      ) {
        next[part] = "";
      }
      if (fromCep) {
        next[part] = fromCep;
        filled[part] = fromCep;
      }
    }

    if (!reopening) setParts(next);
    setSettled({ cep: answeredCep, filled });
  }

  const foundCep = found?.cep;
  const numberFilled = number.trim().length > 0;
  useEffect(() => {
    if (foundCep && !numberFilled) focusField("address-number");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundCep]);

  function validate(): FieldErrors {
    if (mode === "cep" && digits.length < 8) return { cep: "cepShort" };
    if (!showFields) return {};

    const result = addressPartsSchema.safeParse({
      ...parts,
      number,
      complement,
    });
    return result.success ? {} : fieldErrors(result.error);
  }

  const issues = validate();
  const fields: FieldSpec[] = [
    {
      key: "cep",
      name: tField("cep"),
      target: "address-cep",
      empty: digits.length === 0,
    },
    {
      key: "street",
      name: tField("street"),
      target: "address-street",
      empty: !parts.street.trim(),
    },
    {
      key: "number",
      name: tField("number"),
      target: "address-number",
      empty: !number.trim(),
    },
    { key: "complement", name: tField("complement"), target: "address-complement" },
    {
      key: "neighbourhood",
      name: tField("neighbourhood"),
      target: "address-neighbourhood",
    },
    {
      key: "city",
      name: tField("city"),
      target: "address-city",
      empty: !parts.city.trim(),
    },
    {
      key: "state",
      name: tField("state"),
      target: "address-state",
      empty: !parts.state.trim(),
    },
  ];

  function setPart(part: LookedUp, value: string) {
    setParts((previous) => ({ ...previous, [part]: value }));
  }

  function typeByHand() {
    flushSync(() => {
      setMode("manual");
      onModeSwitch?.();
    });
    focusField("address-street");
  }

  function lookUpByCep() {
    flushSync(() => {
      setMode("cep");
      onModeSwitch?.();
    });
    focusField("address-cep");
  }

  function compose() {
    const result = addressPartsSchema.safeParse({
      ...parts,
      number,
      complement,
    });
    if (!result.success) return null;

    const savedCep = mode === "cep" ? digits : undefined;
    return {
      parts: result.data,
      cep: savedCep,
      mode,
      address: composeAddress({ ...result.data, cep: savedCep }),
    };
  }

  return {
    fromCep: Boolean(found),
    mode,
    cep,
    setCep: (value: string) => setCep(formatCep(value)),
    digits,
    parts,
    setPart,
    number,
    setNumber,
    complement,
    setComplement,
    searching,
    notFound,
    failed,
    showFields,
    issues,
    fields,
    typeByHand,
    lookUpByCep,
    compose,
  };
}
