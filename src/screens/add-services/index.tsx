"use client";

import { useTranslations } from "next-intl";

import { CatalogPicker } from "@/components/provider/catalog-picker";
import { Header } from "@/components/ui/header";
import { Notice } from "@/components/ui/notice";
import { ListSkeleton } from "@/components/ui/skeleton";

import { useAddServices } from "./useAddServices";

export function AddServicesView() {
  const t = useTranslations("catalog");
  const screen = useAddServices();

  if (screen.loading) return <ListSkeleton rows={5} className="mt-6" />;

  const provider = screen.provider;

  if (!provider) {
    return (
      <Notice kind="error" live className="mt-6">
        {screen.sessionError ?? t("failed")}
      </Notice>
    );
  }

  return (
    <>
      <Header
        title={
          screen.adding
            ? t("addHeading")
            : screen.open
              ? screen.open.name
              : t("browse")
        }
        backTo={screen.open || screen.adding ? undefined : screen.back}
        onBack={
          screen.adding
            ? () => screen.setAdding(false)
            : screen.open
              ? () => screen.setOpenId(null)
              : undefined
        }
      />

      {screen.failure ? (
        <Notice kind="error" live className="mb-4">
          {screen.failure}
        </Notice>
      ) : null}

      <CatalogPicker
        ownBar
        mode="browse"
        services={screen.services}
        collectsDeposit={provider.collectsDeposit}
        depositPercent={provider.depositPercent}
        draft={screen.draft}
        saving={screen.saving}
        onSave={() => void screen.save()}
        onCreated={screen.reloadServices}
        openId={screen.openId}
        onOpenId={screen.setOpenId}
        adding={screen.adding}
        onAdding={screen.setAdding}
      />
    </>
  );
}
