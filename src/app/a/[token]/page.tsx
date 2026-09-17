import { CustomerHub } from "@/screens/customer";

export function generateStaticParams() {
  return [{ token: "exemplo" }];
}

export default async function Page({ params }: PageProps<"/a/[token]">) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-160 px-gutter">
      <CustomerHub token={token} />
    </main>
  );
}
