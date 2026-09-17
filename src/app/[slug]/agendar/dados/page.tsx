import { ClientOnly } from "@/components/ui/client-only";
import { CustomerDetails } from "@/screens/book-details";
import { EXAMPLE_SLUG } from "@/utils/site";

export function generateStaticParams() {
  return [{ slug: EXAMPLE_SLUG }];
}

export default async function CustomerDetailsPage({
  params,
}: PageProps<"/[slug]/agendar/dados">) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-160 px-gutter pb-4">
      <ClientOnly>
        <CustomerDetails slug={slug} />
      </ClientOnly>
    </main>
  );
}
