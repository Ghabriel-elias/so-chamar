"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { flushSync } from "react-dom";

import { CatalogPicker } from "@/components/provider/catalog-picker";
import { useServiceDraft } from "@/utils/provider/service-draft";
import { DepositSwitch } from "./deposit-switch";
import { WorkingHoursForm } from "@/components/provider/working-hours-form";
import { WorkingHoursSummary } from "@/components/provider/working-hours-summary";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { RangeField } from "@/components/ui/range-field";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { MAX_DEPOSIT, MIN_DEPOSIT } from "@/utils/booking/rules";
import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { goToField } from "@/utils/forms/problems";

import { useSettings } from "./useSettings";
import { withBack } from "@/utils/panel/back";
import type { Provider, Service, WorkingHours } from "@/types/provider";

export function SettingsView() {
  const t = useTranslations("panel.settings");
  const screen = useSettings();
  const { tab, setTab, services, hours, reload } = screen;

  if (screen.loading) return <ListSkeleton rows={4} className="mt-6" />;

  const provider = screen.provider;

  if (screen.error || !provider) {
    return (
      <Notice kind="error" live className="mt-6">
        {screen.error ?? t("failed")}
      </Notice>
    );
  }

  return (
    <>
      <header className="animate-rise pt-6">
        <h1 className="text-title">{t("title")}</h1>
      </header>

      <Tabs
        label={t("tabsLabel")}
        active={tab}
        onChange={setTab}
        className="mt-6"
        items={[
          { id: "services", label: t("services"), count: services.length },
          { id: "hours", label: t("hours") },
          { id: "payment", label: t("payment") },
        ]}
      />

      <div className="mt-6 pb-8">
        <TabPanel id="services" active={tab}>
          <ServicesTab
            services={services}
            collectsDeposit={provider.collectsDeposit}
            depositPercent={provider.depositPercent}
            onSaved={reload}
          />
        </TabPanel>

        <TabPanel id="hours" active={tab}>
          <HoursTab hours={hours} onSaved={reload} />
        </TabPanel>

        <TabPanel id="payment" active={tab}>
          <PaymentTab provider={provider} onSaved={reload} />
        </TabPanel>
      </div>
    </>
  );
}

function ServicesTab({
  services,
  collectsDeposit,
  depositPercent,
  onSaved,
}: {
  services: Service[];
  collectsDeposit: boolean;
  depositPercent: number;
  onSaved: () => Promise<void>;
}) {
  const draft = useServiceDraft(services);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setFailure(null);
    try {
      await draft.commit();
      await onSaved();
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {failure ? (
        <Notice kind="error" live className="mb-4">
          {failure}
        </Notice>
      ) : null}

      <CatalogPicker
        ownBar
        mode="mine"
        addHref={withBack("/painel/ajustes/adicionar", "/painel/ajustes")}
        services={services}
        collectsDeposit={collectsDeposit}
        depositPercent={depositPercent}
        draft={draft}
        saving={saving}
        onSave={() => void save()}
        onCreated={onSaved}
      />
    </>
  );
}

const HOURS_EDIT = "settings-hours-edit";
const HOURS_FORM = "settings-hours-form";

function HoursTab({
  hours,
  onSaved,
}: {
  hours: WorkingHours[];
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations("panel.settings");
  const [editing, setEditing] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  function edit() {
    flushSync(() => {
      setEditing(true);
      setAnnouncement("");
    });
    goToField(HOURS_FORM);
  }

  function backToSummary(message: string) {
    flushSync(() => {
      setEditing(false);
      setAnnouncement(message);
    });
    document.getElementById(HOURS_EDIT)?.focus();
  }

  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      {editing ? (
        <div id={HOURS_FORM} className="scroll-mt-20">
          <WorkingHoursForm
            hours={hours}
            onSaved={async () => {
              await onSaved();
              backToSummary(t("savedHours"));
            }}
            onBack={() => backToSummary("")}
            backLabel={t("cancel")}
            bar={{ enter: true, aboveNav: true }}
            className="animate-rise"
          />
        </div>
      ) : (
        <div className="animate-rise">
          <WorkingHoursSummary hours={hours}>
            <Button
              id={HOURS_EDIT}
              look="secondary"
              icon={Pencil}
              aria-label={t("editHoursLabel")}
              className="self-start"
              onClick={edit}
            >
              {t("edit")}
            </Button>
          </WorkingHoursSummary>
        </div>
      )}
    </>
  );
}

const DEPOSIT_EDIT = "settings-default-deposit-edit";
const DEPOSIT_FORM = "settings-default-deposit-form";

