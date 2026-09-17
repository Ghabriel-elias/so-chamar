"use client";

import {
  Check,
  ChevronRight,
  CreditCard,
  IdCard,
  Link2,
  LogOut,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { CityPicker } from "@/components/provider/city-picker";
import { PhotoPicker } from "@/components/provider/photo-picker";
import { ProviderWork } from "@/components/provider/provider-work";
import { Amount } from "@/components/ui/amount";
import { Button, ButtonLink } from "@/components/ui/button";
import { DataList, DataRow } from "@/components/ui/data-list";
import {
  ConfirmDialog,
  DIALOG_ACTION,
  InfoDialog,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/field";
import { FormProblems } from "@/components/ui/form-problems";
import { Header } from "@/components/ui/header";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/ui/notice";
import { Sheet, SheetBody } from "@/components/ui/sheet";
import { Link, useRouter } from "@/utils/navigation";
import { cn } from "@/utils/cn";
import { cityError, useCities, type CityValue } from "@/utils/address/cities";
import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { useServices } from "@/utils/api/queries";
import { longDay } from "@/utils/format/date";
import { digitsOnly, formatPhone, isValidPhone } from "@/utils/format/phone";
import {
  goToField,
  hasErrors,
  problemsFrom,
  type FieldErrors,
} from "@/utils/forms/problems";
import { PROFILE_IDS, profileFieldSpecs } from "@/utils/forms/profile";
import { copyText } from "@/utils/ui/clipboard";
import type { ProfileSectionKey } from "@/utils/provider/profile-sections";
import { fieldErrors } from "@/utils/validation/booking";
import { profileSchema } from "@/utils/validation/profile";
import type { Locale } from "@/i18n/config";
import type { Provider } from "@/types/provider";
import { SITE_DOMAIN } from "@/utils/site";

import { useProfile } from "./useProfile";

const ROW =
  "touchable -mx-2 flex min-h-touch w-[calc(100%+1rem)] items-center gap-3 rounded-card px-2 py-3 text-left hover:bg-paper active:bg-surface";

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-blue-soft text-blue">
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}
const ROW_ITEM = "border-b border-border last:border-b-0";

const LINK_ROW = "profile-link-row";

const SMALL_BUTTON = "min-h-touch! px-5!";

export function ProfileView() {
  const t = useTranslations("panel.profile");
  const tSettings = useTranslations("panel.settings");
  const locale = useLocale() as Locale;
  const screen = useProfile();
  const { linkOpen, setLinkOpen } = screen;

  if (screen.loading) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </span>
        </div>
        <ListSkeleton rows={3} />
      </div>
    );
  }

  const provider = screen.provider;

  if (!provider) {
    return (
      <Notice kind="error" live className="mt-6">
        {screen.error ?? t("failed")}
      </Notice>
    );
  }

  const until = screen.subscription
    ? longDay(new Date(screen.subscription.nextChargeAt), locale)
    : "";
  const subscriptionHint = !screen.subscription
    ? ""
    : screen.subscription.state === "cancelled"
      ? t("sub_cancelled", { date: until })
      : t(`sub_${screen.access}` as "sub_active", { date: until });

  return (
    <>
      <header className="animate-rise pt-6">
        <h1 className="text-title">{t("title")}</h1>
      </header>

      <Identity provider={provider} />

      <Sheet className="mt-6">
        <SheetBody>
          <ul>
            <li className={ROW_ITEM}>
              <button
                id={LINK_ROW}
                type="button"
                data-profile-row="link"
                aria-haspopup="dialog"
                onClick={() => setLinkOpen(true)}
                className={ROW}
              >
                <RowIcon icon={Link2} />
                <RowText
                  label={tSettings("yourLink")}
                  hint={`${SITE_DOMAIN}/${provider.slug}`}
                />
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-gray"
                />
              </button>
            </li>

            <li className={ROW_ITEM}>
              <Link
                href="/painel/perfil/dados"
                data-profile-row="dados"
                className={ROW}
              >
                <RowIcon icon={IdCard} />
                <RowText
                  label={tSettings("yourDetails")}
                  hint={t("detailsHint")}
                />
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-gray"
                />
              </Link>
            </li>

            <li className={ROW_ITEM}>
              <Link
                href="/painel/perfil/assinatura"
                data-profile-row="assinatura"
                className={ROW}
              >
                <RowIcon icon={CreditCard} />
                <RowText label={t("subscription")} hint={subscriptionHint} />
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-gray"
                />
              </Link>
            </li>
          </ul>
        </SheetBody>
      </Sheet>

      <div className="mt-6 pb-8">
        <SignOutButton />
      </div>

      <LinkDialog
        open={linkOpen}
        slug={provider.slug}
        onClose={() => setLinkOpen(false)}
      />
    </>
  );
}

