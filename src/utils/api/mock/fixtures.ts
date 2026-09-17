import { computeAmounts } from "@/utils/booking/money";
import {
  MINUTES_TO_PAY_DEPOSIT,
  MONTHLY_FEE_CENTS,
  paymentDueAt,
} from "@/utils/booking/rules";
import { DAY, HOUR } from "@/utils/time/clock";
import { zonedDateKey, zonedInstant } from "@/utils/time/zone";
import { SITE_DOMAIN } from "@/utils/site";
import type {
  Booking,
  BookingSource,
  BookingState,
  DepositMode,
  Payment,
  Review,
  Timestamp,
  Transition,
  Cents,
} from "@/types/booking";
import type {
  Customer,
  Provider,
  Service,
  Subscription,
  WhatsappMessage,
  WorkingHours,
} from "@/types/provider";

export type Account = {
  providerId: string;
  phone: string;
  password: string;
};

export type Store = {
  version: number;
  createdAt: Timestamp;
  providers: Provider[];
  accounts: Account[];
  services: Service[];
  workingHours: WorkingHours[];
  bookings: Booking[];
  payments: Payment[];
  reviews: Review[];
  customers: Customer[];
  subscriptions: Subscription[];
  messages: WhatsappMessage[];
  sessionProviderId: string | null;
  sequence: number;
};

export const STORE_VERSION = 22;

const PROVIDER_ID = "pr-ghabriel";

function iso(base: Date, offsetMs: number) {
  return new Date(base.getTime() + offsetMs).toISOString();
}

function atDayAndHour(base: Date, days: number, hour: number) {
  const key = zonedDateKey(base, days);
  return zonedInstant(key, `${String(hour).padStart(2, "0")}:00`).toISOString();
}

type Seed = {
  serviceId: string;
  state: BookingState;
  days: number;
  hour: number;
  customerName: string;
  customerPhone: string;
  address: string;
  problemDescription: string;
  source?: BookingSource;
  depositMode?: DepositMode;
  finalAmount?: Cents;
};

