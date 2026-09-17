import { useTranslations } from "next-intl";

import { Link } from "@/utils/navigation";

export function LegalPage({
  namespace,
  sectionCount,
}: {
  namespace: "terms" | "privacy";
  sectionCount: number;
}) {
  const t = useTranslations(namespace);
  const tSite = useTranslations("site");

  return (
    <main className="mx-auto max-w-3xl px-gutter pb-16 pt-10">
      <h1 className="text-display">{t("title")}</h1>
      <p className="mt-3 text-lead text-gray">{t("intro")}</p>
      <p className="mt-2 text-note text-gray">{t("updated")}</p>

      <div className="mt-10 flex flex-col gap-8">
        {Array.from({ length: sectionCount }, (_, index) => {
          const key = `s${index + 1}`;

          return (
            <section key={key}>
              <h2 className="text-lead">{t(`${key}Title`)}</h2>
              <p className="mt-2 text-body text-ink">{t(`${key}Body`)}</p>
            </section>
          );
        })}
      </div>

      <p className="mt-12 border-t border-border pt-6 text-body">
        <Link
          href={namespace === "terms" ? "/privacidade" : "/termos"}
          className="font-medium text-blue underline underline-offset-4"
        >
          {namespace === "terms" ? tSite("privacy") : tSite("terms")}
        </Link>
      </p>
    </main>
  );
}
