"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Pencil,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Amount } from "@/components/ui/amount";
import { ActionBar } from "@/components/ui/action-bar";
import { AddFab } from "@/components/ui/add-fab";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/dialog";
import { ListSkeleton } from "@/components/ui/skeleton";
import { MoneyField } from "@/components/ui/money-field";
import { Notice } from "@/components/ui/notice";
import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { useCatalog, useCategories } from "@/utils/api/queries";
import { TextField } from "@/components/ui/field";
import { useDurationText } from "@/components/ui/duration";
import {
  categoryOf,
  countByCategory,
  customCatalogId,
  isCustomCatalogId,
  type CatalogService,
} from "@/utils/catalog/catalog";
import { categoryIcon } from "@/utils/catalog/icons";
import { cn } from "@/utils/cn";
import { depositOf } from "@/utils/format/currency";
import type { Cents } from "@/types/booking";
import type { ServiceDraft } from "@/utils/provider/service-draft";
import type { Service } from "@/types/provider";

export function CatalogPicker({
  services,
  collectsDeposit,
  depositPercent,
  draft,
  onSave,
  saving = false,
  onCreated,
  ownBar = false,
  mode = "both",
  addHref,
  openId,
  onOpenId,
  adding,
  onAdding,
  browsing,
  onBrowsing,
}: {
  services: Service[];
  collectsDeposit: boolean;
  depositPercent: number;
  draft: ServiceDraft;
  onSave?: () => void;
  saving?: boolean;
  onCreated?: () => Promise<void> | void;
  ownBar?: boolean;
  mode?: "mine" | "browse" | "both";
  addHref?: string;
  openId?: string | null;
  onOpenId?: (id: string | null) => void;
  adding?: boolean;
  onAdding?: (open: boolean) => void;
  browsing?: boolean;
  onBrowsing?: (open: boolean) => void;
}) {
  const t = useTranslations("catalog");
  const tUi = useTranslations("ui");
  const [ownCategory, setOwnCategory] = useState<string | null>(null);
  const categoryId = onOpenId ? (openId ?? null) : ownCategory;
  const setCategoryId = (id: string | null) =>
    onOpenId ? onOpenId(id) : setOwnCategory(id);
  const [ownBrowsing, setOwnBrowsing] = useState(
    mode === "browse" || (mode === "both" && services.length === 0),
  );
  const inCatalog = onBrowsing ? Boolean(browsing) : ownBrowsing;
  const setBrowsing = (open: boolean) =>
    onBrowsing ? onBrowsing(open) : setOwnBrowsing(open);
  const [pricing, setPricing] = useState<CatalogService | null>(null);
  const [ownAdding, setOwnAdding] = useState(false);
  const writing = onAdding ? Boolean(adding) : ownAdding;
  const setWriting = (open: boolean) =>
    onAdding ? onAdding(open) : setOwnAdding(open);
  const [failure, setFailure] = useState<string | null>(null);

  const categories = useCategories();
  const catalog = useCatalog(categoryId);
  const perCategory = countByCategory(
    draft.pickedIds.map((catalogId) => ({ catalogId })),
  );

  const asItem =
    (id: string) =>
    (service: Service): CatalogService => ({
      id: service.catalogId,
      categoryId: id,
      name: service.name,
      priceFrom: service.priceFrom,
      durationMinutes: service.durationMinutes,
    });

  const offered = (id: string): CatalogService[] =>
    services
      .filter((service) => categoryOf(service.catalogId) === id)
      .map(asItem(id));

  const mine = (id: string): CatalogService[] =>
    services
      .filter(
        (service) =>
          isCustomCatalogId(service.catalogId) &&
          service.catalogId.startsWith(`custom:${id}:`),
      )
      .map((service) => ({
        id: service.catalogId,
        categoryId: id,
        name: service.name,
        priceFrom: service.priceFrom,
        durationMinutes: service.durationMinutes,
      }));

  async function createService(
    id: string,
    fields: { name: string; priceFrom: Cents; durationMinutes: number },
  ) {
    setWriting(false);
    setFailure(null);
    try {
      await api.saveService({
        catalogId: customCatalogId(id),
        name: fields.name,
        priceFrom: fields.priceFrom,
        durationMinutes: fields.durationMinutes,
        active: true,
      });
      await onCreated?.();
    } catch (problem) {
      setFailure(messageFrom(problem));
    }
  }

  if (categories.loading) return <ListSkeleton rows={5} />;

  const category =
    categories.data?.find((item) => item.id === categoryId) ?? null;

  if (writing && category) {
    return (
      <div className="flex flex-col gap-3">
        {failure ? (
          <Notice kind="error" live>
            {failure}
          </Notice>
        ) : null}

        <NewServiceForm
          category={category.name}
          onClose={() => setWriting(false)}
          onSave={(fields) => void createService(category.id, fields)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {failure ? (
        <Notice kind="error" live>
          {failure}
        </Notice>
      ) : null}

      {category ? (
        <>
          {ownBar || onOpenId ? null : (
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className="touchable -ml-2 flex min-h-touch items-center gap-1 self-start rounded-card px-2 text-body font-medium text-blue active:bg-surface"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
              {tUi("back")}
            </button>
          )}

          <Button
            look="primary"
            fullWidth
            icon={Plus}
            id="catalog-add"
            className="hidden! sm:inline-flex!"
            onClick={() => setWriting(true)}
          >
            {t("add")}
          </Button>

          {catalog.loading ? (
            <ListSkeleton rows={4} />
          ) : (
            <ul className="flex flex-col gap-2">
              {[...(catalog.data ?? []), ...mine(category.id)].map((item) => (
                <CatalogRow
                  key={item.id}
                  item={item}
                  price={draft.priceOf(item)}
                  checked={draft.picked(item.id)}
                  collectsDeposit={collectsDeposit}
                  depositPercent={depositPercent}
                  onToggle={() => draft.toggle(item)}
                  onEdit={() => setPricing(item)}
                />
              ))}
            </ul>
          )}
        </>
      ) : !inCatalog ? (
        <>
          {services.length === 0 ? (
            <p className="text-note text-gray">{t("noneYet")}</p>
          ) : null}

          {addHref ? (
            <ButtonLink
              look="primary"
              fullWidth
              icon={Plus}
              id="catalog-browse"
              href={addHref}
              className="hidden! sm:inline-flex!"
            >
              {t("browse")}
            </ButtonLink>
          ) : (
            <Button
              look="primary"
              fullWidth
              icon={Plus}
              id="catalog-browse"
              className="hidden! sm:inline-flex!"
              onClick={() => setBrowsing(true)}
            >
              {t("browse")}
            </Button>
          )}

          <ul className="flex flex-col gap-2">
            {(categories.data ?? []).flatMap((category) => {
              const items = offered(category.id);
              if (items.length === 0) return [];

              return [
                <li key={category.id} className="mt-2 first:mt-0">
                  <p className="text-note font-semibold text-gray">
                    {category.name}
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {items.map((item) => (
                      <CatalogRow
                        key={item.id}
                        item={item}
                        price={draft.priceOf(item)}
                        checked={draft.picked(item.id)}
                        collectsDeposit={collectsDeposit}
                        depositPercent={depositPercent}
                        onToggle={() => draft.toggle(item)}
                        onEdit={() => setPricing(item)}
                      />
                    ))}
                  </ul>
                </li>,
              ];
            })}
          </ul>
        </>
      ) : (
        <>
          {mode === "both" && services.length > 0 && !onBrowsing ? (
            <button
              type="button"
              onClick={() => setBrowsing(false)}
              className="touchable -ml-2 flex min-h-touch items-center gap-1 self-start rounded-card px-2 text-body font-medium text-blue active:bg-surface"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
              {tUi("back")}
            </button>
          ) : null}

          <p className="text-note text-gray">{t("browseHint")}</p>

          <ul className="flex flex-col gap-2">
            {(categories.data ?? []).map((item) => {
              const Icon = categoryIcon(item.id);
              const count = perCategory[item.id] ?? 0;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    data-category={item.id}
                    onClick={() => setCategoryId(item.id)}
                    className={cn(
                      "touchable flex w-full items-center gap-3 rounded-card border bg-white px-3 py-3 text-left active:bg-surface",
                      count > 0 ? "border-action" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-card",
                        count > 0
                          ? "bg-action text-white"
                          : "bg-blue-soft text-blue",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-6" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-semibold text-ink">
                        {item.name}
                      </span>
                      <span className="block text-note text-gray">
                        {count > 0
                          ? t("chosenHere", { count })
                          : item.examples.join(" · ")}
                      </span>
                    </span>

                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-gray"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {categoryId ? (
        <AddFab
          id="catalog-add-fab"
          label={t("add")}
          aboveBar={ownBar}
          onClick={() => setWriting(true)}
        />
      ) : null}

      {ownBar && !inCatalog && !categoryId ? (
        <AddFab
          id="catalog-browse-fab"
          label={t("browse")}
          href={addHref}
          aboveBar={draft.dirty}
          onClick={() => setBrowsing(true)}
        />
      ) : null}

      {ownBar && (categoryId || draft.dirty) ? (
        <ActionBar aboveNav>
          <Button
            look="primary"
            fullWidth
            icon={Check}
            loading={saving}
            disabled={draft.count === 0}
            onClick={onSave}
          >
            {t("done")}
          </Button>
        </ActionBar>
      ) : null}

      <PriceDialog
        item={pricing}
        current={pricing ? draft.priceOf(pricing) : 0}
        depositPercent={collectsDeposit ? depositPercent : null}
        onClose={() => setPricing(null)}
        onSave={(value) => {
          const item = pricing;
          setPricing(null);
          if (item) draft.setPrice(item, value);
        }}
      />
    </div>
  );
}

function CatalogRow({
  item,
  price,
  checked,
  collectsDeposit,
  depositPercent,
  onToggle,
  onEdit,
}: {
  item: CatalogService;
  price: Cents;
  checked: boolean;
  collectsDeposit: boolean;
  depositPercent: number;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const t = useTranslations("catalog");
  const chosen = checked;

  return (
    <li
      className={cn(
        "relative rounded-card border bg-white",
        chosen ? "border-action bg-blue-soft/40" : "border-border",
      )}
    >
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={chosen}
          aria-label={item.name}
          data-catalog={item.id}
          onClick={onToggle}
          className="touchable flex min-h-touch min-w-0 flex-1 items-start gap-3 rounded-card text-left after:absolute after:inset-0 after:rounded-card after:content-['']"
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border transition-colors duration-150 ease-[var(--ease-card)]",
              chosen
                ? "border-action bg-action text-white"
                : "border-border bg-white",
            )}
          >
            {chosen ? <Check className="size-4 animate-check" /> : null}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-body font-medium text-ink">
              {item.name}
            </span>
            <span className="mt-1 flex flex-col gap-0.5 text-note text-gray">
              <span>
                {t("priceFrom")}{" "}
                <Amount cents={price} className="font-semibold text-ink" />
              </span>
              {collectsDeposit ? (
                <span>
                  {t("depositLabel")}{" "}
                  <Amount
                    cents={depositOf(price, depositPercent)}
                    className="font-semibold text-ink"
                  />
                </span>
              ) : null}
            </span>
          </span>
        </button>

        <Button
          look="secondary"
          icon={Pencil}
          aria-label={t("editPriceOf", { name: item.name })}
          className="min-h-touch! relative z-10 ml-9 shrink-0 self-start px-3! sm:ml-0"
          onClick={onEdit}
        >
          {t("edit")}
        </Button>
      </div>
    </li>
  );
}

const STEP_MINUTES = 15;
const MAX_MINUTES = 8 * 60;

function StepButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof Minus;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="touchable flex size-12 shrink-0 items-center justify-center rounded-full border border-border-strong bg-white text-ink active:bg-surface disabled:border-border disabled:bg-surface disabled:text-gray"
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}

function NewServiceForm({
  category,
  onClose,
  onSave,
}: {
  category: string;
  onClose: () => void;
  onSave: (fields: {
    name: string;
    priceFrom: Cents;
    durationMinutes: number;
  }) => void;
}) {
  const t = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const durationText = useDurationText();

  const [name, setName] = useState("");
  const [priceFrom, setPriceFrom] = useState<Cents>(0);
  const [durationMinutes, setDuration] = useState<number>(60);
  const [attempted, setAttempted] = useState(false);

  const shortName = name.trim().length < 3;
  const noPrice = priceFrom <= 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="-mt-2 text-note text-gray">{t("addIn", { category })}</p>

      <TextField
        id="catalog-new-name"
        label={t("nameLabel")}
        hint={t("nameHint")}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={attempted && shortName ? t("nameRequired") : undefined}
      />

      <MoneyField
        id="catalog-new-price"
        label={t("priceLabel")}
        hint={t("priceHint")}
        value={priceFrom}
        onChange={setPriceFrom}
        error={attempted && noPrice ? t("priceRequired") : undefined}
      />

      <fieldset>
        <legend className="text-body font-medium text-ink">
          {t("durationLabel")}
        </legend>
        <p className="mt-1 text-note text-gray">{t("durationHint")}</p>

        <div className="mt-2 flex items-center gap-3">
          <StepButton
            icon={Minus}
            label={t("durationLess", { step: STEP_MINUTES })}
            disabled={durationMinutes <= STEP_MINUTES}
            onClick={() =>
              setDuration((current) =>
                Math.max(STEP_MINUTES, current - STEP_MINUTES),
              )
            }
          />

          <output
            aria-live="polite"
            className="min-w-0 flex-1 text-center text-lead font-semibold text-ink"
          >
            {durationText(durationMinutes)}
          </output>

          <StepButton
            icon={Plus}
            label={t("durationMore", { step: STEP_MINUTES })}
            disabled={durationMinutes >= MAX_MINUTES}
            onClick={() =>
              setDuration((current) =>
                Math.min(MAX_MINUTES, current + STEP_MINUTES),
              )
            }
          />
        </div>
      </fieldset>

      <div className="mt-2 flex gap-3">
        <Button
          look="secondary"
          className="min-w-0 flex-1 px-4!"
          onClick={onClose}
        >
          {tCommon("cancel")}
        </Button>
        <Button
          look="primary"
          className="min-w-0 flex-1 px-4!"
          onClick={() => {
            setAttempted(true);
            if (shortName || noPrice) return;
            onSave({ name: name.trim(), priceFrom, durationMinutes });
          }}
        >
          {t("addSave")}
        </Button>
      </div>
    </div>
  );
}

function PriceDialog({
  item,
  current,
  depositPercent,
  onClose,
  onSave,
}: {
  item: CatalogService | null;
  current: Cents;
  depositPercent: number | null;
  onClose: () => void;
  onSave: (value: Cents) => void;
}) {
  const t = useTranslations("catalog");
  const tUi = useTranslations("ui");
  const [value, setValue] = useState<Cents>(current);
  const [touched, setTouched] = useState(false);

  const price = touched ? value : current;

  return (
    <FormDialog
      open={Boolean(item)}
      title={item?.name ?? ""}
      closeLabel={tUi("close")}
      focusId="catalog-price"
      onClose={() => {
        setTouched(false);
        onClose();
      }}
    >
      <div className="flex flex-col gap-4">
        <MoneyField
          id="catalog-price"
          label={t("priceLabel")}
          hint={t("priceHint")}
          value={price}
          onChange={(next) => {
            setTouched(true);
            setValue(next);
          }}
        />

        {depositPercent === null ? null : (
          <p className="text-note text-gray">
            {t("depositPreview", {
              amount: depositOf(price, depositPercent) / 100,
              value: depositPercent / 100,
            })}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            look="secondary"
            className="min-w-0 flex-1 px-4!"
            onClick={() => {
              setTouched(false);
              onClose();
            }}
          >
            {tUi("back")}
          </Button>
          <Button
            look="primary"
            className="min-w-0 flex-1 px-4!"
            onClick={() => {
              setTouched(false);
              onSave(price);
            }}
          >
            {t("savePrice")}
          </Button>
        </div>
      </div>
    </FormDialog>
  );
}
