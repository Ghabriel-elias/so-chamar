import { LeaveReview } from "@/screens/customer-review";

export function generateStaticParams() {
  return [{ token: "exemplo" }];
}

export default async function Page({ params }: PageProps<"/a/[token]/avaliar">) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-160 px-gutter pb-4">
      <LeaveReview token={token} />
    </main>
  );
}
