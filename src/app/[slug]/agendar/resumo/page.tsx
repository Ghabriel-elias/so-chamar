import { ClientOnly } from "@/components/ui/client-only";
import { BookingSummary } from "@/screens/book-summary";
import { EXAMPLE_SLUG } from "@/utils/site";

export function generateStaticParams() {
  return [{ slug: EXAMPLE_SLUG }];
}

export default async function BookingSummaryPage({
  params,
}: PageProps<"/[slug]/agendar/resumo">) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-160 px-gutter pb-4">
      <ClientOnly>
        <BookingSummary slug={slug} />
      </ClientOnly>
    </main>
  );
}
