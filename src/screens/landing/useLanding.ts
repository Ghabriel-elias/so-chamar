"use client";

import { usePublicPage } from "@/utils/api/queries";
import { depositOf } from "@/utils/format/currency";

const EXAMPLE = "ghabrielelias";

export function useLanding() {
  const { data, loading } = usePublicPage(EXAMPLE);

  if (!data) return { loading, page: null, service: null, deposit: 0, firstName: "" };

  const service = data.services[0];

  return {
    loading,
    page: data,
    service,
    deposit: depositOf(service.priceFrom, data.provider.depositPercent),
    firstName: data.provider.name.split(" ")[0],
  };
}
