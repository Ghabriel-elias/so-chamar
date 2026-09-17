"use client";

import { useQuery } from "@tanstack/react-query";

export type CepAddress = {
  cep: string;
  street: string;
  neighbourhood: string;
  city: string;
  state: string;
};

export function cepDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(value: string) {
  const digits = cepDigits(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

async function viaCep(digits: string): Promise<CepAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`ViaCEP ${response.status}`);

  const body = await response.json();
  if (body.erro === true || body.erro === "true") return null;

  return {
    cep: digits,
    street: body.logradouro ?? "",
    neighbourhood: body.bairro ?? "",
    city: body.localidade ?? "",
    state: body.uf ?? "",
  };
}

async function brasilApi(digits: string): Promise<CepAddress | null> {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
    signal: AbortSignal.timeout(6000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`BrasilAPI ${response.status}`);

  const body = await response.json();
  return {
    cep: digits,
    street: body.street ?? "",
    neighbourhood: body.neighborhood ?? "",
    city: body.city ?? "",
    state: body.state ?? "",
  };
}

export async function lookUpCep(digits: string): Promise<CepAddress | null> {
  try {
    return await viaCep(digits);
  } catch {
    return brasilApi(digits);
  }
}

export function useCepLookup(cep: string) {
  const digits = cepDigits(cep);

  return useQuery({
    queryKey: ["cep", digits],
    queryFn: () => lookUpCep(digits),
    enabled: digits.length === 8,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: false,
  });
}

export function composeAddress(parts: {
  cep?: string;
  street: string;
  number: string;
  complement?: string;
  neighbourhood?: string;
  city: string;
  state: string;
}) {
  const line = [parts.street, parts.number, parts.complement]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  const place = [
    parts.neighbourhood?.trim(),
    [parts.city, parts.state].filter(Boolean).join("/"),
  ]
    .filter(Boolean)
    .join(", ");

  const address = [line, place].filter(Boolean).join(" — ");
  return parts.cep ? `${address} · CEP ${formatCep(parts.cep)}` : address;
}