function RowText({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-body text-ink">{label}</span>
      <span className="block wrap-break-word text-note text-gray">{hint}</span>
    </span>
  );
}

function Identity({ provider }: { provider: Provider }) {
  const t = useTranslations("panel.profile");
  const tPhoto = useTranslations("photo");
  const services = useServices();
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function save(photo: string) {
    setSaving(true);
    setFailure(null);
    try {
      await api.saveProfile({ photo });
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <PhotoPicker
          shape="badge"
          id="profile-photo"
          name={provider.name}
          value={provider.photo}
          onChange={(photo) => void save(photo)}
        />

        <div className="flex min-w-0 flex-col items-start">
          <p className="text-lead text-ink">{provider.name}</p>
          <ProviderWork
            services={services.data ?? []}
            className="text-note text-gray"
          />
          {provider.photo ? (
            <Button
              look="plain"
              icon={Trash2}
              loading={saving}
              className="px-0! text-note! text-red!"
              onClick={() => void save("")}
            >
              {tPhoto("remove")}
            </Button>
          ) : null}
        </div>
      </div>

      <p role="status" className="sr-only">
        {saving ? t("photoSaving") : ""}
      </p>

      {failure ? (
        <p role="alert" className="text-note text-red">
          {failure}
        </p>
      ) : null}
    </div>
  );
}
function LinkDialog({
  open,
  slug,
  onClose,
}: {
  open: boolean;
  slug: string;
  onClose: () => void;
}) {
  const t = useTranslations("panel.profile");
  const tSettings = useTranslations("panel.settings");
  const [copied, setCopied] = useState(false);
  const publicLink = `${SITE_DOMAIN}/${slug}`;

  async function copy() {
    if (!(await copyText(`https://${publicLink}`))) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <InfoDialog
      open={open}
      title={tSettings("yourLink")}
      closeLabel={t("linkClose")}
      returnFocusId={LINK_ROW}
      onClose={onClose}
      actions={
        <>
          <ButtonLink
            look="secondary"
            href={`/${slug}`}
            className={DIALOG_ACTION}
          >
            {t("linkOpen")}
          </ButtonLink>
          <Button
            look="primary"
            icon={copied ? Check : undefined}
            className={DIALOG_ACTION}
            onClick={copy}
          >
            {copied ? tSettings("copied") : tSettings("copyLink")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 text-center">
        <p className="tabular break-all text-lead text-ink">{publicLink}</p>
        <p className="text-note text-gray">{tSettings("yourLinkNote")}</p>
      </div>
    </InfoDialog>
  );
}

export function ProfileSection({ section }: { section: ProfileSectionKey }) {
  const t = useTranslations("panel.profile");
  const tSettings = useTranslations("panel.settings");
  const screen = useProfile();

  if (screen.loading) return <ListSkeleton rows={3} className="mt-6" />;

  const provider = screen.provider;

  if (!provider) {
    return (
      <Notice kind="error" live className="mt-6">
        {screen.error ?? t("failed")}
      </Notice>
    );
  }

  const titles: Record<ProfileSectionKey, string> = {
    dados: tSettings("yourDetails"),
    assinatura: t("subscription"),
    excluir: t("deleteTitle"),
  };

  return (
    <>
      <Header
        title={titles[section]}
        backTo={
          section === "excluir" ? "/painel/perfil/dados" : "/painel/perfil"
        }
      />

      <div className="flex flex-col gap-4 pb-8">
        {section === "dados" ? (
          <>
            <DetailsSheet provider={provider} />
            <DeleteAccount />
          </>
        ) : null}
        {section === "excluir" ? <DeleteAccountScreen /> : null}
        {section === "assinatura" && screen.subscription && screen.access ? (
          <SubscriptionSheet
            subscription={screen.subscription}
            access={screen.access}
          />
        ) : null}
      </div>
    </>
  );
}

function DetailsSheet({ provider }: { provider: Provider }) {
  const t = useTranslations("panel.profile");
  const tSettings = useTranslations("panel.settings");
  const tError = useTranslations("errors");
  const tField = useTranslations("fieldNames");

  const [name, setName] = useState(provider.name);
  const [phone, setPhone] = useState(provider.phone);
  const [city, setCity] = useState<CityValue>({
    city: provider.city,
    cityCode: provider.cityCode,
  });
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const cities = useCities({ enabled: false });

  const result = profileSchema.safeParse({ name });
  const found: FieldErrors = result.success ? {} : fieldErrors(result.error);
  const cityProblem = cityError(city, cities.isError);
  if (cityProblem) found.city = cityProblem;
  if (!phone) found.phone = "phoneRequired";
  else if (!isValidPhone(phone)) found.phone = "phoneShort";

  const fields = profileFieldSpecs(tField, {
    city,
    withName: true,
    nameValue: name,
    phoneValue: phone,
  });
  const errors: FieldErrors = attempted ? found : {};
  const errorFor = (field: string) =>
    errors[field] ? tError(errors[field] as string) : undefined;

  const touched = () => setSaved(false);

  async function save() {
    if (!result.success || hasErrors(found)) {
      setAttempted(true);
      goToField(problemsFrom(found, fields)[0]?.target);
      return;
    }

    setBusy(true);
    setFailure(null);
    try {
      await api.saveProfile({
        ...result.data,
        phone,
        city: city.city.trim(),
        cityCode: city.cityCode,
      });
      setSaved(true);
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet>
      <SheetBody className="flex flex-col gap-5">
        <TextField
          id={PROFILE_IDS.name}
          label={tSettings("nameLabel")}
          value={name}
          onChange={(event) => {
            touched();
            setName(event.target.value);
          }}
          error={errorFor("name")}
        />
        <TextField
          id={PROFILE_IDS.phone}
          label={t("phoneLabel")}
          hint={t("phoneHint")}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={formatPhone(phone)}
          onChange={(event) => {
            touched();
            setPhone(digitsOnly(event.target.value));
          }}
          error={errorFor("phone")}
        />
        <CityPicker
          id={PROFILE_IDS.city}
          value={city}
          onChange={(next) => {
            touched();
            setCity(next);
          }}
          error={errorFor("city")}
        />

        {failure ? (
          <Notice kind="error" live>
            {failure}
          </Notice>
        ) : null}

        <FormProblems problems={problemsFrom(errors, fields)} />
        <Button
          look="primary"
          fullWidth
          icon={saved ? Check : undefined}
          loading={busy}
          onClick={save}
        >
          {saved ? tSettings("saved") : tSettings("save")}
        </Button>
      </SheetBody>
    </Sheet>
  );
}

function SubscriptionSheet({
  subscription,
  access,
}: {
  subscription: Awaited<ReturnType<typeof api.getSubscription>>["subscription"];
  access: Awaited<ReturnType<typeof api.getSubscription>>["access"];
}) {
  const t = useTranslations("panel.profile");
  const locale = useLocale() as Locale;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const cancelled = subscription.state === "cancelled";
  const endsOn = longDay(new Date(subscription.nextChargeAt), locale);

  async function cancel() {
    setBusy(true);
    setFailure(null);
    try {
      await api.cancelSubscription();
      setConfirming(false);
      setStatus(t("cancelledStatus", { date: endsOn }));
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet>
      <SheetBody>
        <DataList>
          <DataRow label={t("plan")}>
            <Amount cents={subscription.monthlyAmount} />
            <span className="block text-note text-gray">{t("perMonth")}</span>
          </DataRow>
          <DataRow label={t("subscriptionState")}>
            {cancelled
              ? t("access_cancelled")
              : t(`access_${access}` as "access_active")}
          </DataRow>
          <DataRow
            label={
              cancelled
                ? t("usableUntil")
                : access === "trial"
                  ? t("freeUntil")
                  : access === "active"
                    ? t("paidUntil")
                    : t("blockedSince")
            }
          >
            <span className="first-letter:uppercase">{endsOn}</span>
          </DataRow>
        </DataList>

        {cancelled ? (
          <p className="mt-4 text-note text-ink">
            {t("cancelledNote", { date: endsOn })}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {cancelled ? null : (
            <Button
              id="subscription-cancel"
              look="destructive"
              aria-label={t("cancelSubscription")}
              className={SMALL_BUTTON}
              onClick={() => setConfirming(true)}
            >
              {t("cancelShort")}
            </Button>
          )}
          <ButtonLink
            id="subscription-pay"
            look="primary"
            href="/painel/assinatura"
            aria-label={cancelled ? t("reactivate") : t("paySubscription")}
            className={SMALL_BUTTON}
          >
            {cancelled ? t("reactivateShort") : t("payShort")}
          </ButtonLink>
        </div>

        <p className="mt-4 text-note text-gray">{t("subscriptionNote")}</p>
        <p role="status" className="sr-only">
          {status}
        </p>
      </SheetBody>

      <ConfirmDialog
        open={confirming}
        title={t("cancelConfirm")}
        consequence={t("cancelConsequence", { date: endsOn })}
        confirmLabel={t("cancelYes")}
        loading={busy}
        failure={failure}
        onConfirm={() => void cancel()}
        onCancel={() => setConfirming(false)}
      />
    </Sheet>
  );
}

function DeleteAccount() {
  const t = useTranslations("panel.profile");

  return (
    <Link
      id="delete-account"
      href="/painel/perfil/excluir"
      className="touchable mx-auto flex min-h-touch items-center gap-2 rounded-card px-3 text-note font-medium text-red underline underline-offset-4 active:bg-red-soft"
    >
      <Trash2 aria-hidden="true" className="size-5 shrink-0" />
      {t("deleteAccount")}
    </Link>
  );
}

const LOSSES = ["lossLink", "lossAgenda", "lossReviews", "lossMoney"] as const;

function DeleteAccountScreen() {
  const t = useTranslations("panel.profile");
  const router = useRouter();

  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function erase() {
    setBusy(true);
    setFailure(null);
    try {
      await api.deleteAccount();
      router.push("/");
    } catch (problem) {
      setFailure(messageFrom(problem));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="text-body text-ink">{t("deleteLead")}</p>

      <Sheet>
        <SheetBody>
          <ul className="flex flex-col gap-4">
            {LOSSES.map((key) => (
              <li key={key} className="flex items-start gap-3">
                <X
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-red"
                />
                <span className="text-body text-ink">{t(key)}</span>
              </li>
            ))}
          </ul>
        </SheetBody>
      </Sheet>

      <p className="text-note text-gray">{t("deleteBlocked")}</p>

      <button
        type="button"
        role="checkbox"
        aria-checked={sure}
        onClick={() => setSure((was) => !was)}
        className="touchable flex min-h-touch items-start gap-3 rounded-card py-1 text-left active:bg-surface"
      >
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border transition-colors duration-150",
            sure ? "border-red bg-red text-white" : "border-border bg-white",
          )}
        >
          {sure ? <Check className="size-4 animate-check" /> : null}
        </span>
        <span className="text-body text-ink">{t("deleteSure")}</span>
      </button>

      {failure ? (
        <Notice kind="error" live>
          {failure}
        </Notice>
      ) : null}

      <Button
        look="destructive_solid"
        fullWidth
        icon={Trash2}
        disabled={!sure}
        loading={busy}
        onClick={() => void erase()}
      >
        {t("deleteConfirm")}
      </Button>
    </>
  );
}

function SignOutButton() {
  const tSettings = useTranslations("panel.settings");
  const router = useRouter();

  return (
    <Button
      look="destructive"
      fullWidth
      icon={LogOut}
      onClick={async () => {
        await api.signOut();
        router.push("/");
      }}
    >
      {tSettings("signOut")}
    </Button>
  );
}
