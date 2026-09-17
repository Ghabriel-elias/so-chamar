import type { MoneyEntryKind } from "@/utils/booking/money";

const SLUGS: Record<MoneyEntryKind, string> = {
  received: "recebido",
  held: "guardado",
  incoming: "a-receber",
  refunded: "devolvido",
  no_shows: "faltas",
};

export const WALLET_SLUGS = Object.values(SLUGS);

export function walletHref(month?: string) {
  return month ? `/painel/carteira?mes=${month}` : "/painel/carteira";
}

export function walletListHref(kind: MoneyEntryKind, month?: string) {
  return `/painel/carteira/${SLUGS[kind]}${month ? `?mes=${month}` : ""}`;
}

export function kindFromSlug(slug: string): MoneyEntryKind | null {
  const found = (Object.entries(SLUGS) as Array<[MoneyEntryKind, string]>).find(
    ([, word]) => word === slug,
  );
  return found ? found[0] : null;
}
