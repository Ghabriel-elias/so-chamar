
export const WHATSAPP_TEMPLATES = {
  payment_pending_customer: {
    target: "customer",
    firesOn:
      "Booking born in pending_payment by the customer; again when he asks for the link",
    variables: [
      "customer",
      "provider",
      "service",
      "when",
      "amountDeposit",
      "dueAt",
      "link",
    ],
  },
  payment_expired_customer: {
    target: "customer",
    firesOn: "Deposit not paid in time: booking moves to payment_expired",
    variables: ["provider", "service", "when", "link"],
  },
  booking_confirmed_customer: {
    target: "customer",
    firesOn: "Booking moves to confirmed",
    variables: [
      "customer",
      "provider",
      "service",
      "when",
      "amountPaid",
      "amountDue",
      "link",
    ],
  },
  booking_confirmed_provider: {
    target: "provider",
    firesOn: "Booking moves to confirmed",
    variables: ["customer", "service", "when", "address", "amountPaid", "link"],
  },
  booking_confirmed_customer_direct: {
    target: "customer",
    firesOn:
      "Booked through the link of a provider who doesn't collect deposits: born confirmed",
    variables: [
      "customer",
      "provider",
      "service",
      "when",
      "amountTotal",
      "link",
    ],
  },
  booking_confirmed_provider_direct: {
    target: "provider",
    firesOn:
      "Booked through the link of a provider who doesn't collect deposits: born confirmed",
    variables: ["customer", "service", "when", "address", "amountTotal", "link"],
  },
  day_before_reminder: {
    target: "customer",
    firesOn: "Daily job, 6pm the day before the job",
    variables: ["provider", "service", "when", "link"],
  },
  balance_charge: {
    target: "customer",
    firesOn: "Booking moves to finished",
    variables: ["provider", "service", "amountDue", "link"],
  },
  show_up_question: {
    target: "customer",
    firesOn: "Sent alongside the balance charge",
    variables: ["provider", "when", "link"],
  },
  cancellation_notice: {
    target: "customer",
    firesOn: "Booking moves to any cancelled state",
    variables: ["provider", "service", "when", "amountRefunded"],
  },
  cancellation_notice_no_charge: {
    target: "customer",
    firesOn:
      "Booking moves to a cancelled state and nothing was ever paid through the app",
    variables: ["provider", "service", "when"],
  },
  refund_receipt: {
    target: "customer",
    firesOn: "A Pix refund goes through: cancellation, no-show or dispute",
    variables: ["amountRefunded"],
  },
  refund_receipt_card: {
    target: "customer",
    firesOn: "A deposit paid by card is refunded to the card",
    variables: ["amountRefunded"],
  },
  review_request: {
    target: "customer",
    firesOn: "Booking moves to paid",
    variables: ["provider", "link"],
  },
  customer_did_not_pay: {
    target: "provider",
    firesOn: "Seven days without the balance being paid",
    variables: ["customer", "amountDue", "amountPaid"],
  },
} as const;

export type WhatsappTemplate = keyof typeof WHATSAPP_TEMPLATES;

export const TEMPLATE_IDS = Object.keys(
  WHATSAPP_TEMPLATES,
) as WhatsappTemplate[];

export function isMoneyVariable(key: string) {
  return key.startsWith("amount");
}

export function isDateVariable(key: string) {
  return key === "when" || key.endsWith("At");
}
