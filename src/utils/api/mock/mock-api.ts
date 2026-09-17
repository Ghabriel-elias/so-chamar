import {
  computeAmounts,
  initialPayments,
  moneyLines,
  moveMoney,
  summariseMoney,
} from "@/utils/booking/money";
import {
  availableTriggers,
  initialState,
  type Trigger,
} from "@/utils/booking/machine";
import {
  chargesThroughApp,
  clampDeposit,
  DEFAULT_DEPOSIT,
  MONTHLY_FEE_CENTS,
  mustPayInFull,
  paymentDueAt,
  paymentWindowOver,
  publicDepositMode,
  subscriptionAccess,
  TRIAL_DAYS,
} from "@/utils/booking/rules";
import { DEFAULT_DAY, DEFAULT_LUNCH, lunchOf } from "@/utils/booking/hours";
import { CATALOG_CATEGORIES, CATALOG_SERVICES } from "@/utils/catalog/catalog";
import { digitsOnly, isValidPhone } from "@/utils/format/phone";
import { normalizeForSearch } from "@/utils/format/search";
import { backToRealTime, DAY, now, nowIso, skipAhead } from "@/utils/time/clock";
import { isMonthKey } from "@/utils/time/month";
import {
  zonedDateKey,
  zonedInstant,
  zonedMonthKey,
  zonedWeekday,
} from "@/utils/time/zone";
import {
  ApiError,
  type AgendaItem,
  type Api,
  type BookingDetail,
  type CustomerView,
  type DebugApi,
  type MoneyReport,
  type NewManualBooking,
  type NewPublicBooking,
  type OpenSlot,
  type PublicPage,
} from "@/utils/api/contract";
import type {
  Booking,
  DepositMode,
  Review,
  Timestamp,
} from "@/types/booking";
import type {
  Customer,
  Provider,
  ProviderStats,
  Service,
  Weekday,
  WorkingHours,
} from "@/types/provider";

import {
  dumpStore,
  getStore,
  newId,
  persist,
  resetStore,
  write,
} from "./store";
import type { Store } from "./fixtures";
import { expireUnpaidDeposits, runJobs } from "./jobs";
import { wait } from "./latency";
import {
  fireTrigger,
  queueConfirmation,
  queuePaymentPending,
} from "./engine";

function serviceOf(store: Store, id: string) {
  const service = store.services.find((record) => record.id === id);
  if (!service) throw new ApiError("not_found", "Serviço não encontrado.");
  return service;
}

function moneyOf(store: Store, providerId: string) {
  const bookings = store.bookings.filter(
    (booking) => booking.providerId === providerId,
  );
  const ids = new Set(bookings.map((booking) => booking.id));
  return {
    bookings,
    payments: store.payments.filter((payment) => ids.has(payment.bookingId)),
  };
}

function paymentsOf(store: Store, bookingId: string) {
  return store.payments.filter((payment) => payment.bookingId === bookingId);
}

function customerOf(store: Store, phone: string): Customer | null {
  return store.customers.find((customer) => customer.phone === phone) ?? null;
}

