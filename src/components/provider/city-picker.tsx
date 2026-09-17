"use client";

import { LoaderCircle, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type KeyboardEvent } from "react";

import { TextField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import {
  formatCity,
  searchCities,
  useCities,
  type City,
  type CityValue,
} from "@/utils/address/cities";
import { cn } from "@/utils/cn";

export function CityPicker({
  id: inputId,
  value,
  onChange,
  error,
}: {
  id?: string;
  value: CityValue;
  onChange: (value: CityValue) => void;
  error?: string;
}) {
  const t = useTranslations("profileFields");
  const id = useId();
  const listId = `${id}-list`;

  const [wanted, setWanted] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const cities = useCities({ enabled: wanted });

  const query = value.cityCode === null ? value.city : "";
  const typed = query.trim().length >= 2;
  const results = cities.data ? searchCities(cities.data, query) : [];

  const searching = open && typed;
  const showList = open && typed && results.length > 0;
  const loadingList = open && typed && cities.isFetching && !cities.data;
  const noMatch = open && typed && cities.isSuccess && results.length === 0;
  const activeCity = results[Math.min(active, results.length - 1)];

  function pick(city: City) {
    onChange({ city: formatCity(city), cityCode: city.code });
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showList) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && activeCity) {
      event.preventDefault();
      pick(activeCity);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <TextField
        id={inputId}
        label={t("cityLabel")}
        hint={cities.isError ? undefined : t("cityHint")}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          showList && activeCity ? `${id}-city-${activeCity.code}` : undefined
        }
        autoComplete="off"
        value={value.city}
        onFocus={() => {
          setWanted(true);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onChange({ city: event.target.value, cityCode: null });
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        error={searching ? undefined : error}
      />

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("cityResults")}
          className="animate-fade overflow-hidden rounded-card border border-border bg-white"
        >
          {results.map((city, index) => (
            <li
              key={city.code}
              id={`${id}-city-${city.code}`}
              role="option"
              aria-selected={city === activeCity}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => pick(city)}
              className={cn(
                "flex min-h-touch cursor-pointer items-center gap-3 border-b border-surface px-4 py-2 last:border-b-0",
                city === activeCity ? "bg-blue-soft" : "bg-white",
              )}
            >
              <MapPin aria-hidden="true" className="size-5 shrink-0 text-blue" />
              <span className="text-body text-ink">
                <span className="font-medium">{city.name}</span>
                <span className="text-gray">, {city.state}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {loadingList ? (
        <p role="status" className="flex items-center gap-2 text-body text-gray">
          <LoaderCircle
            aria-hidden="true"
            className="size-5 shrink-0 animate-spin motion-reduce:animate-none"
          />
          {t("citiesLoading")}
        </p>
      ) : null}

      {noMatch ? (
        <p role="status" className="text-note text-gray">
          {t("cityNoMatch", { query: query.trim() })}
        </p>
      ) : null}

      {cities.isError ? (
        <Notice kind="attention" live>
          {t("citiesFailed")}
        </Notice>
      ) : null}
    </div>
  );
}
