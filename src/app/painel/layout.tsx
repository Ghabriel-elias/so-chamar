import { PanelShell } from "@/components/panel/panel-shell";

export default function PanelLayout({ children }: LayoutProps<"/painel">) {
  return (
    <main>
      <PanelShell>{children}</PanelShell>
    </main>
  );
}
