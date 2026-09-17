import { moveMoney } from "@/utils/booking/money";
import { chargesThroughApp } from "@/utils/booking/rules";
import {
  applyTransition,
  type TransitionContext,
  type Trigger,
} from "@/utils/booking/machine";
import { nowIso } from "@/utils/time/clock";
import { ApiError } from "@/utils/api/contract";
import type { WhatsappTemplate } from "@/utils/whatsapp/templates";
import type { Booking } from "@/types/booking";
import type { MessageTarget } from "@/types/provider";

import { newId } from "./store";
import type { Store } from "./fixtures";
import { SITE_DOMAIN } from "@/utils/site";

export function queueMessage(
  store: Store,
  input: {
    template: WhatsappTemplate;
    target: MessageTarget;
    phone: string;
    variables: Record<string, string | number>;
    bookingId?: string;
  },
) {
  store.messages.unshift({
    id: newId("ms"),
    template: input.template,
    target: input.target,
    phone: input.phone,
    variables: input.variables,
    bookingId: input.bookingId,
    at: nowIso(),
  });
}

export function queuePaymentPending(store: Store, booking: Booking) {
  const service = store.services.find((item) => item.id === booking.serviceId);
  const provider = store.providers.find(
    (record) => record.id === booking.providerId,
  );

  queueMessage(store, {
    template: "payment_pending_customer",
    target: "customer",
    phone: booking.customerPhone,
    bookingId: booking.id,
    variables: {
      customer: booking.customerName,
      provider: provider?.name ?? "",
      service: service?.name ?? "",
      when: booking.startsAt,
      amountDeposit: booking.depositAmount,
      dueAt: booking.paymentDueAt ?? booking.createdAt,
      link: `${SITE_DOMAIN}/a/${booking.customerToken}/pagar`,
    },
  });
}

function paymentsOf(store: Store, bookingId: string) {
  return store.payments.filter((payment) => payment.bookingId === bookingId);
}

function updateCustomer(store: Store, booking: Booking) {
  const customer = store.customers.find(
    (record) => record.phone === booking.customerPhone,
  );
  if (!customer) return;

  if (booking.state === "unpaid") customer.unpaidCount += 1;
  if (booking.state === "disputed") customer.disputeCount += 1;
}

export function queueConfirmation(store: Store, booking: Booking) {
  const service = store.services.find((item) => item.id === booking.serviceId);
  const provider = store.providers.find(
    (record) => record.id === booking.providerId,
  );
  if (!provider) return;

  const link = `${SITE_DOMAIN}/a/${booking.customerToken}`;
  const panelLink = `${SITE_DOMAIN}/painel/agendamentos/${booking.id}`;
  const common = {
    service: service?.name ?? "",
    when: booking.startsAt,
  };

  if (booking.depositMode === "pay_direct") {
    queueMessage(store, {
      bookingId: booking.id,
      template: "booking_confirmed_customer_direct",
      target: "customer",
      phone: booking.customerPhone,
      variables: {
        ...common,
        customer: booking.customerName,
        provider: provider.name,
        amountTotal: booking.totalAmount,
        link,
      },
    });
    queueMessage(store, {
      bookingId: booking.id,
      template: "booking_confirmed_provider_direct",
      target: "provider",
      phone: provider.phone,
      variables: {
        ...common,
        customer: booking.customerName,
        address: booking.address,
        amountTotal: booking.totalAmount,
        link: panelLink,
      },
    });
    return;
  }

  queueMessage(store, {
    bookingId: booking.id,
    template: "booking_confirmed_customer",
    target: "customer",
    phone: booking.customerPhone,
    variables: {
      ...common,
      customer: booking.customerName,
      provider: provider.name,
      amountPaid: booking.depositAmount,
      amountDue: booking.balanceAmount,
      link,
    },
  });
  queueMessage(store, {
    bookingId: booking.id,
    template: "booking_confirmed_provider",
    target: "provider",
    phone: provider.phone,
    variables: {
      ...common,
      customer: booking.customerName,
      address: booking.address,
      amountPaid: booking.depositAmount,
      link: panelLink,
    },
  });
}

