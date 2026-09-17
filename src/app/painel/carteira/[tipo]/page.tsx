import { Suspense } from "react";

import { notFound } from "next/navigation";

import { MoneyEntriesView } from "@/screens/wallet-list";
import { kindFromSlug, WALLET_SLUGS } from "@/utils/booking/wallet";

export function generateStaticParams() {
  return WALLET_SLUGS.map((tipo) => ({ tipo }));
}

export default async function WalletListPage({
  params,
}: PageProps<"/painel/carteira/[tipo]">) {
  const { tipo } = await params;
  const kind = kindFromSlug(tipo);

  if (!kind) notFound();

  return <Suspense><MoneyEntriesView kind={kind} /></Suspense>;
}
