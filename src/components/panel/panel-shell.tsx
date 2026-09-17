"use client";

import { useEffect, type ReactNode } from "react";

import { DebugPanel } from "@/components/debug/debug-panel";
import { ScreenSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { usePathname, useRouter } from "@/utils/navigation";
import { useSession, useSubscription } from "@/utils/api/queries";
import { isPanelPlace } from "@/utils/panel/places";

import { PanelNav } from "./panel-nav";
import { PanelTopBar } from "./panel-top-bar";
import { SubscriptionPayment } from "./subscription-payment";

export function PanelShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const place = isPanelPlace(pathname);
  const { data, loading } = useSession();
  const subscription = useSubscription({ enabled: Boolean(data) });

  const signedOut = !loading && !data;

  useEffect(() => {
    if (signedOut) router.replace("/entrar");
  }, [signedOut, router]);

  if (loading || signedOut || subscription.loading) {
    return (
      <div className="pt-14 pb-8 md:pt-0 md:pl-64">
        <div className="mx-auto max-w-160 px-gutter">
          <ScreenSkeleton />
        </div>
      </div>
    );
  }

  if (subscription.data?.access === "blocked") {
    return (
      <>
        <div className="mx-auto max-w-160 px-gutter pb-8">
          <SubscriptionPayment />
        </div>
        <DebugPanel />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "pb-8 md:pt-0 md:pl-64",
          place ? "pt-14" : "pt-2",
        )}
      >
        <div className="mx-auto max-w-160 px-gutter">{children}</div>
      </div>
      {place ? <PanelTopBar /> : null}
      <PanelNav />
      <DebugPanel />
    </>
  );
}
