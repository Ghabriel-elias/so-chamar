const HOME = "/painel";

export function withBack(href: string, from: string) {
  return `${href}${href.includes("?") ? "&" : "?"}de=${encodeURIComponent(from)}`;
}

export function backHref(from: string | undefined): string {
  if (!from) return HOME;
  const clean = decodeURIComponent(from);
  return clean === HOME || clean.startsWith("/painel/") ? clean : HOME;
}
