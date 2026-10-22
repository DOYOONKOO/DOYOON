"use client";

import { useMemo, type ReactNode } from "react";
import { AuthGate, useAuth } from "../../lib/moa/auth";
import { getSupabase } from "../../lib/moa/supabase";
import { createSupabaseRepository } from "../../lib/moa/supabaseRepository";
import { AppProvider } from "../../lib/moa/store";
import AppShell from "./AppShell";

function AppWithData({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const repository = useMemo(
    () => createSupabaseRepository(getSupabase(), user.id),
    [user.id],
  );
  // key: 다른 계정으로 바뀌면 이전 사용자의 데이터가 남지 않도록 통째로 새로 만든다
  return (
    <AppProvider key={user.id} repository={repository}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}

export default function MoaProviders({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AppWithData>{children}</AppWithData>
    </AuthGate>
  );
}