function pendingPaymentOf(store: Store, phone: string): Booking | null {
  return (
    store.bookings
      .filter(
        (booking) =>
          booking.customerPhone === phone &&
          booking.state === "pending_payment" &&
          booking.paymentDueAt !== undefined,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}

function computeStats(store: Store, providerId: string): ProviderStats {
  const reviews = store.reviews.filter(
    (review) => review.providerId === providerId,
  );
  const rating = reviews.length
    ? reviews.reduce((total, item) => total + item.rating, 0) / reviews.length
    : 0;

  const relevant = store.bookings.filter(
    (booking) =>
      booking.providerId === providerId &&
      booking.state !== "pending_payment" &&
      booking.state !== "payment_expired",
  );

  const showedUp = relevant.filter((booking) =>
    [
      "in_progress",
      "finished",
      "paid",
      "reviewed",
      "unpaid",
      "disputed",
    ].includes(booking.state),
  ).length;

  const noShows = relevant.filter(
    (booking) => booking.state === "provider_no_show",
  ).length;

  const cancelledByHim = relevant.filter(
    (booking) => booking.state === "cancelled_by_provider",
  ).length;

  const showUpBase = showedUp + noShows;

  return {
    rating: Number(rating.toFixed(1)),
    reviewCount: reviews.length,
    showUpRate: showUpBase ? Math.round((showedUp / showUpBase) * 100) : null,
    cancellationRate: relevant.length
      ? Math.round((cancelledByHim / relevant.length) * 100)
      : 0,
    jobCount: showedUp,
  };
}

function byToken(store: Store, token: string) {
  const booking = store.bookings.find(
    (record) => record.customerToken === token,
  );
  if (!booking) {
    throw new ApiError("not_found", "Este link não existe mais.");
  }
  return booking;
}

function buildCustomerView(store: Store, booking: Booking): CustomerView {
  return {
    booking,
    service: serviceOf(store, booking.serviceId),
    provider: providerById(store, booking.providerId),
    stats: computeStats(store, booking.providerId),
    payments: paymentsOf(store, booking.id),
    review:
      store.reviews.find((review) => review.bookingId === booking.id) ?? null,
    actions: availableTriggers(booking, "customer"),
  };
}

function buildDetail(store: Store, booking: Booking): BookingDetail {
  return {
    booking,
    service: serviceOf(store, booking.serviceId),
    payments: paymentsOf(store, booking.id),
    customer: customerOf(store, booking.customerPhone),
    review:
      store.reviews.find((review) => review.bookingId === booking.id) ?? null,
    actions: availableTriggers(booking, "provider"),
  };
}

function providerById(store: Store, id: string): Provider {
  const provider = store.providers.find((record) => record.id === id);
  if (!provider) throw new ApiError("not_found", "Prestador não encontrado.");
  return provider;
}

function requireSession(store: Store): Provider {
  const provider = store.providers.find(
    (record) => record.id === store.sessionProviderId,
  );
  if (!provider) {
    throw new ApiError("unauthorised", "Entre na sua conta para continuar.");
  }
  return provider;
}

function subscriptionOf(store: Store, providerId: string) {
  return (
    store.subscriptions.find((record) => record.providerId === providerId) ??
    null
  );
}

function isBlocked(store: Store, providerId: string) {
  const subscription = subscriptionOf(store, providerId);
  return subscription ? subscriptionAccess(subscription) === "blocked" : false;
}

const NOT_TAKING_BOOKINGS =
  "Este profissional não está recebendo agendamentos agora.";

function requireAccess(store: Store): Provider {
  const provider = requireSession(store);
  if (isBlocked(store, provider.id)) {
    throw new ApiError(
      "payment_required",
      "O acesso está bloqueado até a assinatura ser paga.",
    );
  }
  return provider;
}

function ownBooking(store: Store, providerId: string, bookingId: string) {
  const booking = store.bookings.find((record) => record.id === bookingId);
  if (!booking || booking.providerId !== providerId) {
    throw new ApiError("not_found", "Agendamento não encontrado.");
  }
  return booking;
}

const RESERVED_SLUGS = new Set([
  "a",
  "cadastro",
  "comecar",
  "entrar",
  "painel",
  "privacidade",
  "termos",
]);

function uniqueSlug(store: Store, name: string) {
  const letters = normalizeForSearch(name).replace(/ /g, "").slice(0, 24);
  const base = letters.length >= 3 ? letters : `${letters}pro`;

  let slug = base;
  for (
    let n = 2;
    RESERVED_SLUGS.has(slug) || store.providers.some((p) => p.slug === slug);
    n += 1
  ) {
    slug = `${base}${n}`;
  }
  return slug;
}

function starterHours(providerId: string): WorkingHours[] {
  return ([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((weekday) => ({
    id: newId("wh"),
    providerId,
    weekday,
    start: DEFAULT_DAY.start,
    end: DEFAULT_DAY.end,
    lunch: { ...DEFAULT_LUNCH },
    active: weekday >= 1 && weekday <= 5,
  }));
}

function isBusy(
  store: Store,
  providerId: string,
  startsAt: Timestamp,
  durationMinutes: number,
) {
  const start = new Date(startsAt).getTime();
  const end = start + durationMinutes * 60_000;

  return store.bookings.some((booking) => {
    if (booking.providerId !== providerId) return false;

    if (
      [
        "payment_expired",
        "cancelled_by_customer",
        "cancelled_by_provider",
        "provider_no_show",
      ].includes(booking.state)
    ) {
      return false;
    }

    if (
      booking.state === "pending_payment" &&
      paymentWindowOver(booking.paymentDueAt)
    ) {
      return false;
    }

    const otherStart = new Date(booking.startsAt).getTime();
    const otherEnd = otherStart + booking.durationMinutes * 60_000;
    return start < otherEnd && otherStart < end;
  });
}

function buildSlots(
  store: Store,
  service: Service,
  from: Date,
  to: Date,
): OpenSlot[] {
  const slots: OpenSlot[] = [];

  for (let offset = 0; offset < 60; offset += 1) {
    const dateKey = zonedDateKey(from, offset);
    const dayStart = zonedInstant(dateKey, "00:00");
    if (dayStart.getTime() > to.getTime()) break;

    const weekday = zonedWeekday(dateKey) as WorkingHours["weekday"];
    const shift = store.workingHours.find(
      (hours: WorkingHours) =>
        hours.providerId === service.providerId &&
        hours.weekday === weekday &&
        hours.active,
    );
    if (!shift) continue;

    const open = zonedInstant(dateKey, shift.start);
    const close = zonedInstant(dateKey, shift.end);
    const lunch = lunchOf(shift);
    const lunchStart = lunch
      ? zonedInstant(dateKey, lunch.start).getTime()
      : null;
    const lunchEnd = lunch ? zonedInstant(dateKey, lunch.end).getTime() : null;

    for (
      let slot = open.getTime();
      slot + service.durationMinutes * 60_000 <= close.getTime();
      slot += 60 * 60_000
    ) {
      const startsAt = new Date(slot).toISOString();
      const slotEnd = slot + service.durationMinutes * 60_000;
      const inLunch =
        lunchStart !== null &&
        lunchEnd !== null &&
        slot < lunchEnd &&
        slotEnd > lunchStart;

      if (
        !inLunch &&
        slot > now().getTime() &&
        slot <= to.getTime() &&
        !isBusy(store, service.providerId, startsAt, service.durationMinutes)
      ) {
        slots.push({ startsAt, durationMinutes: service.durationMinutes });
      }
    }
  }

  return slots;
}

function settleExpiredPayments() {
  const due = getStore().bookings.some(
    (booking) =>
      booking.state === "pending_payment" &&
      paymentWindowOver(booking.paymentDueAt),
  );
  if (due) write((store) => expireUnpaidDeposits(store));
}

export const mockApi: Api & DebugApi = {
  async getPublicPage(slug): Promise<PublicPage | null> {
    await wait();
    const store = getStore();
    const provider = store.providers.find((record) => record.slug === slug);
    if (!provider) return null;

    return {
      provider,
      stats: computeStats(store, provider.id),
      services: store.services
        .filter(
          (service) => service.providerId === provider.id && service.active,
        )
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      reviews: store.reviews
        .filter((review) => review.providerId === provider.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      bookable: !isBlocked(store, provider.id),
    };
  },

  async listOpenSlots({ serviceId, from, to }) {
    await wait();
    settleExpiredPayments();
    const store = getStore();
    const service = serviceOf(store, serviceId);
    if (isBlocked(store, service.providerId)) return [];
    return buildSlots(store, service, new Date(from), new Date(to));
  },

  async lookUpCustomer(phone) {
    await wait(200);
    settleExpiredPayments();
    const store = getStore();
    const customer = customerOf(store, phone);
    const pending = pendingPaymentOf(store, phone);
    return {
      customer,
      mustPayInFull: mustPayInFull(customer ?? undefined),
      pendingPayment: pending?.paymentDueAt
        ? { paymentDueAt: pending.paymentDueAt }
        : null,
    };
  },

  async resendPaymentLink(phone) {
    await wait();
    settleExpiredPayments();
    return write((store) => {
      const pending = pendingPaymentOf(store, phone);
      if (!pending) return { sent: false };
      queuePaymentPending(store, pending);
      return { sent: true };
    });
  },

  async createPublicBooking(input: NewPublicBooking) {
    await wait();
    settleExpiredPayments();

    return write((store) => {
      const service = serviceOf(store, input.serviceId);

      if (service.providerId !== input.providerId || !service.active) {
        throw new ApiError("not_found", "Serviço não encontrado.");
      }

      if (isBlocked(store, service.providerId)) {
        throw new ApiError("conflict", NOT_TAKING_BOOKINGS);
      }

      if (
        isBusy(
          store,
          service.providerId,
          input.startsAt,
          service.durationMinutes,
        )
      ) {
        throw new ApiError(
          "conflict",
          "Outra pessoa pegou esse horário. Escolha outro.",
        );
      }

      const customer = customerOf(store, input.customerPhone);
      const provider = providerById(store, service.providerId);

      const depositMode = publicDepositMode(provider.collectsDeposit);
      const withDeposit = depositMode === "with_deposit";
      const inFull = withDeposit && mustPayInFull(customer ?? undefined);

      const percent = !withDeposit
        ? 0
        : inFull
          ? 100
          : clampDeposit(provider.depositPercent);

      const amounts = computeAmounts({
        price: service.priceFrom,
        depositPercent: percent,
        depositMode,
      });

      const createdAt = nowIso();
      const id = newId("bk");
      const born = initialState(withDeposit);

      const booking: Booking = {
        id,
        providerId: service.providerId,
        serviceId: service.id,
        customerPhone: input.customerPhone,
        customerName: input.customerName,
        address: input.address,
        problemDescription: input.problemDescription,
        startsAt: input.startsAt,
        durationMinutes: service.durationMinutes,
        state: born,
        source: "public_link",
        depositMode,
        totalAmount: amounts.total,
        depositAmount: amounts.deposit,
        balanceAmount: amounts.balance,
        depositPercent: percent,
        customerToken: `tk-${id}`,
        ...(withDeposit ? { paymentDueAt: paymentDueAt(createdAt) } : {}),
        transitions: [
          {
            from: null,
            to: born,
            at: createdAt,
            actor: "customer",
            source: "public_link",
          },
        ],
        createdAt,
        updatedAt: createdAt,
      };

      store.bookings.push(booking);
      store.payments.push(...initialPayments(booking, () => newId("pm")));
      if (withDeposit) queuePaymentPending(store, booking);
      else queueConfirmation(store, booking);

      if (!customer) {
        store.customers.push({
          phone: input.customerPhone,
          name: input.customerName,
          unpaidCount: 0,
          disputeCount: 0,
          bookingCount: 1,
          firstSeenAt: createdAt,
        });
      } else {
        customer.bookingCount += 1;
      }

      return { booking, customerToken: booking.customerToken };
    });
  },

  async getByToken(token) {
    await wait();
    settleExpiredPayments();
    const store = getStore();
    const booking = store.bookings.find(
      (record) => record.customerToken === token,
    );
    return booking ? buildCustomerView(store, booking) : null;
  },

  async payDeposit(token, payment) {
    await wait();
    settleExpiredPayments();
    return write((store) => {
      const target = byToken(store, token);
      if (target.state === "payment_expired") {
        throw new ApiError(
          "conflict",
          "O prazo para pagar a entrada acabou e o horário foi liberado.",
        );
      }
      if (payment.method !== "pix" && !payment.cardToken) {
        throw new ApiError("invalid", "Faltam os dados do cartão.");
      }
      const updated = fireTrigger(store, target.id, "pay_deposit", {
        actor: "customer",
        source: "customer_link",
      });

      store.payments = store.payments.map((record) =>
        record.bookingId === updated.id &&
        record.kind === "deposit" &&
        record.state === "held"
          ? { ...record, method: payment.method }
          : record,
      );
      return buildCustomerView(store, updated);
    });
  },

  async payBalance(token, { providerShowedUp }) {
    await wait();
    return write((store) => {
      const target = byToken(store, token);

      let updated = fireTrigger(store, target.id, "pay_balance", {
        actor: "customer",
        source: "customer_link",
      });

      const index = store.bookings.findIndex(
        (record) => record.id === updated.id,
      );

      updated = {
        ...updated,
        providerShowedUp,
        showUpAnsweredAt: nowIso(),
      };
      store.bookings[index] = updated;

      if (providerShowedUp) {
        store.payments = moveMoney({
          effect: "release_all",
          toState: "paid",
          booking: updated,
          payments: store.payments,
          newId: () => newId("pm"),
        });
      }

      return buildCustomerView(store, updated);
    });
  },

  async cancelByCustomer(token, reason) {
    await wait();
    return write((store) => {
      const target = byToken(store, token);
      const updated = fireTrigger(store, target.id, "cancel_by_customer", {
        actor: "customer",
        source: "customer_link",
        note: reason,
      });
      return buildCustomerView(store, updated);
    });
  },

  async dispute(token, reason) {
    await wait();
    return write((store) => {
      const target = byToken(store, token);
      const updated = fireTrigger(store, target.id, "dispute", {
        actor: "customer",
        source: "customer_link",
        note: reason,
      });
      return buildCustomerView(store, updated);
    });
  },

  async submitReview(token, { rating, comment }) {
    await wait();
    return write((store) => {
      const target = byToken(store, token);
      const updated = fireTrigger(store, target.id, "review", {
        actor: "customer",
        source: "customer_link",
      });

      const review: Review = {
        id: newId("rv"),
        bookingId: updated.id,
        providerId: updated.providerId,
        rating,
        comment,
        author: updated.customerName,
        createdAt: nowIso(),
      };

      store.reviews.push(review);
      return buildCustomerView(store, updated);
    });
  },

  async signIn({ phone, password }) {
    await wait();
    return write((store) => {
      const account = store.accounts.find(
        (record) =>
          record.phone === digitsOnly(phone) && record.password === password,
      );

      if (!account) return null;

      store.sessionProviderId = account.providerId;
      return providerById(store, account.providerId);
    });
  },

  async session() {
    await wait(150);
    const store = getStore();
    return (
      store.providers.find((record) => record.id === store.sessionProviderId) ??
      null
    );
  },

  async signOut() {
    await wait(150);
    write((store) => {
      store.sessionProviderId = null;
    });
  },

  async deleteAccount() {
    await wait();
    return write((store) => {
      const provider = requireAccess(store);

      const mine = store.bookings.filter(
        (booking) => booking.providerId === provider.id,
      );

      const standing = mine.filter((booking) =>
        ["pending_payment", "confirmed", "in_progress", "finished"].includes(
          booking.state,
        ),
      );
      if (standing.length > 0) {
        throw new ApiError(
          "invalid",
          "Você ainda tem serviços em aberto. Termine ou cancele antes de excluir a conta.",
        );
      }

      const held = store.payments.filter(
        (payment) =>
          payment.state === "held" &&
          mine.some((booking) => booking.id === payment.bookingId),
      );
      if (held.length > 0) {
        throw new ApiError(
          "invalid",
          "Ainda há dinheiro de cliente guardado no app. Espere sair para excluir a conta.",
        );
      }

      const ids = new Set(mine.map((booking) => booking.id));

      store.payments = store.payments.filter(
        (payment) => !ids.has(payment.bookingId),
      );
      store.reviews = store.reviews.filter(
        (review) => review.providerId !== provider.id,
      );
      store.messages = store.messages.filter(
        (message) => !message.bookingId || !ids.has(message.bookingId),
      );
      store.bookings = store.bookings.filter(
        (booking) => booking.providerId !== provider.id,
      );
      store.services = store.services.filter(
        (service) => service.providerId !== provider.id,
      );
      store.workingHours = store.workingHours.filter(
        (entry) => entry.providerId !== provider.id,
      );
      store.subscriptions = store.subscriptions.filter(
        (entry) => entry.providerId !== provider.id,
      );
      store.accounts = store.accounts.filter(
        (account) => account.providerId !== provider.id,
      );
      store.providers = store.providers.filter(
        (entry) => entry.id !== provider.id,
      );
      store.sessionProviderId = null;
    });
  },

  async signUp({ name, phone, password, collectsDeposit }) {
    await wait();
    return write((store) => {
      const digits = digitsOnly(phone);

      if (!isValidPhone(digits)) {
        throw new ApiError("invalid", "O WhatsApp tem 11 dígitos, com o DDD.");
      }

      if (store.accounts.some((account) => account.phone === digits)) {
        throw new ApiError("conflict", "Esse WhatsApp já tem uma conta.");
      }

      const createdAt = nowIso();
      const provider: Provider = {
        id: newId("pr"),
        slug: uniqueSlug(store, name),
        name: name.trim(),
        photo: "",
        phone: digits,
        email: "",
        city: "",
        cityCode: null,
        collectsDeposit,
        depositPercent: DEFAULT_DEPOSIT,
        createdAt,
      };

      store.providers.push(provider);
      store.accounts.push({ providerId: provider.id, phone: digits, password });
      store.workingHours.push(...starterHours(provider.id));
      store.subscriptions.push({
        providerId: provider.id,
        state: "trial",
        monthlyAmount: MONTHLY_FEE_CENTS,
        nextChargeAt: new Date(
          now().getTime() + TRIAL_DAYS * DAY,
        ).toISOString(),
        since: createdAt,
      });

      store.sessionProviderId = provider.id;
      return provider;
    });
  },

  async saveProfile(input) {
    await wait();
    return write((store) => {
      const provider = requireAccess(store);
      const changes = { ...input };

      if (changes.phone !== undefined) {
        const digits = digitsOnly(changes.phone);
        if (!isValidPhone(digits)) {
          throw new ApiError(
            "invalid",
            "O WhatsApp tem 11 dígitos, com o DDD.",
          );
        }
        if (
          store.accounts.some(
            (account) =>
              account.phone === digits && account.providerId !== provider.id,
          )
        ) {
          throw new ApiError("conflict", "Esse WhatsApp já tem uma conta.");
        }
        changes.phone = digits;
        store.accounts = store.accounts.map((account) =>
          account.providerId === provider.id
            ? { ...account, phone: digits }
            : account,
        );
      }

      const updated: Provider = { ...provider, ...changes, id: provider.id };
      store.providers = store.providers.map((record) =>
        record.id === provider.id ? updated : record,
      );
      return updated;
    });
  },

  async getStats() {
    await wait(200);
    const store = getStore();
    return computeStats(store, requireAccess(store).id);
  },

  async listServices() {
    await wait();
    const store = getStore();
    const provider = requireAccess(store);
    return store.services
      .filter((service) => service.providerId === provider.id && service.active)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  },

  async saveService(service) {
    await wait();
    return write((store) => {
      const provider = requireAccess(store);

      const index = store.services.findIndex(
        (record) =>
          record.id === service.id && record.providerId === provider.id,
      );

      const complete: Service = {
        ...service,
        id: service.id ?? newId("sv"),
        providerId: provider.id,
      };

      if (index >= 0) store.services[index] = complete;
      else store.services.push(complete);

      return complete;
    });
  },

  async removeService(serviceId) {
    await wait();
    write((store) => {
      const provider = requireAccess(store);
      const service = store.services.find(
        (record) =>
          record.id === serviceId && record.providerId === provider.id,
      );
      if (service) service.active = false;
    });
  },

  async listCategories() {
    await wait();
    requireAccess(getStore());
    return CATALOG_CATEGORIES;
  },

  async listCatalogServices(categoryId) {
    await wait();
    requireAccess(getStore());
    return CATALOG_SERVICES.filter(
      (service) => service.categoryId === categoryId,
    );
  },

  async listWorkingHours() {
    await wait();
    const store = getStore();
    const provider = requireAccess(store);
    return store.workingHours
      .filter((hours) => hours.providerId === provider.id)
      .map((hours) => ({ ...hours, lunch: lunchOf(hours) }));
  },

  async saveWorkingHours(hours) {
    await wait();
    return write((store) => {
      const provider = requireAccess(store);
      const mine = hours.map((entry) => ({
        ...entry,
        providerId: provider.id,
      }));
      store.workingHours = [
        ...store.workingHours.filter(
          (entry) => entry.providerId !== provider.id,
        ),
        ...mine,
      ];
      return mine;
    });
  },

  async listAgenda({ from, to }) {
    await wait();
    settleExpiredPayments();
    const store = getStore();
    const provider = requireAccess(store);
    const start = new Date(from).getTime();
    const end = new Date(to).getTime();

    return store.bookings
      .filter((booking) => {
        const when = new Date(booking.startsAt).getTime();
        return (
          booking.providerId === provider.id && when >= start && when <= end
        );
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map<AgendaItem>((booking) => ({
        booking,
        service: serviceOf(store, booking.serviceId),
        payments: paymentsOf(store, booking.id),
      }));
  },

  async listByState(states) {
    await wait();
    settleExpiredPayments();
    const store = getStore();
    const provider = requireAccess(store);

    return store.bookings
      .filter(
        (booking) =>
          booking.providerId === provider.id &&
          (!states || states.includes(booking.state)),
      )
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map<AgendaItem>((booking) => ({
        booking,
        service: serviceOf(store, booking.serviceId),
        payments: paymentsOf(store, booking.id),
      }));
  },

  async getBooking(id) {
    await wait();
    settleExpiredPayments();
    const store = getStore();
    const provider = requireAccess(store);
    const booking = store.bookings.find((record) => record.id === id);
    return booking && booking.providerId === provider.id
      ? buildDetail(store, booking)
      : null;
  },

  async createManualBooking(input: NewManualBooking) {
    await wait();
    return write((store) => {
      const provider = requireAccess(store);
      const service = serviceOf(store, input.serviceId);

      if (service.providerId !== provider.id) {
        throw new ApiError("not_found", "Serviço não encontrado.");
      }

      if (isBusy(store, provider.id, input.startsAt, service.durationMinutes)) {
        throw new ApiError("conflict", "Você já tem um serviço nesse horário.");
      }

      const depositMode: DepositMode = input.depositMode;
      const percent = clampDeposit(
        input.depositPercent ?? provider.depositPercent,
      );

      const amounts = computeAmounts({
        price: service.priceFrom,
        depositPercent: percent,
        depositMode,
      });

      const createdAt = nowIso();
      const id = newId("bk");
      const born = initialState(depositMode === "with_deposit");

      const booking: Booking = {
        id,
        providerId: service.providerId,
        serviceId: service.id,
        customerPhone: input.customerPhone,
        customerName: input.customerName,
        address: input.address,
        problemDescription: input.problemDescription,
        startsAt: input.startsAt,
        durationMinutes: service.durationMinutes,
        state: born,
        source: "manual_entry",
        depositMode,
        totalAmount: amounts.total,
        depositAmount: amounts.deposit,
        balanceAmount: amounts.balance,
        depositPercent: percent,
        customerToken: `tk-${id}`,
        transitions: [
          {
            from: null,
            to: born,
            at: createdAt,
            actor: "provider",
            source: "panel",
          },
        ],
        createdAt,
        updatedAt: createdAt,
      };

      store.bookings.push(booking);
      store.payments.push(...initialPayments(booking, () => newId("pm")));

      const customer = customerOf(store, input.customerPhone);
      if (!customer) {
        store.customers.push({
          phone: input.customerPhone,
          name: input.customerName,
          unpaidCount: 0,
          disputeCount: 0,
          bookingCount: 1,
          firstSeenAt: createdAt,
        });
      } else {
        customer.bookingCount += 1;
      }

      return booking;
    });
  },

  async startJob(bookingId) {
    return providerAction(bookingId, "start");
  },

  async finishJob(bookingId, { finalAmount, chargeThroughApp }) {
    await wait();
    return write((store) => {
      const provider = requireAccess(store);
      const booking = ownBooking(store, provider.id, bookingId);

      if (!(finalAmount > 0)) {
        throw new ApiError("invalid", "Escreva quanto ficou o serviço.");
      }

      const paid = paymentsOf(store, booking.id)
        .filter(
          (payment) => payment.state === "held" || payment.state === "released",
        )
        .reduce((total, payment) => total + payment.amount, 0);

      if (finalAmount < paid) {
        throw new ApiError(
          "invalid",
          "O valor final não pode ser menor do que o que o cliente já pagou.",
        );
      }

      booking.totalAmount = finalAmount;
      booking.balanceAmount = finalAmount - paid;

      const finished = fireTrigger(store, bookingId, "finish", {
        actor: "provider",
        source: "panel",
      });

      const closed =
        chargesThroughApp(finished.depositMode) && chargeThroughApp
          ? finished
          : fireTrigger(store, bookingId, "mark_received", {
              actor: "provider",
              source: "panel",
            });

      return buildDetail(store, closed);
    });
  },

  async markReceived(bookingId) {
    return providerAction(bookingId, "mark_received");
  },

  async markCustomerNoShow(bookingId) {
    return providerAction(bookingId, "mark_customer_no_show");
  },

  async cancelByProvider(bookingId, reason) {
    return providerAction(bookingId, "cancel_by_provider", reason);
  },

  async getMoneyReport(month): Promise<MoneyReport> {
    await wait();
    settleExpiredPayments();
    const store = getStore();
    const provider = requireSession(store);
    const { bookings, payments } = moneyOf(store, provider.id);

    const currentMonth = zonedMonthKey(now());
    const firstMonth = [provider.createdAt, ...bookings.map((b) => b.createdAt)]
      .map((instant) => zonedMonthKey(new Date(instant)))
      .reduce(
        (earliest, key) => (key < earliest ? key : earliest),
        currentMonth,
      );

    const summary = summariseMoney({
      bookings,
      payments,
      month: isMonthKey(month) && month <= currentMonth ? month : currentMonth,
    });

    const subscription = store.subscriptions.find(
      (record) => record.providerId === provider.id,
    );
    if (!subscription) {
      throw new ApiError("not_found", "Assinatura não encontrada.");
    }

    return { ...summary, currentMonth, firstMonth, subscription };
  },

  async listMoneyEntries({ kind, month }) {
    await wait();
    settleExpiredPayments();
    const store = getStore();
    const provider = requireAccess(store);
    const { bookings, payments } = moneyOf(store, provider.id);

    return moneyLines({
      kind,
      month: isMonthKey(month) ? month : zonedMonthKey(now()),
      bookings,
      payments,
    }).map((line) => ({
      ...line,
      service: serviceOf(store, line.booking.serviceId),
    }));
  },

  async getSubscription() {
    await wait(150);
    const store = getStore();
    const provider = requireSession(store);
    const subscription = subscriptionOf(store, provider.id);
    if (!subscription) {
      throw new ApiError("not_found", "Assinatura não encontrada.");
    }
    return { subscription, access: subscriptionAccess(subscription) };
  },

  async paySubscription(payment) {
    await wait();
    return write((store) => {
      const provider = requireSession(store);
      const subscription = subscriptionOf(store, provider.id);
      if (!subscription) {
        throw new ApiError("not_found", "Assinatura não encontrada.");
      }
      if (payment.method !== "pix" && !payment.cardToken) {
        throw new ApiError("invalid", "Faltam os dados do cartão.");
      }

      const from = Math.max(
        now().getTime(),
        new Date(subscription.nextChargeAt).getTime(),
      );
      const next = new Date(from);
      next.setMonth(next.getMonth() + 1);

      subscription.nextChargeAt = next.toISOString();
      subscription.state = "active";
      subscription.lastPaidAt = nowIso();
      delete subscription.cancelledAt;

      return { subscription, access: subscriptionAccess(subscription) };
    });
  },

  async cancelSubscription() {
    await wait();
    return write((store) => {
      const provider = requireSession(store);
      const subscription = subscriptionOf(store, provider.id);
      if (!subscription) {
        throw new ApiError("not_found", "Assinatura não encontrada.");
      }
      if (subscriptionAccess(subscription) === "blocked") {
        throw new ApiError("conflict", "A assinatura já está vencida.");
      }

      subscription.state = "cancelled";
      subscription.cancelledAt = nowIso();

      return { subscription, access: subscriptionAccess(subscription) };
    });
  },

  async listMessages() {
    await wait(150);
    settleExpiredPayments();
    return getStore().messages;
  },

  async clearMessages() {
    await wait(150);
    write((store) => {
      store.messages = [];
    });
  },

  async skipAhead(ms) {
    skipAhead(ms);
    const jobsRun = write((store) => runJobs(store));
    return { now: nowIso(), jobsRun };
  },

  async backToRealTime() {
    backToRealTime();
    return { now: nowIso() };
  },

  async runJobs() {
    const jobsRun = write((store) => runJobs(store));
    return { jobsRun };
  },

  async forceTransition(bookingId, trigger) {
    return write((store) => {
      const booking = store.bookings.find((record) => record.id === bookingId);
      if (!booking) {
        throw new ApiError("not_found", "Agendamento não encontrado.");
      }

      const asProvider = availableTriggers(booking, "provider");
      const asCustomer = availableTriggers(booking, "customer");
      const asSystem = availableTriggers(booking, "system");

      if (![...asProvider, ...asCustomer, ...asSystem].includes(trigger)) {
        throw new ApiError(
          "invalid",
          `Essa ação não vale para este agendamento agora ("${trigger}" a partir de "${booking.state}").`,
        );
      }

      const actor = asCustomer.includes(trigger)
        ? ("customer" as const)
        : asSystem.includes(trigger)
          ? ("system" as const)
          : ("provider" as const);

      const updated = fireTrigger(store, bookingId, trigger, {
        actor,
        source: "debug",
        note: "Forced from the debug panel.",
      });

      return buildDetail(store, updated);
    });
  },

  async reset() {
    resetStore();
    backToRealTime();
  },

  async dump() {
    return dumpStore();
  },
};

async function providerAction(
  bookingId: string,
  trigger: Trigger,
  reason?: string,
): Promise<BookingDetail> {
  await wait();
  return write((store) => {
    const provider = requireAccess(store);
    ownBooking(store, provider.id, bookingId);
    const updated = fireTrigger(store, bookingId, trigger, {
      actor: "provider",
      source: "panel",
      note: reason,
    });
    return buildDetail(store, updated);
  });
}

export function rawMockStore() {
  const store = getStore();
  persist();
  return store;
}
