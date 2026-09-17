import { PaymentScreen } from "@/screens/customer-payment";

export function generateStaticParams() {
  return [{ token: "exemplo" }];
}

export default async function Page({ params }: PageProps<"/a/[token]/pagar">) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-160 px-gutter pb-4">
      <PaymentScreen token={token} />
    </main>
  );
}
