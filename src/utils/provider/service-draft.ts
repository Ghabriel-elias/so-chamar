"use client";

import { useState } from "react";

import { api } from "@/utils/api";
import type { CatalogService } from "@/utils/catalog/catalog";
import type { Cents } from "@/types/booking";
import type { Service } from "@/types/provider";

type Mark = { item: CatalogService; on: boolean };

export type ServiceDraft = {
  picked: (catalogId: string) => boolean;
  priceOf: (item: CatalogService) => Cents;
  toggle: (item: CatalogService) => void;
  setPrice: (item: CatalogService, price: Cents) => void;
  pickedIds: string[];
  count: number;
  dirty: boolean;
  commit: () => Promise<void>;
};

export function useServiceDraft(services: Service[]): ServiceDraft {
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [prices, setPrices] = useState<Record<string, Cents>>({});

  const saved = (catalogId: string) =>
    services.find((service) => service.catalogId === catalogId) ?? null;

  const picked = (catalogId: string) =>
    marks[catalogId]?.on ?? Boolean(saved(catalogId));

  const priceOf = (item: CatalogService) =>
    prices[item.id] ?? saved(item.id)?.priceFrom ?? item.priceFrom;

  const toggle = (item: CatalogService) =>
    setMarks((was) => ({ ...was, [item.id]: { item, on: !picked(item.id) } }));

  const setPrice = (item: CatalogService, price: Cents) => {
    setPrices((was) => ({ ...was, [item.id]: price }));
    if (!picked(item.id)) toggle(item);
  };

  const touched = new Set([
    ...services.map((service) => service.catalogId),
    ...Object.keys(marks),
    ...Object.keys(prices),
  ]);

  const movedPrice = (catalogId: string) => {
    const already = saved(catalogId);
    const typed = prices[catalogId];
    return (
      already !== null && typed !== undefined && typed !== already.priceFrom
    );
  };

  const pickedIds = [...touched].filter(picked);
  const count = pickedIds.length;
  const dirty = [...touched].some(
    (id) => picked(id) !== Boolean(saved(id)) || movedPrice(id),
  );

  async function commit() {
    for (const id of touched) {
      const already = saved(id);
      const on = picked(id);
      const item = marks[id]?.item;

      if (on && !already && item) {
        await api.saveService({
          catalogId: id,
          name: item.name,
          priceFrom: priceOf(item),
          durationMinutes: item.durationMinutes,
          active: true,
        });
      } else if (!on && already) {
        await api.removeService(already.id);
      } else if (on && already && movedPrice(id)) {
        await api.saveService({
          id: already.id,
          catalogId: id,
          name: already.name,
          priceFrom: prices[id],
          durationMinutes: already.durationMinutes,
          active: true,
        });
      }
    }

    setMarks({});
    setPrices({});
  }

  return { picked, priceOf, toggle, setPrice, pickedIds, count, dirty, commit };
}