const snapDeposit = (value: number) =>
  Math.min(
    MAX_DEPOSIT,
    Math.max(MIN_DEPOSIT, Math.round((value || 0) / 10) * 10),
  );

function PaymentTab({
  provider,
  onSaved,
}: {
  provider: Provider;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations("panel.settings");
  const tUi = useTranslations("ui");

  const [collectsDeposit, setCollectsDeposit] = useState(
    provider.collectsDeposit,
  );
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositStatus, setDepositStatus] = useState("");
  const [depositFailure, setDepositFailure] = useState<string | null>(null);

  const [savedPercent, setSavedPercent] = useState(
    snapDeposit(provider.depositPercent),
  );
  const [percent, setPercent] = useState(savedPercent);
  const [editingPercent, setEditingPercent] = useState(false);
  const [percentStatus, setPercentStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function switchDeposit(next: boolean) {
    setDepositBusy(true);
    setDepositFailure(null);
    setCollectsDeposit(next);

    try {
      await api.saveProfile({ collectsDeposit: next });
      setDepositStatus(next ? t("depositTurnedOn") : t("depositTurnedOff"));
      await onSaved();
    } catch (problem) {
      setCollectsDeposit(!next);
      setDepositStatus("");
      setDepositFailure(messageFrom(problem));
    } finally {
      setDepositBusy(false);
    }
  }

  function editPercent() {
    flushSync(() => {
      setPercent(savedPercent);
      setEditingPercent(true);
      setPercentStatus("");
    });
    goToField(DEPOSIT_FORM);
  }

  function closePercent(message: string) {
    flushSync(() => {
      setEditingPercent(false);
      setPercentStatus(message);
      setFailure(null);
    });
    document.getElementById(DEPOSIT_EDIT)?.focus();
  }

  async function savePercent() {
    setBusy(true);
    setFailure(null);
    try {
      await api.saveProfile({ depositPercent: percent });
      setSavedPercent(percent);
      await onSaved();
      closePercent(t("defaultDepositSaved"));
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Sheet>
        <SheetHeader title={t("depositTitle")} />
        <SheetBody className="flex flex-col gap-3">
          <DepositSwitch
            checked={collectsDeposit}
            busy={depositBusy}
            onChange={switchDeposit}
          />
          <p role="status" className="text-note text-ink empty:hidden">
            {depositStatus}
          </p>
          <p className="text-note text-gray">{t("depositExisting")}</p>
          {depositFailure ? (
            <Notice kind="error" live>
              {depositFailure}
            </Notice>
          ) : null}
        </SheetBody>
      </Sheet>

      {collectsDeposit ? (
        <Sheet>
          <SheetBody className="flex flex-col gap-4">
            <p role="status" className="sr-only">
              {percentStatus}
            </p>
            {editingPercent ? (
              <div
                id={DEPOSIT_FORM}
                className="flex animate-rise flex-col gap-4"
              >
                <RangeField
                  label={t("defaultDepositLabel")}
                  hint={t("defaultDepositHint")}
                  value={percent}
                  onChange={(value) => setPercent(snapDeposit(value))}
                  min={MIN_DEPOSIT}
                  max={MAX_DEPOSIT}
                  step={10}
                  valueText={tUi("percentValue", { value: percent / 100 })}
                  minText={tUi("percentValue", { value: MIN_DEPOSIT / 100 })}
                  maxText={tUi("percentValue", { value: MAX_DEPOSIT / 100 })}
                />
                {failure ? (
                  <Notice kind="error" live>
                    {failure}
                  </Notice>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    look="secondary"
                    disabled={busy}
                    onClick={() => {
                      setPercent(savedPercent);
                      closePercent("");
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    look="primary"
                    loading={busy}
                    className="min-h-touch!"
                    onClick={savePercent}
                  >
                    {t("save")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1">
                <div className="flex w-full items-baseline justify-between gap-4">
                  <p className="text-body font-medium text-ink">
                    {t("defaultDepositLabel")}
                  </p>
                  <p
                    data-default-deposit
                    className="tabular text-title text-ink"
                  >
                    {tUi("percentValue", { value: savedPercent / 100 })}
                  </p>
                </div>
                <p className="text-note text-gray">{t("defaultDepositHint")}</p>
                <Button
                  id={DEPOSIT_EDIT}
                  look="secondary"
                  icon={Pencil}
                  aria-label={t("editDefaultDepositLabel")}
                  className="mt-2"
                  onClick={editPercent}
                >
                  {t("edit")}
                </Button>
              </div>
            )}
          </SheetBody>
        </Sheet>
      ) : null}
    </div>
  );
}
