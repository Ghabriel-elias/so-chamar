import { getRequestConfig } from "next-intl/server";

import { CURRENCY, LOCALE, TIME_ZONE } from "./config";

export default getRequestConfig(async () => ({
  locale: LOCALE,
  messages: (await import("./messages/pt-BR.json")).default,
  timeZone: TIME_ZONE,
  formats: {
    number: {
      money: {
        style: "currency",
        currency: CURRENCY,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 2,
      },
      percent: {
        style: "percent",
        maximumFractionDigits: 0,
      },
    },
    dateTime: {
      time: { hour: "2-digit", minute: "2-digit" },
      shortDay: { weekday: "short", day: "2-digit", month: "short" },
      longDay: { weekday: "long", day: "2-digit", month: "long" },
      dayAndTime: {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    },
  },
}));
