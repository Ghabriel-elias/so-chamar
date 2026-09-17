import { Suspense } from "react";

import { BookingDetailView } from "@/screens/booking-detail";

export function generateStaticParams() {
  return [{ id: "exemplo" }];
}

export default async function PanelBookingDetailPage({
  params,
}: PageProps<"/painel/agendamentos/[id]">) {
  const { id } = await params;

  return <Suspense><BookingDetailView id={id} /></Suspense>;
}
