import { ProviderPage } from "@/screens/provider-page";
import { EXAMPLE_SLUG } from "@/utils/site";

export function generateStaticParams() {
  return [{ slug: EXAMPLE_SLUG }];
}

export default async function PublicProviderPage({
  params,
}: PageProps<"/[slug]">) {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-160 px-gutter">
      <ProviderPage slug={slug} />
    </main>
  );
}
