import { Suspense } from "react";

import { PickTime } from "@/screens/book-time";
import { EXAMPLE_SLUG } from "@/utils/site";

export function generateStaticParams() {
  return [{ slug: EXAMPLE_SLUG }];
}

export default async function PickTimePage({
  params,
}: PageProps<"/[slug]/agendar/horario">) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-160 px-gutter pb-4">
      <Suspense><PickTime slug={slug} /></Suspense>
    </main>
  );
}
