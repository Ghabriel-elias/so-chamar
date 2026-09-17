"use client";

import { useState } from "react";

import { useSession, useSubscription } from "@/utils/api/queries";

export function useProfile() {
  const sessionQuery = useSession();
  const subscriptionQuery = useSubscription();
  const [linkOpen, setLinkOpen] = useState(false);

  return {
    loading: sessionQuery.loading || subscriptionQuery.loading,
    provider: sessionQuery.data,
    error: sessionQuery.error,
    access: subscriptionQuery.data?.access,
    subscription: subscriptionQuery.data?.subscription,
    linkOpen,
    setLinkOpen,
  };
}
