"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { messageFrom } from "@/utils/api/errors";
import { useCategories, useServices, useSession } from "@/utils/api/queries";
import { useRouter } from "@/utils/navigation";
import { backHref } from "@/utils/panel/back";
import { useServiceDraft } from "@/utils/provider/service-draft";

export function useAddServices() {
  const from = useSearchParams().get("de") ?? undefined;
  const back = from ? backHref(from) : "/painel/ajustes";
  const router = useRouter();
  const session = useSession();
  const services = useServices();
  const categories = useCategories();
  const draft = useServiceDraft(services.data ?? []);

  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setFailure(null);
    try {
      await draft.commit();
      await services.reload();
      router.push(back);
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setSaving(false);
    }
  }

  return {
    back,
    loading: session.loading || services.loading,
    provider: session.data,
    sessionError: session.error,
    services: services.data ?? [],
    reloadServices: services.reload,
    open: categories.data?.find((item) => item.id === openId) ?? null,
    openId,
    setOpenId,
    adding,
    setAdding,
    draft,
    saving,
    failure,
    save,
  };
}
