import {
  CalendarDays,
  Settings,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const PANEL_PLACES: ReadonlyArray<{
  href: string;
  key: "agenda" | "money" | "settings" | "profile";
  icon: LucideIcon;
}> = [
  { href: "/painel", key: "agenda", icon: CalendarDays },
  { href: "/painel/carteira", key: "money", icon: Wallet },
  { href: "/painel/ajustes", key: "settings", icon: Settings },
  { href: "/painel/perfil", key: "profile", icon: UserRound },
];

export function isPanelPlace(pathname: string) {
  return PANEL_PLACES.some((place) => place.href === pathname);
}
