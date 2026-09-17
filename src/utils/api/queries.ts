"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { MoneyEntryKind } from "@/utils/booking/money";
import { DAY, now } from "@/utils/time/clock";
import { zonedDateKey } from "@/utils/time/zone";

import { messageFrom } from "./errors";
import { api } from "./index";

export const queryKeys = {
  all: ["so-chamar"] as const,
  session: () => [...queryKeys.all, "session"] as const,
  publicPage: (slug: string) => [...queryKeys.all, "public-page", slug] as const,
  openSlots: (
    providerId: string,
    serviceId: string,
    day: string,
    daysAhead: number,
  ) =>
    [...queryKeys.all, "open-slots", providerId, serviceId, day, daysAhead] as const,
  customer: (phone: string) => [...queryKeys.all, "customer", phone] as const,
  bookingByToken: (token: string) =>
    [...queryKeys.all, "booking-by-token", token] as const,
  agenda: (from: string, to: string) =>
    [...queryKeys.all, "agenda", from, to] as const,
  bookings: () => [...queryKeys.all, "bookings"] as const,
  booking: (id: string) => [...queryKeys.all, "booking", id] as const,
  services: () => [...queryKeys.all, "services"] as const,
  categories: () => [...queryKeys.all, "categories"] as const,
  catalog: (categoryId: string) =>
    [...queryKeys.all, "catalog", categoryId] as const,
  workingHours: () => [...queryKeys.all, "working-hours"] as const,
  money: (month = "now") => [...queryKeys.all, "money", month] as const,
  moneyEntries: (kind: string, month = "now") =>
    [...queryKeys.all, "money-entries", kind, month] as const,
  subscription: () => [...queryKeys.all, "subscription"] as const,
  stats: () => [...queryKeys.all, "stats"] as const,
  messages: () => [...queryKeys.all, "messages"] as const,
};

export type Resource<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

function toResource<T>(query: UseQueryResult<T>): Resource<T> {
  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error ? messageFrom(query.error) : null,
    reload: async () => {
      await query.refetch();
    },
  };
}

export function usePublicPage(slug: string) {
  return toResource(
    useQuery({
      queryKey: queryKeys.publicPage(slug),
      queryFn: () => api.getPublicPage(slug),
    }),
  );
}

export function useOpenSlots({
  providerId,
  serviceId,
  daysAhead = 14,
}: {
  providerId: string;
  serviceId: string;
  daysAhead?: number;
}) {
  const day = zonedDateKey(now());

  return toResource(
    useQuery({
      queryKey: queryKeys.openSlots(providerId, serviceId, day, daysAhead),
      queryFn: () => {
        const from = now();
        const to = new Date(from.getTime() + daysAhead * DAY);
        return api.listOpenSlots({
          providerId,
          serviceId,
          from: from.toISOString(),
          to: to.toISOString(),
        });
      },
    }),
  );
}

export function useCustomerLookup(phone: string | undefined) {
  return toResource(
    useQuery({
      queryKey: queryKeys.customer(phone ?? ""),
      queryFn: () => api.lookUpCustomer(phone ?? ""),
      enabled: Boolean(phone),
    }),
  );
}

export function useBookingByToken(
  token: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return toResource(
    useQuery({
      queryKey: queryKeys.bookingByToken(token),
      queryFn: () => api.getByToken(token),
      enabled,
    }),
  );
}

export function useSession() {
  return toResource(
    useQuery({ queryKey: queryKeys.session(), queryFn: () => api.session() }),
  );
}

export function useAgenda(from: Date, to: Date) {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  return toResource(
    useQuery({
      queryKey: queryKeys.agenda(fromIso, toIso),
      queryFn: () => api.listAgenda({ from: fromIso, to: toIso }),
    }),
  );
}

export function useBookings() {
  return toResource(
    useQuery({
      queryKey: queryKeys.bookings(),
      queryFn: () => api.listByState(),
    }),
  );
}

export function useBooking(id: string) {
  return toResource(
    useQuery({
      queryKey: queryKeys.booking(id),
      queryFn: () => api.getBooking(id),
    }),
  );
}

export function useServices() {
  return toResource(
    useQuery({
      queryKey: queryKeys.services(),
      queryFn: () => api.listServices(),
    }),
  );
}

export function useCategories() {
  return toResource(
    useQuery({
      queryKey: queryKeys.categories(),
      queryFn: () => api.listCategories(),
      staleTime: Infinity,
    }),
  );
}

export function useCatalog(categoryId: string | null) {
  return toResource(
    useQuery({
      queryKey: queryKeys.catalog(categoryId ?? ""),
      queryFn: () => api.listCatalogServices(categoryId ?? ""),
      enabled: Boolean(categoryId),
      staleTime: Infinity,
    }),
  );
}

export function useWorkingHours() {
  return toResource(
    useQuery({
      queryKey: queryKeys.workingHours(),
      queryFn: () => api.listWorkingHours(),
    }),
  );
}

export function useMoneyReport(month?: string) {
  return toResource(
    useQuery({
      queryKey: queryKeys.money(month),
      queryFn: () => api.getMoneyReport(month),
    }),
  );
}

export function useMoneyEntries(kind: MoneyEntryKind, month?: string) {
  return toResource(
    useQuery({
      queryKey: queryKeys.moneyEntries(kind, month),
      queryFn: () => api.listMoneyEntries({ kind, month }),
    }),
  );
}

export function useSubscription({ enabled = true }: { enabled?: boolean } = {}) {
  return toResource(
    useQuery({
      queryKey: queryKeys.subscription(),
      queryFn: () => api.getSubscription(),
      enabled,
    }),
  );
}

export function useStats() {
  return toResource(
    useQuery({ queryKey: queryKeys.stats(), queryFn: () => api.getStats() }),
  );
}

export function useMessages() {
  return toResource(
    useQuery({
      queryKey: queryKeys.messages(),
      queryFn: () => api.listMessages(),
    }),
  );
}
