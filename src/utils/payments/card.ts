import { now } from "@/utils/time/clock";

export type CardInput = {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
};

export const EMPTY_CARD: CardInput = { number: "", name: "", expiry: "", cvv: "" };

export const cardDigits = (value: string) => value.replace(/\D/g, "").slice(0, 19);
export const expiryDigits = (value: string) => value.replace(/\D/g, "").slice(0, 4);
export const cvvDigits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

export function formatCardNumber(digits: string) {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatExpiry(digits: string) {
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function passesLuhn(digits: string) {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function cardNumberValid(digits: string) {
  return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits);
}

export function expiryValid(digits: string, when = now()) {
  if (digits.length !== 4) return false;
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1).getTime() > when.getTime();
}

export function cardReady(card: CardInput) {
  return (
    cardNumberValid(card.number) &&
    card.name.trim().length >= 3 &&
    expiryValid(card.expiry) &&
    /^\d{3,4}$/.test(card.cvv)
  );
}

export type CardField = "number" | "name" | "expiry" | "cvv";

export const CARD_FIELDS: readonly CardField[] = ["number", "name", "expiry", "cvv"];

export function cardErrors(card: CardInput): Partial<Record<CardField, string>> {
  const errors: Partial<Record<CardField, string>> = {};

  if (!card.number) errors.number = "cardNumberRequired";
  else if (!cardNumberValid(card.number)) errors.number = "cardNumberInvalid";

  if (card.name.trim().length < 3) errors.name = "cardNameRequired";

  if (!card.expiry) errors.expiry = "cardExpiryRequired";
  else if (!expiryValid(card.expiry)) errors.expiry = "cardExpiryInvalid";

  if (!card.cvv) errors.cvv = "cardCvvRequired";
  else if (!/^\d{3,4}$/.test(card.cvv)) errors.cvv = "cardCvvInvalid";

  return errors;
}

export function cardFieldEmpty(card: CardInput, field: CardField) {
  return field === "name" ? !card.name.trim() : !card[field];
}

export function cardProblems(card: CardInput): {
  number?: "cardNumberInvalid";
  expiry?: "cardExpiryInvalid";
} {
  return {
    number:
      card.number.length >= 16 && !cardNumberValid(card.number)
        ? "cardNumberInvalid"
        : undefined,
    expiry:
      card.expiry.length === 4 && !expiryValid(card.expiry)
        ? "cardExpiryInvalid"
        : undefined,
  };
}

export async function tokenizeCard(card: CardInput): Promise<string> {
  if (!cardReady(card)) throw new Error("Card is not complete.");
  return `tok_mock_${crypto.randomUUID()}`;
}
