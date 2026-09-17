import {
  AirVent,
  Car,
  Droplets,
  GraduationCap,
  Hammer,
  HeartPulse,
  PawPrint,
  Scissors,
  Shapes,
  SprayCan,
  Tv,
  WashingMachine,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  appliance_repair: WashingMachine,
  electronics: Tv,
  renovation: Hammer,
  electrical: Zap,
  plumbing: Droplets,
  hvac: AirVent,
  cleaning: SprayCan,
  beauty: Scissors,
  wellness: HeartPulse,
  pet: PawPrint,
  lessons: GraduationCap,
  automotive: Car,
  other: Shapes,
};

export function categoryIcon(id: string): LucideIcon {
  return ICONS[id] ?? Shapes;
}