const SEEDS: Seed[] = [
  {
    serviceId: "sv-fridge",
    state: "confirmed",
    days: 0,
    hour: 9,
    customerName: "Maria Aparecida",
    customerPhone: "11974620183",
    address: "Rua das Acácias, 220 — Centro",
    problemDescription: "A geladeira não gela embaixo, mas o congelador gela.",
  },
  {
    serviceId: "sv-washer",
    state: "pending_payment",
    days: 0,
    hour: 11,
    customerName: "Seu Antônio",
    customerPhone: "11996208457",
    address: "Rua Pedro Álvares, 45 — Vila Nova",
    problemDescription: "Máquina de lavar fazendo barulho na centrifugação.",
  },
  {
    serviceId: "sv-shower",
    state: "in_progress",
    days: 0,
    hour: 14,
    customerName: "Dona Cleuza",
    customerPhone: "11981345720",
    address: "Av. Brasil, 1450, apto 32 — Jardim América",
    problemDescription: "Chuveiro esquentando pouco desde a semana passada.",
  },
  {
    serviceId: "sv-ac-clean",
    state: "confirmed",
    days: 0,
    hour: 16,
    customerName: "Rodrigo Bastos",
    customerPhone: "11993710268",
    address: "Rua Sete de Setembro, 88 — Centro",
    problemDescription: "Ar-condicionado do quarto com cheiro forte.",
  },

  {
    serviceId: "sv-washer",
    state: "confirmed",
    days: 1,
    hour: 8,
    customerName: "Fernanda Lima",
    customerPhone: "11975084319",
    address: "Rua dos Coqueiros, 12 — Bela Vista",
    problemDescription: "Máquina não centrifuga e fica com água no tambor.",
  },
  {
    serviceId: "sv-ac-install",
    state: "payment_expired",
    days: 2,
    hour: 9,
    customerName: "Carlos Eduardo",
    customerPhone: "11984062371",
    address: "Alameda Santos, 900, sala 4 — Paraíso",
    problemDescription:
      "Instalação de split 12.000 na sala, parede já preparada.",
  },
  {
    serviceId: "sv-fridge",
    state: "confirmed",
    days: 3,
    hour: 15,
    customerName: "Dona Neide",
    customerPhone: "11992185640",
    address: "Rua Amazonas, 301 — Santa Cruz",
    problemDescription: "Geladeira fazendo barulho alto à noite.",
    source: "manual_entry",
    depositMode: "no_deposit",
  },
  {
    serviceId: "sv-shower",
    state: "confirmed",
    days: 4,
    hour: 10,
    customerName: "Josué Martins",
    customerPhone: "11976530248",
    address: "Travessa do Campo, 7 — Alto da Boa Vista",
    problemDescription: "Trocar resistência e revisar fiação do chuveiro.",
    source: "manual_entry",
    depositMode: "paid_outside",
  },

  {
    serviceId: "sv-washer",
    state: "finished",
    days: -1,
    hour: 10,
    customerName: "Patrícia Gomes",
    customerPhone: "11995472083",
    address: "Rua Ipiranga, 555 — Centro",
    problemDescription: "Máquina parou no meio do ciclo.",
    finalAmount: 34000,
  },
  {
    serviceId: "sv-ac-clean",
    state: "finished",
    days: -2,
    hour: 14,
    customerName: "Wagner Souza",
    customerPhone: "11983609174",
    address: "Rua das Palmeiras, 64 — Vila Rica",
    problemDescription: "Limpeza dos dois splits do apartamento.",
  },
  {
    serviceId: "sv-fridge",
    state: "paid",
    finalAmount: 38000,
    days: -3,
    hour: 9,
    customerName: "Sandra Regina",
    customerPhone: "11971248365",
    address: "Rua Minas Gerais, 78 — Centro",
    problemDescription: "Troca do termostato da geladeira.",
  },
  {
    serviceId: "sv-ac-install",
    state: "reviewed",
    days: -5,
    hour: 13,
    customerName: "Marcos Vinícius",
    customerPhone: "11994856201",
    address: "Av. Paulista, 2200, apto 141 — Bela Vista",
    problemDescription: "Instalação de split no quarto do casal.",
  },
  {
    serviceId: "sv-shower",
    state: "reviewed",
    days: -8,
    hour: 11,
    customerName: "Luzia Ferreira",
    customerPhone: "11982073594",
    address: "Rua do Comércio, 33 — Centro",
    problemDescription: "Chuveiro queimado depois da queda de energia.",
  },
  {
    serviceId: "sv-fridge",
    state: "paid",
    days: -4,
    hour: 16,
    customerName: "Elaine Cardoso",
    customerPhone: "11997604132",
    address: "Rua Bahia, 410 — Jardim Paulista",
    problemDescription: "Freezer horizontal não está congelando direito.",
  },

  {
    serviceId: "sv-ac-clean",
    state: "cancelled_by_customer",
    days: -6,
    hour: 9,
    customerName: "Tiago Moreira",
    customerPhone: "11973851026",
    address: "Rua Goiás, 150 — Vila Nova",
    problemDescription: "Limpeza do ar da sala.",
  },
  {
    serviceId: "sv-fridge",
    state: "cancelled_by_provider",
    days: -7,
    hour: 14,
    customerName: "Beatriz Nunes",
    customerPhone: "11990427685",
    address: "Rua Ceará, 20 — Centro",
    problemDescription: "Geladeira com vazamento de água por dentro.",
  },
  {
    serviceId: "sv-washer",
    state: "customer_no_show",
    days: -9,
    hour: 8,
    customerName: "Everton Pires",
    customerPhone: "11986314097",
    address: "Rua Paraná, 88 — Santa Cruz",
    problemDescription: "Máquina não liga.",
  },
  {
    serviceId: "sv-shower",
    state: "provider_no_show",
    days: -11,
    hour: 15,
    customerName: "Rita de Cássia",
    customerPhone: "11979520463",
    address: "Rua Piauí, 9 — Jardim América",
    problemDescription: "Chuveiro dando choque leve.",
  },
  {
    serviceId: "sv-ac-install",
    state: "unpaid",
    days: -14,
    hour: 10,
    customerName: "Alexandre Rocha",
    customerPhone: "11991736508",
    address: "Rua Sergipe, 77 — Paraíso",
    problemDescription: "Instalação de dois splits.",
  },
  {
    serviceId: "sv-fridge",
    state: "disputed",
    days: -16,
    hour: 11,
    customerName: "Alexandre Rocha",
    customerPhone: "11991736508",
    address: "Rua Sergipe, 77 — Paraíso",
    problemDescription: "Geladeira voltou a esquentar depois do conserto.",
  },
];

