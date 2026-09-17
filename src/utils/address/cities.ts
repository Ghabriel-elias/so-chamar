"use client";

import { useQuery } from "@tanstack/react-query";

import { normalizeForSearch } from "@/utils/format/search";

export type City = {
  code: number;
  name: string;
  state: string;
  searchName: string;
};

export type CityValue = { city: string; cityCode: number | null };

const SOURCE =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado";

type IbgeCity = {
  "municipio-id": number;
  "municipio-nome": string;
  "UF-sigla": string;
};

async function fetchCities(): Promise<City[]> {
  const response = await fetch(SOURCE, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`IBGE ${response.status}`);

  const body = (await response.json()) as IbgeCity[];
  return body.map((item) => ({
    code: item["municipio-id"],
    name: item["municipio-nome"],
    state: item["UF-sigla"],
    searchName: normalizeForSearch(item["municipio-nome"]),
  }));
}

export function useCities({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: ["ibge-cities"],
    queryFn: fetchCities,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}

export function formatCity(city: City) {
  return `${city.name}, ${city.state}`;
}

function rank(cities: City[], text: string, state: string | null, limit: number) {
  const scored: Array<{ city: City; score: number }> = [];

  for (const city of cities) {
    if (state && city.state !== state) continue;

    const name = city.searchName;
    const score =
      name === text
        ? 0
        : name.startsWith(text)
          ? 1
          : name.includes(` ${text}`)
            ? 2
            : name.includes(text)
              ? 3
              : -1;

    if (score >= 0) scored.push({ city, score });
  }

  return scored
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.city.name.length - b.city.name.length ||
        a.city.name.localeCompare(b.city.name, "pt-BR") ||
        a.city.state.localeCompare(b.city.state),
    )
    .slice(0, limit)
    .map((item) => item.city);
}

export function searchCities(cities: City[], query: string, limit = 8) {
  const text = normalizeForSearch(query);
  if (text.length < 2) return [];

  const withState = /^(.+) ([a-z]{2})$/.exec(text);
  if (withState) {
    const narrowed = rank(cities, withState[1], withState[2].toUpperCase(), limit);
    if (narrowed.length > 0) return narrowed;
  }

  return rank(cities, text, null, limit);
}

export function cityError(value: CityValue, listFailed: boolean) {
  if (value.city.trim().length < 2) return "cityRequired";
  if (value.cityCode === null && !listFailed) return "cityPick";
  return null;
}
