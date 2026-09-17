"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { usePublicPage } from "@/utils/api/queries";
import { useDraft } from "@/utils/booking/draft";
import { goToField, problemsFrom } from "@/utils/forms/problems";
import { useStepArrival } from "@/utils/motion/step-arrival";
import { useRouter } from "@/utils/navigation";

export function useBookTime(slug: string) {
  const serviceFromUrl = useSearchParams().get("servico") ?? "";
  const tField = useTranslations("fieldNames");
  const router = useRouter();
  const { draft, update } = useDraft();
  const arrival = useStepArrival("booking", 1);

  const serviceId = serviceFromUrl || draft.serviceId || "";

  const [picked, setPicked] = useState<string | undefined>(
    draft.serviceId === serviceId ? draft.startsAt : undefined,
  );
  const [attempted, setAttempted] = useState(false);

  const { data, loading } = usePublicPage(slug);
  const service = data?.services.find((item) => item.id === serviceId);
  const missing = attempted && !picked;

  function goOn() {
    if (!picked || !service) {
      setAttempted(true);
      goToField("booking-slots");
      return;
    }

    update({
      slug,
      serviceId,
      serviceName: service.name,
      startsAt: picked,
    });
    router.push(`/${slug}/agendar/dados`);
  }

  return {
    arrival,
    loading,
    page: data,
    service,
    serviceId,
    picked,
    setPicked,
    missing,
    problems: problemsFrom(missing ? { slot: "slotRequired" } : {}, [
      {
        key: "slot",
        name: tField("slot"),
        target: "booking-slots",
        empty: true,
      },
    ]),
    goOn,
  };
}
