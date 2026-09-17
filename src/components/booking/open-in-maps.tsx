"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";

import { Button, ExternalButton } from "@/components/ui/button";
import { InfoDialog } from "@/components/ui/dialog";
import { mapLinks } from "@/utils/booking/maps";
import { cn } from "@/utils/cn";
import { usePlatform } from "@/utils/ui/platform";

export function OpenInMaps({
  address,
  className,
  label,
  children,
}: {
  address: string;
  className?: string;
  label?: string;
  children: ReactNode;
}) {
  const t = useTranslations("maps");
  const platform = usePlatform();
  const id = useId();
  const [choosing, setChoosing] = useState(false);
  const links = mapLinks(address);

  const look = cn("w-full justify-start text-left", className);

  if (platform === "android") {
    return (
      <ExternalButton
        icon={MapPin}
        href={links.geo}
        target="_self"
        aria-label={label}
        data-maps="geo"
        className={look}
      >
        {children}
      </ExternalButton>
    );
  }

  if (platform === "ios") {
    const app = (href: string, name: string, key: string) => (
      <ExternalButton
        href={href}
        fullWidth
        data-maps-app={key}
        onClick={() => setChoosing(false)}
      >
        {name}
      </ExternalButton>
    );

    return (
      <>
        <Button
          id={`${id}-maps`}
          icon={MapPin}
          aria-label={label}
          aria-haspopup="dialog"
          data-maps="choose"
          className={look}
          onClick={() => setChoosing(true)}
        >
          {children}
        </Button>

        <InfoDialog
          open={choosing}
          title={t("chooseTitle")}
          closeLabel={t("close")}
          onClose={() => setChoosing(false)}
          returnFocusId={`${id}-maps`}
          actions={
            <>
              {app(links.apple, t("apple"), "apple")}
              {app(links.google, t("google"), "google")}
              {app(links.waze, t("waze"), "waze")}
            </>
          }
        >
          <p className="selectable text-center text-body text-gray wrap-break-word">
            {address}
          </p>
        </InfoDialog>
      </>
    );
  }

  return (
    <ExternalButton
      icon={MapPin}
      href={links.google}
      aria-label={label}
      data-maps="web"
      className={look}
    >
      {children}
    </ExternalButton>
  );
}
