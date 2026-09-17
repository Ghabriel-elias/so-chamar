import { createTranslator } from "next-intl";

import { LOCALE } from "@/i18n/config";

import messages from "@/i18n/messages/pt-BR.json";
import { ApiError } from "./contract";

const t = createTranslator({ locale: LOCALE, messages, namespace: "errors" });

export function messageFrom(problem: unknown) {
  if (problem instanceof ApiError) return problem.message;
  return t("generic");
}
