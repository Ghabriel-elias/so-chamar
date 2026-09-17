import type {
  CatalogCategory,
  CatalogService,
} from "@/utils/catalog/catalog";
import type { Trigger } from "@/utils/booking/machine";
import type {
  MoneyEntryKind,
  MoneyLine,
  MoneySummary,
} from "@/utils/booking/money";
import type { SubscriptionAccess } from "@/utils/booking/rules";
import type {
  Booking,
  Cents,
  DepositMode,
  Payment,
  Review,
  Timestamp,
} from "@/types/booking";
import type {
  Customer,
  Provider,
  ProviderStats,
  Service,
  Subscription,
  WhatsappMessage,
  WorkingHours,
} from "@/types/provider";

export type PublicPage = {
  provider: Provider;
  stats: ProviderStats;
  services: Service[];
  reviews: Review[];
  bookable: boolean;
};

export type OpenSlot = {
  startsAt: Timestamp;
  durationMinutes: number;
};

export type NewPublicBooking = {
  providerId: string;
  serviceId: string;
  startsAt: Timestamp;
  customerName: string;
  customerPhone: string;
  address: string;
  problemDescription: string;
};

export interface PublicApi {
  getPublicPage(slug: string): Promise<PublicPage | null>;

  listOpenSlots(input: {
    providerId: string;
    serviceId: string;
    from: Timestamp;
    to: Timestamp;
  }): Promise<OpenSlot[]>;

  lookUpCustomer(phone: string): Promise<{
    customer: Customer | null;
    mustPayInFull: boolean;
    pendingPayment: { paymentDueAt: Timestamp } | null;
  }>;

  resendPaymentLink(phone: string): Promise<{ sent: boolean }>;

  createPublicBooking(
    input: NewPublicBooking,
  ): Promise<{ booking: Booking; customerToken: string }>;
}

export type PaymentChoice =
  | { method: "pix" }
  | { method: "credit_card" | "debit_card"; cardToken: string };

export type CustomerView = {
  booking: Booking;
  service: Service;
  provider: Provider;
  stats: ProviderStats;
  payments: Payment[];
  review: Review | null;
  actions: Trigger[];
};

export interface CustomerApi {
  getByToken(token: string): Promise<CustomerView | null>;

  payDeposit(token: string, payment: PaymentChoice): Promise<CustomerView>;

  payBalance(
    token: string,
    answer: { providerShowedUp: boolean },
  ): Promise<CustomerView>;

  cancelByCustomer(token: string, reason?: string): Promise<CustomerView>;

  dispute(token: string, reason: string): Promise<CustomerView>;

  submitReview(
    token: string,
    review: { rating: number; comment?: string },
  ): Promise<CustomerView>;
}

export type AgendaItem = {
  booking: Booking;
  service: Service;
  payments: Payment[];
};

export type BookingDetail = AgendaItem & {
  customer: Customer | null;
  review: Review | null;
  actions: Trigger[];
};

export type NewManualBooking = {
  serviceId: string;
  startsAt: Timestamp;
  customerName: string;
  customerPhone: string;
  address: string;
  problemDescription: string;
  depositMode: DepositMode;
  depositPercent?: number;
};

export type SubscriptionStatus = {
  subscription: Subscription;
  access: SubscriptionAccess;
};

export type MoneyReport = MoneySummary & {
  currentMonth: string;
  firstMonth: string;
  subscription: Subscription;
};

export type MoneyEntry = MoneyLine & { service: Service };

export interface ProviderApi {
  signIn(credentials: {
    phone: string;
    password: string;
  }): Promise<Provider | null>;
  session(): Promise<Provider | null>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  signUp(input: {
    name: string;
    phone: string;
    password: string;
    collectsDeposit: boolean;
  }): Promise<Provider>;

  saveProfile(input: Partial<Provider>): Promise<Provider>;
  getStats(): Promise<ProviderStats>;

  listServices(): Promise<Service[]>;
  saveService(
    service: Omit<Service, "providerId" | "id" | "type"> & { id?: string },
  ): Promise<Service>;
  removeService(serviceId: string): Promise<void>;

  listCategories(): Promise<CatalogCategory[]>;
  listCatalogServices(categoryId: string): Promise<CatalogService[]>;

  listWorkingHours(): Promise<WorkingHours[]>;
  saveWorkingHours(hours: WorkingHours[]): Promise<WorkingHours[]>;

  listAgenda(range: { from: Timestamp; to: Timestamp }): Promise<AgendaItem[]>;
  listByState(states?: string[]): Promise<AgendaItem[]>;
  getBooking(id: string): Promise<BookingDetail | null>;

  createManualBooking(input: NewManualBooking): Promise<Booking>;

  startJob(bookingId: string): Promise<BookingDetail>;
  finishJob(
    bookingId: string,
    close: { finalAmount: Cents; chargeThroughApp: boolean },
  ): Promise<BookingDetail>;
  markReceived(bookingId: string): Promise<BookingDetail>;
  markCustomerNoShow(bookingId: string): Promise<BookingDetail>;
  cancelByProvider(bookingId: string, reason?: string): Promise<BookingDetail>;

  getMoneyReport(month?: string): Promise<MoneyReport>;
  listMoneyEntries(input: {
    kind: MoneyEntryKind;
    month?: string;
  }): Promise<MoneyEntry[]>;

  getSubscription(): Promise<SubscriptionStatus>;
  paySubscription(payment: PaymentChoice): Promise<SubscriptionStatus>;
  cancelSubscription(): Promise<SubscriptionStatus>;
}

export interface MessagesApi {
  listMessages(): Promise<WhatsappMessage[]>;
  clearMessages(): Promise<void>;
}

export interface DebugApi {
  skipAhead(ms: number): Promise<{ now: Timestamp; jobsRun: string[] }>;
  backToRealTime(): Promise<{ now: Timestamp }>;
  runJobs(): Promise<{ jobsRun: string[] }>;
  forceTransition(bookingId: string, trigger: Trigger): Promise<BookingDetail>;
  reset(): Promise<void>;
  dump(): Promise<string>;
}

export type Api = PublicApi & CustomerApi & ProviderApi & MessagesApi;

export class ApiError extends Error {
  constructor(
    readonly code:
      | "not_found"
      | "unauthorised"
      | "conflict"
      | "invalid"
      | "payment_required",
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
