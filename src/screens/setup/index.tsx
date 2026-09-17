"use client";

import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  Copy,
  Gift,
  PartyPopper,
  Pencil,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { flushSync } from "react-dom";

import { SubscriptionPayment } from "@/components/panel/subscription-payment";
import { CityPicker } from "@/components/provider/city-picker";
import { PhotoPicker } from "@/components/provider/photo-picker";
import { copyText } from "@/utils/ui/clipboard";
import { CatalogPicker } from "@/components/provider/catalog-picker";
import { WorkingHoursForm } from "@/components/provider/working-hours-form";
import { WorkingHoursSummary } from "@/components/provider/working-hours-summary";
import { ActionBar } from "@/components/ui/action-bar";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog, FormDialog } from "@/components/ui/dialog";
import { ChoiceField } from "@/components/ui/field";
import { FormProblems } from "@/components/ui/form-problems";
import { ScreenSkeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { RangeField } from "@/components/ui/range-field";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import {
  StepTransition,
  stepAnimationClass,
} from "@/components/ui/step-transition";
import { Steps } from "@/components/ui/steps";
import { Link } from "@/utils/navigation";
import { cityError, useCities, type CityValue } from "@/utils/address/cities";
import { api } from "@/utils/api";
import { depositOf } from "@/utils/format/currency";
import { messageFrom } from "@/utils/api/errors";
import {
  clampDeposit,
  MAX_DEPOSIT,
  MIN_DEPOSIT,
  MONTHLY_FEE_CENTS,
  TRIAL_DAYS,
} from "@/utils/booking/rules";
import { longDay } from "@/utils/format/date";
import type { Locale } from "@/i18n/config";
import { cn } from "@/utils/cn";
import {
  goToField,
  hasErrors,
  problemsFrom,
  type FieldErrors,
  type FormProblem,
} from "@/utils/forms/problems";
import { PROFILE_IDS, profileFieldSpecs } from "@/utils/forms/profile";
import { useServiceDraft } from "@/utils/provider/service-draft";
import { fieldErrors } from "@/utils/validation/booking";
import type { StepDirection } from "@/utils/motion/step-arrival";
import { profileSchema } from "@/utils/validation/profile";
import type { Provider, Service } from "@/types/provider";
import { SITE_DOMAIN } from "@/utils/site";

import { TOTAL, useSetup, useSetupData } from "./useSetup";


export function Onboarding() {
  const t = useTranslations("onboarding");
  const { loading, provider, step, direction, go } = useSetup();

  if (loading) return <ScreenSkeleton rows={2} />;

  if (!provider) {
    return (
      <Notice
        kind="attention"
        title={t("needAccount")}
        className="mx-gutter mt-8"
      >
        <Link
          href="/cadastro"
          className="font-medium text-blue underline underline-offset-4"
        >
          {t("goSignUp")}
        </Link>
      </Notice>
    );
  }

  return (
    <div className="mx-auto w-full max-w-136 px-gutter pb-6 pt-8">
      <Steps current={step} total={TOTAL} from={0} className="mb-8" />

      <Setup provider={provider} step={step} direction={direction} go={go} />
    </div>
  );
}

function Setup({
  provider,
  step,
  direction,
  go,
}: {
  provider: Provider;
  step: number;
  direction: StepDirection;
  go: (next: number) => void;
}) {
  const setup = useSetupData();

  if (setup.loading) return <ScreenSkeleton rows={2} />;
  if (setup.blocked) return <SubscriptionPayment />;

  const { trialEndsAt, services, hours } = setup;

  return (
    <>
      {step === 1 ? (
        <AboutYou
          provider={provider}
          direction={direction}
          onDone={async () => go(2)}
        />
      ) : null}

      {step === 2 ? (
        <UpfrontPayment
          provider={provider}
          direction={direction}
          onBack={() => go(1)}
          onDone={() => go(3)}
        />
      ) : null}

      {step === 3 ? (
        <YourServices
          services={services}
          collectsDeposit={provider.collectsDeposit}
          depositPercent={provider.depositPercent}
          direction={direction}
          onBack={() => go(2)}
          onDone={() => go(4)}
          onChanged={setup.reloadServices}
        />
      ) : null}

      {step === 4 ? (
        <YourHours
          hours={hours}
          direction={direction}
          onBack={() => go(3)}
          onDone={() => go(5)}
        />
      ) : null}

      {step === 5 ? (
        <YourLink
          slug={provider.slug}
          trialEndsAt={trialEndsAt}
          direction={direction}
        />
      ) : null}
    </>
  );
}

function TrialNotice({ endsAt }: { endsAt: string }) {
  const t = useTranslations("onboarding");
  const locale = useLocale() as Locale;
  const date = longDay(new Date(endsAt), locale);

  return (
    <div className="mt-6 flex items-start gap-3 rounded-card border border-blue bg-blue-soft p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white">
        <Gift aria-hidden="true" className="size-5 text-blue" />
      </span>
      <div className="min-w-0">
        <p className="text-body font-semibold text-ink">
          {t("trialTitle", { days: TRIAL_DAYS })}
        </p>
        <p className="mt-1 text-body text-ink">
          {t.rich("trialReminder", {
            date,
            price: MONTHLY_FEE_CENTS / 100,
            b: (words) => <strong className="font-semibold">{words}</strong>,
          })}
        </p>
      </div>
    </div>
  );
}

const WITH_POINTS = ["with1", "with2", "with3", "with4", "with5"] as const;

const EXAMPLE_JOB = 10000;

const NEXT = "onboarding-next";
const PERCENT = "onboarding-deposit";

function UpfrontPayment({
  provider,
  direction,
  onBack,
  onDone,
}: {
  provider: Provider;
  direction: StepDirection;
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("onboarding");
  const tUi = useTranslations("ui");
  const [choice, setChoice] = useState<"with" | "without">(
    provider.collectsDeposit ? "with" : "without",
  );
  const [percent, setPercent] = useState(clampDeposit(provider.depositPercent));
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  function next() {
    setFailure(null);
    if (choice === "with") setAsking(true);
    else void save();
  }

  async function save() {
    setBusy(true);
    setFailure(null);
    try {
      await api.saveProfile({
        collectsDeposit: choice === "with",
        depositPercent: percent,
      });
      onDone();
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StepTransition direction={direction}>
        <h1 className="text-title">{t("depositTitle")}</h1>
        <p className="mt-2 text-body text-gray">
          {t.rich("depositNote", {
            price: MONTHLY_FEE_CENTS / 100,
            b: (words) => (
              <strong className="font-semibold text-ink">{words}</strong>
            ),
          })}
        </p>

        <div className="mt-6">
          <ChoiceField
            name="upfront-payment"
            label={t("depositQuestion")}
            value={choice}
            onChoose={setChoice}
            options={[
              {
                value: "with",
                label: t("depositWith"),
                detail: t("depositWithNote"),
              },
              {
                value: "without",
                label: t("depositWithout"),
                detail: t("depositWithoutNote"),
              },
            ]}
          />
        </div>

        {choice === "with" ? (
          <Sheet className="mt-6 animate-rise">
            <SheetHeader title={t("withHowTitle")} />
            <SheetBody>
              <ul className="flex flex-col gap-3 text-body text-ink">
                {WITH_POINTS.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-2 shrink-0 rounded-full bg-action"
                    />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </SheetBody>
          </Sheet>
        ) : null}

        {failure && !asking ? (
          <Notice kind="error" live className="mt-4">
            {failure}
          </Notice>
        ) : null}
      </StepTransition>

      <ActionBar narrow enter={direction === null}>
        <div className="flex gap-2">
          <Button
            look="secondary"
            onClick={onBack}
            className="min-h-touch-lg flex-1"
          >
            {t("back")}
          </Button>
          <Button
            id={NEXT}
            look="primary"
            icon={ArrowRight}
            loading={busy && !asking}
            onClick={next}
            className="flex-2"
          >
            {t("next")}
          </Button>
        </div>
      </ActionBar>

      <FormDialog
        open={asking}
        title={t("depositHowMuch")}
        closeLabel={tUi("close")}
        focusId={PERCENT}
        returnFocusId={NEXT}
        onClose={() => setAsking(false)}
      >
        <div className="flex flex-col gap-5">
          <RangeField
            id={PERCENT}
            label={t("depositPercentLabel")}
            hint={t("depositHowMuchHint")}
            value={percent}
            onChange={setPercent}
            min={MIN_DEPOSIT}
            max={MAX_DEPOSIT}
            step={10}
            valueText={tUi("percentValue", { value: percent / 100 })}
            minText={tUi("percentValue", { value: MIN_DEPOSIT / 100 })}
            maxText={tUi("percentValue", { value: MAX_DEPOSIT / 100 })}
            detail={t("depositExample", {
              amount: depositOf(EXAMPLE_JOB, percent) / 100,
              total: EXAMPLE_JOB / 100,
            })}
          />

          {failure ? (
            <Notice kind="error" live>
              {failure}
            </Notice>
          ) : null}

          <Button
            look="primary"
            fullWidth
            icon={ArrowRight}
            loading={busy}
            onClick={save}
          >
            {t("next")}
          </Button>
        </div>
      </FormDialog>
    </>
  );
}

function AboutYou({
  provider,
  direction,
  onBack,
  onDone,
}: {
  provider: NonNullable<Awaited<ReturnType<typeof api.session>>>;
  direction: StepDirection;
  onBack?: () => void;
  onDone: () => Promise<void>;
}) {
  const t = useTranslations("onboarding");

  const tError = useTranslations("errors");
  const tField = useTranslations("fieldNames");
  const tPhoto = useTranslations("photo");

  const [photo, setPhoto] = useState(provider.photo);
  const [askPhoto, setAskPhoto] = useState(false);
  const [city, setCity] = useState<CityValue>({
    city: provider.city,
    cityCode: provider.cityCode,
  });
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const cities = useCities({ enabled: false });

  const result = profileSchema.safeParse({ name: provider.name });
  const found: FieldErrors = result.success ? {} : fieldErrors(result.error);
  const cityProblem = cityError(city, cities.isError);
  if (cityProblem) found.city = cityProblem;

  const fields = profileFieldSpecs(tField, { city, withName: false });
  const errors: FieldErrors = attempted ? found : {};

  const errorFor = (field: string) =>
    errors[field] ? tError(errors[field] as string) : undefined;

  async function save(anyway = false) {
    if (!result.success || hasErrors(found)) {
      setAttempted(true);
      goToField(problemsFrom(found, fields)[0]?.target);
      return;
    }

    if (!photo && !anyway) {
      setAskPhoto(true);
      return;
    }

    setBusy(true);
    setFailure(null);
    try {
      await api.saveProfile({
        ...result.data,
        photo,
        city: city.city.trim(),
        cityCode: city.cityCode,
      });
      setAskPhoto(false);
      await onDone();
    } catch (problem) {
      setAskPhoto(false);
      setFailure(messageFrom(problem));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StepTransition direction={direction}>
        <h1 className="text-title">{t("profileTitle")}</h1>
        <p className="mt-2 text-body text-gray">{t("profileNote")}</p>

        <Sheet className="mt-6">
          <SheetBody className="flex flex-col gap-5">
            <PhotoPicker
              id="profile-photo"
              name={provider.name}
              value={photo}
              onChange={setPhoto}
              hint={tPhoto("why")}
            />
            <CityPicker
              id={PROFILE_IDS.city}
              value={city}
              onChange={setCity}
              error={errorFor("city")}
            />

            {failure ? (
              <Notice kind="error" live>
                {failure}
              </Notice>
            ) : null}
          </SheetBody>
        </Sheet>
      </StepTransition>

      <ActionBar
        narrow
        enter={direction === null}
        alert={<FormProblems problems={problemsFrom(errors, fields)} />}
      >
        <div className="flex gap-2">
          {onBack ? (
            <Button
              look="secondary"
              onClick={onBack}
              className="min-h-touch-lg flex-1"
            >
              {t("back")}
            </Button>
          ) : null}
          <Button
            look="primary"
            fullWidth={!onBack}
            loading={busy}
            onClick={() => void save()}
            className="flex-2"
          >
            {t("next")}
          </Button>
        </div>
      </ActionBar>

      <ConfirmDialog
        open={askPhoto}
        destructive={false}
        icon={Camera}
        title={tPhoto("skipTitle")}
        consequence={tPhoto("skipBody")}
        confirmLabel={tPhoto("skipConfirm")}
        cancelLabel={tPhoto("skipAdd")}
        loading={busy}
        returnFocusId="profile-photo"
        onConfirm={() => void save(true)}
        onCancel={() => {
          setAskPhoto(false);
          goToField("profile-photo");
        }}
      />
    </>
  );
}

function YourServices({
  services,
  collectsDeposit,
  depositPercent,
  direction,
  onBack,
  onDone,
  onChanged,
}: {
  services: Service[];
  collectsDeposit: boolean;
  depositPercent: number;
  direction: StepDirection;
  onBack: () => void;
  onDone: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const t = useTranslations("onboarding");
  const tCatalog = useTranslations("catalog");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [browsing, setBrowsing] = useState(services.length === 0);

  const draft = useServiceDraft(services);
  const canContinue = draft.count > 0;
  const problems: FormProblem[] =
    attempted && !canContinue
      ? [{ name: t("needOneService"), target: "step2-list", kind: "rule" }]
      : failure
        ? [{ name: failure, target: "step2-list", kind: "rule" }]
        : [];

  async function save() {
    setSaving(true);
    setFailure(null);
    try {
      await draft.commit();
      await onChanged();
      onDone();
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <StepTransition direction={direction}>
        {adding ? (
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="touchable -ml-2 mb-2 flex min-h-touch items-center gap-1 rounded-card px-2 text-body font-medium text-blue active:bg-surface"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
            {t("back")}
          </button>
        ) : null}

        <h1 id="step2-title" tabIndex={-1} className="text-title outline-none">
          {adding ? tCatalog("addHeading") : t("servicesTitle")}
        </h1>

        <div id="step2-list" className="mt-6 scroll-mt-6">
          <CatalogPicker
            services={services}
            collectsDeposit={collectsDeposit}
            depositPercent={depositPercent}
            draft={draft}
            onCreated={onChanged}
            adding={adding}
            onAdding={setAdding}
            openId={openId}
            onOpenId={setOpenId}
            browsing={browsing}
            onBrowsing={setBrowsing}
          />
        </div>
      </StepTransition>

      {adding ? null : (
        <ActionBar
          narrow
          enter={direction === null}
          alert={<FormProblems problems={problems} />}
        >
          <div className="flex gap-2">
            <Button
              look="secondary"
              onClick={
                openId
                  ? () => setOpenId(null)
                  : browsing && services.length > 0
                    ? () => setBrowsing(false)
                    : onBack
              }
              className="min-h-touch-lg flex-1"
            >
              {t("back")}
            </Button>
            <Button
              look="primary"
              loading={saving}
              onClick={() => {
                if (!canContinue) {
                  setAttempted(true);
                  goToField("step2-list");
                  return;
                }
                void save();
              }}
              className="flex-2"
            >
              {t("next")}
            </Button>
          </div>
        </ActionBar>
      )}
    </>
  );
}

function YourHours({
  hours,
  direction,
  onBack,
  onDone,
}: {
  hours: Awaited<ReturnType<typeof api.listWorkingHours>>;
  direction: StepDirection;
  onBack: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("onboarding");
  const tSettings = useTranslations("panel.settings");
  const [editing, setEditing] = useState(false);
  const [returned, setReturned] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  function edit() {
    flushSync(() => {
      setEditing(true);
      setAnnouncement("");
    });
    document.getElementById("step3-title")?.focus();
  }

  function backToSummary(message: string) {
    flushSync(() => {
      setEditing(false);
      setReturned(true);
      setAnnouncement(message);
    });
    window.scrollTo({ top: 0 });
    document.getElementById("step3-edit")?.focus();
  }

  return (
    <>
      <StepTransition direction={direction}>
        <h1 id="step3-title" tabIndex={-1} className="text-title outline-none">
          {t("hoursTitle")}
        </h1>
      </StepTransition>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      {editing ? (
        <WorkingHoursForm
          hours={hours}
          saveLabel={tSettings("save")}
          onSaved={() => backToSummary(tSettings("savedHours"))}
          onBack={() => backToSummary("")}
          backLabel={tSettings("cancel")}
          bar={{ enter: false }}
          className="mt-6 animate-rise"
        />
      ) : (
        <>
          <div
            className={cn(
              "mt-6",
              returned ? "animate-rise" : stepAnimationClass(direction),
            )}
          >
            <WorkingHoursSummary hours={hours}>
              <Button
                id="step3-edit"
                look="secondary"
                icon={Pencil}
                aria-label={tSettings("editHoursLabel")}
                className="self-start"
                onClick={edit}
              >
                {tSettings("edit")}
              </Button>
            </WorkingHoursSummary>
          </div>

          <ActionBar narrow enter={direction === null && !returned}>
            <div className="flex gap-2">
              <Button
                look="secondary"
                onClick={onBack}
                className="min-h-touch-lg flex-1"
              >
                {t("back")}
              </Button>
              <Button look="primary" onClick={onDone} className="flex-2">
                {t("next")}
              </Button>
            </div>
          </ActionBar>
        </>
      )}
    </>
  );
}

function YourLink({
  slug,
  trialEndsAt,
  direction,
}: {
  slug: string;
  trialEndsAt: string | null;
  direction: StepDirection;
}) {
  const t = useTranslations("onboarding");
  const [copied, setCopied] = useState(false);

  const link = `${SITE_DOMAIN}/${slug}`;

  return (
    <>
      <StepTransition direction={direction}>
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 animate-pop items-center justify-center rounded-full bg-green-soft [animation-delay:250ms]"
          >
            <PartyPopper className="size-7 text-green" />
          </span>

          <h1 className="text-title">{t("linkTitle")}</h1>
        </div>
        {trialEndsAt ? <TrialNotice endsAt={trialEndsAt} /> : null}

        <Sheet className="mt-6">
          <SheetHeader title={t("yourLink")} />
          <SheetBody className="flex flex-col gap-4">
            <p className="selectable tabular break-all text-lead text-ink">
              {link}
            </p>

            <Button
              look="primary"
              fullWidth
              icon={copied ? Check : Copy}
              onClick={async () => {
                if (!(await copyText(`https://${link}`))) return;
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2500);
              }}
            >
              {copied ? t("copied") : t("copyLink")}
            </Button>

            <p className="text-note text-gray">{t("whereToPaste")}</p>
          </SheetBody>
        </Sheet>

      </StepTransition>

      <ActionBar narrow enter={direction === null}>
        <ButtonLink look="secondary" fullWidth href={`/${slug}`}>
          {t("seeIt")}
        </ButtonLink>
        <ButtonLink look="primary" fullWidth href="/painel" icon={ArrowRight}>
          {t("goToPanel")}
        </ButtonLink>
      </ActionBar>
    </>
  );
}
