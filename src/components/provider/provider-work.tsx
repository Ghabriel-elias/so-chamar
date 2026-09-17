import { tradesOf } from "@/utils/catalog/catalog";
import type { Service } from "@/types/provider";

export function ProviderWork({
  services,
  className,
}: {
  services: ReadonlyArray<Pick<Service, "catalogId">>;
  className?: string;
}) {
  const trades = tradesOf(services);

  if (trades.length === 0) return null;
  return <p className={className}>{trades.join(" · ")}</p>;
}