const PATHS: Record<BookingState, BookingState[]> = {
  pending_payment: [],
  payment_expired: ["payment_expired"],
  confirmed: ["confirmed"],
  in_progress: ["confirmed", "in_progress"],
  finished: ["confirmed", "in_progress", "finished"],
  paid: ["confirmed", "in_progress", "finished", "paid"],
  reviewed: ["confirmed", "in_progress", "finished", "paid", "reviewed"],
  cancelled_by_customer: ["confirmed", "cancelled_by_customer"],
  cancelled_by_provider: ["confirmed", "cancelled_by_provider"],
  customer_no_show: ["confirmed", "customer_no_show"],
  provider_no_show: ["confirmed", "provider_no_show"],
  unpaid: ["confirmed", "in_progress", "finished", "unpaid"],
  disputed: ["confirmed", "in_progress", "finished", "paid", "disputed"],
};

function actorFor(state: BookingState) {
  switch (state) {
    case "confirmed":
    case "paid":
    case "reviewed":
    case "cancelled_by_customer":
    case "disputed":
      return "customer" as const;
    case "payment_expired":
    case "provider_no_show":
    case "unpaid":
      return "system" as const;
    default:
      return "provider" as const;
  }
}

function sourceFor(state: BookingState) {
  const actor = actorFor(state);
  if (actor === "customer") return "customer_link" as const;
  if (actor === "system") return "job" as const;
  return "panel" as const;
}

