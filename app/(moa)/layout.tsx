import type { ReactNode } from "react";
import AppShell from "../components/moa/AppShell";
import { AppProvider } from "../lib/moa/store";

export default function MoaLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
