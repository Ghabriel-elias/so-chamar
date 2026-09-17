import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

import { version } from "./package.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const pages = process.env.PAGES === "1";
const basePath = pages ? (process.env.BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_VERSION: version,
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(pages
    ? {
        output: "export" as const,
        basePath: basePath || undefined,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    ...(process.env.DEV_ORIGINS?.split(",").filter(Boolean) ?? []),
  ],
};

export default withNextIntl(nextConfig);
