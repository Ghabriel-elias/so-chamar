import { notFound } from "next/navigation";

import { ProfileSection } from "@/screens/profile";
import {
  isProfileSection,
  PROFILE_SECTIONS,
} from "@/utils/provider/profile-sections";

export function generateStaticParams() {
  return PROFILE_SECTIONS.map((secao) => ({ secao }));
}

export default async function ProfileSectionPage({
  params,
}: PageProps<"/painel/perfil/[secao]">) {
  const { secao } = await params;

  if (!isProfileSection(secao)) notFound();

  return <ProfileSection section={secao} />;
}
