import type { ReactNode } from "react";
import MoaProviders from "../components/moa/MoaProviders";

export default function MoaLayout({ children }: { children: ReactNode }) {
  return <MoaProviders>{children}</MoaProviders>;
}
