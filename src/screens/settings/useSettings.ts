"use client";

import { useState } from "react";

import { useServices, useSession, useWorkingHours } from "@/utils/api/queries";

export function useSettings() {
  const [tab, setTab] = useState("services");

  const sessionQuery = useSession();
  const servicesQuery = useServices();
  const hoursQuery = useWorkingHours();

  const loading =
    sessionQuery.loading || servicesQuery.loading || hoursQuery.loading;

  return {
    tab,
    setTab,
    loading,
    error: sessionQuery.error ?? servicesQuery.error ?? hoursQuery.error,
    provider: loading ? null : sessionQuery.data,
    services: servicesQuery.data ?? [],
    hours: hoursQuery.data ?? [],
    reload: async () => {
      await Promise.all([
        sessionQuery.reload(),
        servicesQuery.reload(),
        hoursQuery.reload(),
      ]);
    },
  };
}