export function buildInitialStore(reference = new Date()): Store {
  const createdAt = reference.toISOString();

  const provider: Provider = {
    id: PROVIDER_ID,
    slug: "ghabrielelias",
    name: "Ghabriel Elias",
    photo: "",
    phone: "11987654321",
    email: `exemplo@${SITE_DOMAIN}`,
    city: "São Paulo, SP",
    cityCode: 3550308,
    collectsDeposit: true,
    depositPercent: 30,
    createdAt: iso(reference, -420 * DAY),
  };

  const services: Service[] = [
    {
      id: "sv-fridge",
      providerId: PROVIDER_ID,
      catalogId: "fridge_repair",
      name: "Conserto de geladeira",
      priceFrom: 32000,
      durationMinutes: 90,
      active: true,
    },
    {
      id: "sv-shower",
      providerId: PROVIDER_ID,
      catalogId: "electric_shower_install",
      name: "Instalação de chuveiro elétrico",
      priceFrom: 18000,
      durationMinutes: 60,
      active: true,
    },
    {
      id: "sv-ac-install",
      providerId: PROVIDER_ID,
      catalogId: "split_ac_install",
      name: "Instalação de ar-condicionado split",
      priceFrom: 45000,
      durationMinutes: 180,
      active: true,
    },
    {
      id: "sv-ac-clean",
      providerId: PROVIDER_ID,
      catalogId: "split_ac_cleaning",
      name: "Limpeza de ar-condicionado split",
      priceFrom: 15000,
      durationMinutes: 60,
      active: true,
    },
    {
      id: "sv-washer",
      providerId: PROVIDER_ID,
      catalogId: "washer_repair",
      name: "Conserto de máquina de lavar",
      priceFrom: 28000,
      durationMinutes: 120,
      active: true,
    },
  ];

  const workingHours: WorkingHours[] = [
    { id: "wh-1", providerId: PROVIDER_ID, weekday: 1, start: "08:00", end: "18:00", lunch: { start: "12:00", end: "14:00" }, active: true },
    { id: "wh-2", providerId: PROVIDER_ID, weekday: 2, start: "08:00", end: "18:00", lunch: { start: "12:00", end: "14:00" }, active: true },
    { id: "wh-3", providerId: PROVIDER_ID, weekday: 3, start: "08:00", end: "18:00", lunch: { start: "12:00", end: "14:00" }, active: true },
    { id: "wh-4", providerId: PROVIDER_ID, weekday: 4, start: "08:00", end: "18:00", lunch: { start: "12:00", end: "14:00" }, active: true },
    { id: "wh-5", providerId: PROVIDER_ID, weekday: 5, start: "08:00", end: "18:00", lunch: { start: "12:00", end: "14:00" }, active: true },
    { id: "wh-6", providerId: PROVIDER_ID, weekday: 6, start: "08:00", end: "18:00", lunch: { start: "12:00", end: "14:00" }, active: true },
    { id: "wh-0", providerId: PROVIDER_ID, weekday: 0, start: "08:00", end: "18:00", lunch: { start: "12:00", end: "14:00" }, active: false },
  ];

  const bookings: Booking[] = [];
  const payments: Payment[] = [];
  let sequence = 0;
  const nextId = (prefix: string) => `${prefix}-${++sequence}`;

  SEEDS.forEach((seed, index) => {
    const service = services.find((item) => item.id === seed.serviceId)!;
    const source = seed.source ?? "public_link";
    const depositMode: DepositMode = seed.depositMode ?? "with_deposit";
    const price = seed.finalAmount ?? service.priceFrom;
    const deposit = computeAmounts({
      price: service.priceFrom,
      depositPercent: provider.depositPercent,
      depositMode,
    });
    const amounts = {
      total: price,
      deposit: deposit.deposit,
      balance: Math.max(0, price - deposit.deposit),
    };

    const startsAt = atDayAndHour(reference, seed.days, seed.hour);
    const bornAt =
      seed.state === "pending_payment"
        ? iso(reference, -10 * 60_000)
        : seed.state === "payment_expired"
          ? iso(reference, -2 * HOUR)
          : iso(new Date(startsAt), -3 * DAY);
    const dueAt =
      source === "public_link" && depositMode === "with_deposit"
        ? paymentDueAt(bornAt)
        : undefined;

    const path = PATHS[seed.state];
    const firstState: BookingState =
      depositMode === "with_deposit" ? "pending_payment" : "confirmed";

    const transitions: Transition[] = [
      {
        from: null,
        to: firstState,
        at: bornAt,
        actor: source === "public_link" ? "customer" : "provider",
        source: source === "public_link" ? "public_link" : "panel",
      },
    ];

    let previous: BookingState = firstState;
    path.forEach((state, step) => {
      if (state === previous) return;
      transitions.push({
        from: previous,
        to: state,
        at:
          state === "payment_expired"
            ? iso(new Date(bornAt), MINUTES_TO_PAY_DEPOSIT * 60_000)
            : iso(new Date(startsAt), (step - path.length + 1) * HOUR),
        actor: actorFor(state),
        source: sourceFor(state),
      });
      previous = state;
    });

    const id = `bk-${index + 1}`;

    bookings.push({
      id,
      providerId: PROVIDER_ID,
      serviceId: service.id,
      customerPhone: seed.customerPhone,
      customerName: seed.customerName,
      address: seed.address,
      problemDescription: seed.problemDescription,
      startsAt,
      durationMinutes: service.durationMinutes,
      state: seed.state,
      source,
      depositMode,
      totalAmount: amounts.total,
      depositAmount: amounts.deposit,
      balanceAmount: amounts.balance,
      depositPercent: provider.depositPercent,
      customerToken: `tk-${id}`,
      paymentDueAt: dueAt,
      transitions,
      createdAt: bornAt,
      updatedAt: transitions[transitions.length - 1].at,
      ...(seed.state === "paid" || seed.state === "reviewed"
        ? { providerShowedUp: true, showUpAnsweredAt: startsAt }
        : {}),
    });

    payments.push(
      ...paymentsForSeed({
        bookingId: id,
        state: seed.state,
        depositMode,
        amounts,
        createdAt: bornAt,
        startsAt,
        newId: () => nextId("pm"),
      }),
    );
  });

  const reviews: Review[] = bookings
    .filter((booking) => booking.state === "reviewed")
    .map((booking, index) => ({
      id: `rv-${index + 1}`,
      bookingId: booking.id,
      providerId: PROVIDER_ID,
      rating: index === 0 ? 5 : 4,
      comment:
        index === 0
          ? "Chegou na hora marcada, explicou o que estava errado antes de mexer. Ficou ótimo."
          : "Serviço bem feito. Demorou um pouco mais do que o previsto, mas resolveu.",
      author: booking.customerName,
      createdAt: iso(new Date(booking.startsAt), 6 * HOUR),
    }));

  const customers = buildCustomers(bookings, reference);

  const subscription: Subscription = {
    providerId: PROVIDER_ID,
    state: "active",
    monthlyAmount: MONTHLY_FEE_CENTS,
    nextChargeAt: iso(reference, 12 * DAY),
    since: provider.createdAt,
    lastPaidAt: iso(reference, -18 * DAY),
  };

  return {
    version: STORE_VERSION,
    createdAt,
    providers: [provider],
    accounts: [{ providerId: PROVIDER_ID, phone: provider.phone, password: "sochamar" }],
    services,
    workingHours,
    bookings,
    payments,
    reviews,
    customers,
    subscriptions: [subscription],
    messages: [],
    sessionProviderId: null,
    sequence,
  };
}