function queueMessagesFor(store: Store, booking: Booking) {
  const service = store.services.find((item) => item.id === booking.serviceId);
  const provider = store.providers.find(
    (record) => record.id === booking.providerId,
  );
  if (!provider) return;
  const payments = paymentsOf(store, booking.id);
  const link = `${SITE_DOMAIN}/a/${booking.customerToken}`;

  const base = {
    phone: booking.customerPhone,
    bookingId: booking.id,
  };

  switch (booking.state) {
    case "confirmed":
      queueConfirmation(store, booking);
      break;

    case "finished":
      if (chargesThroughApp(booking.depositMode) && booking.balanceAmount > 0) {
        queueMessage(store, {
          ...base,
          template: "balance_charge",
          target: "customer",
          variables: {
            provider: provider.name,
            service: service?.name ?? "",
            amountDue: booking.balanceAmount,
            link,
          },
        });
        queueMessage(store, {
          ...base,
          template: "show_up_question",
          target: "customer",
          variables: {
            provider: provider.name,
            when: booking.startsAt,
            link,
          },
        });
      }
      break;

    case "paid":
      queueMessage(store, {
        ...base,
        template: "review_request",
        target: "customer",
        variables: { provider: provider.name, link },
      });
      break;

    case "payment_expired":
      queueMessage(store, {
        ...base,
        template: "payment_expired_customer",
        target: "customer",
        variables: {
          provider: provider.name,
          service: service?.name ?? "",
          when: booking.startsAt,
          link: `${SITE_DOMAIN}/${provider.slug}`,
        },
      });
      break;

    case "cancelled_by_customer":
    case "cancelled_by_provider":
    case "provider_no_show":
    case "disputed": {
      const refundedPayments = payments.filter(
        (payment) => payment.state === "refunded" && payment.paidAt !== undefined,
      );
      const refunded = refundedPayments.reduce(
        (total, payment) => total + payment.amount,
        0,
      );
      const toCard = refundedPayments
        .filter(
          (payment) =>
            payment.method === "credit_card" || payment.method === "debit_card",
        )
        .reduce((total, payment) => total + payment.amount, 0);

      const paidInApp = payments.some(
        (payment) => payment.paidAt !== undefined && !payment.outsideApp,
      );
      if (!paidInApp) {
        queueMessage(store, {
          ...base,
          template: "cancellation_notice_no_charge",
          target: "customer",
          variables: {
            provider: provider.name,
            service: service?.name ?? "",
            when: booking.startsAt,
          },
        });
        break;
      }

      queueMessage(store, {
        ...base,
        template: "cancellation_notice",
        target: "customer",
        variables: {
          provider: provider.name,
          service: service?.name ?? "",
          when: booking.startsAt,
          amountRefunded: refunded,
        },
      });
      if (refunded - toCard > 0) {
        queueMessage(store, {
          ...base,
          template: "refund_receipt",
          target: "customer",
          variables: { amountRefunded: refunded - toCard },
        });
      }
      if (toCard > 0) {
        queueMessage(store, {
          ...base,
          template: "refund_receipt_card",
          target: "customer",
          variables: { amountRefunded: toCard },
        });
      }
      break;
    }

    case "unpaid":
      queueMessage(store, {
        bookingId: booking.id,
        template: "customer_did_not_pay",
        target: "provider",
        phone: provider.phone,
        variables: {
          customer: booking.customerName,
          amountDue: booking.balanceAmount,
          amountPaid: booking.depositAmount,
        },
      });
      break;

    default:
      break;
  }
}

export function fireTrigger(
  store: Store,
  bookingId: string,
  trigger: Trigger,
  context: TransitionContext,
): Booking {
  const index = store.bookings.findIndex((booking) => booking.id === bookingId);

  if (index < 0) {
    throw new ApiError("not_found", "Agendamento não encontrado.");
  }

  const result = applyTransition(store.bookings[index], trigger, context);

  store.bookings[index] = result.booking;
  store.payments = moveMoney({
    effect: result.effect,
    toState: result.transition.to,
    booking: result.booking,
    payments: store.payments,
    newId: () => newId("pm"),
  });

  updateCustomer(store, result.booking);
  queueMessagesFor(store, result.booking);

  return result.booking;
}
