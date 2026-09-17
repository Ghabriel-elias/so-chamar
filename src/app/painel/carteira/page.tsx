import { Suspense } from "react";

import { MoneyView } from "@/screens/wallet";

export default function PanelWalletPage() {
  return <Suspense><MoneyView /></Suspense>;
}