function paymentsForSeed({
  bookingId,
  state,
  depositMode,
  amounts,
  createdAt,
  startsAt,
  newId,
}: {
  bookingId: string;
  state: BookingState;
  depositMode: DepositMode;
  amounts: { total: number; deposit: number; balance: number };
  createdAt: Timestamp;
  startsAt: Timestamp;
  newId: () => string;
}): Payment[] {
  const endedAt = iso(new Date(startsAt), 2 * HOUR);

  if (depositMode === "paid_outside") {
    return [
      {
        id: newId(),
        bookingId,
        kind: "deposit",
        amount: amounts.total,
        state: "released",
        createdAt,
        paidAt: createdAt,
        releasedAt: createdAt,
        outsideApp: true,
      },
    ];
  }

  if (state === "payment_expired") return [];

  const list: Payment[] = [];

  if (amounts.deposit > 0) {
    const deposit: Payment = {
      id: newId(),
      bookingId,
      kind: "deposit",
      amount: amounts.deposit,
      state: "pending",
      createdAt,
    };

    switch (state) {
      case "pending_payment":
        break;
      case "confirmed":
      case "in_progress":
      case "finished":
        deposit.state = "held";
        deposit.paidAt = createdAt;
        break;
      case "paid":
      case "reviewed":
      case "customer_no_show":
      case "unpaid":
        deposit.state = "released";
        deposit.paidAt = createdAt;
        deposit.releasedAt = endedAt;
        break;
      case "cancelled_by_customer":
      case "cancelled_by_provider":
      case "provider_no_show":
      case "disputed":
        deposit.state = "refunded";
        deposit.paidAt = createdAt;
        deposit.refundedAt = endedAt;
        break;
    }

    list.push(deposit);
  }

  const hasBalance = [
    "finished",
    "paid",
    "reviewed",
    "unpaid",
    "disputed",
  ].includes(state);

  if (hasBalance && amounts.balance > 0) {
    const balance: Payment = {
      id: newId(),
      bookingId,
      kind: "balance",
      amount: amounts.balance,
      state: "pending",
      createdAt: endedAt,
    };

    if (state === "paid" || state === "reviewed") {
      balance.state = "released";
      balance.paidAt = endedAt;
      balance.releasedAt = endedAt;
    }

    if (state === "disputed") {
      balance.state = "refunded";
      balance.paidAt = endedAt;
      balance.refundedAt = endedAt;
    }

    list.push(balance);
  }

  return list;
}

function buildCustomers(bookings: Booking[], reference: Date): Customer[] {
  const byPhone = new Map<string, Customer>();

  for (const booking of bookings) {
    const current = byPhone.get(booking.customerPhone) ?? {
      phone: booking.customerPhone,
      name: booking.customerName,
      unpaidCount: 0,
      disputeCount: 0,
      bookingCount: 0,
      firstSeenAt: booking.createdAt,
    };

    current.bookingCount += 1;
    if (booking.state === "unpaid") current.unpaidCount += 1;
    if (booking.state === "disputed") current.disputeCount += 1;
    if (booking.createdAt < current.firstSeenAt) {
      current.firstSeenAt = booking.createdAt;
    }

    byPhone.set(booking.customerPhone, current);
  }

  const blocked = byPhone.get("11991736508");
  if (blocked) {
    blocked.unpaidCount = 2;
    blocked.disputeCount = 1;
    blocked.bookingCount += 1;
    blocked.firstSeenAt = iso(reference, -120 * DAY);
  }

  return [...byPhone.values()];
}
