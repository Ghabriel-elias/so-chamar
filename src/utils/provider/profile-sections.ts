export const PROFILE_SECTIONS = ["dados", "assinatura", "excluir"] as const;

export type ProfileSectionKey = (typeof PROFILE_SECTIONS)[number];

export function isProfileSection(value: string): value is ProfileSectionKey {
  return (PROFILE_SECTIONS as readonly string[]).includes(value);
}
