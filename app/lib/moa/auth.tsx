"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabase, supabaseConfigured } from "./supabase";
import LoginScreen from "../../components/moa/LoginScreen";

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: User };

interface AuthContextValue {
  user: User;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthGate 안에서만 사용할 수 있어요.");
  return ctx;
}

/** 로그인한 사용자에게만 children 을 보여준다. 아니면 로그인 화면. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    if (!supabaseConfigured) return;
    // 시작할 때(INITIAL_SESSION)와 로그인·로그아웃·토큰 갱신 때마다 호출된다
    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setState((prev) => {
        if (!session) return { status: "signedOut" };
        // 토큰만 갱신된 경우엔 화면을 다시 그리지 않는다
        if (prev.status === "signedIn" && prev.user.id === session.user.id) return prev;
        return { status: "signedIn", user: session.user };
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue | null>(
    () =>
      state.status === "signedIn"
        ? {
            user: state.user,
            signOut: async () => {
              await getSupabase().auth.signOut();
            },
          }
        : null,
    [state],
  );

  if (!supabaseConfigured) return <MissingConfigScreen />;
  if (state.status === "loading") return <CenteredSpinner />;
  if (state.status === "signedOut" || !value) return <LoginScreen />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function CenteredSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <div className="flex items-center gap-3 text-muted">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" />
        <span className="text-sm">확인하는 중…</span>
      </div>
    </div>
  );
}

function MissingConfigScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="text-3xl">🔧</p>
        <h1 className="mt-3 text-lg font-bold text-ink">Supabase 설정이 필요해요</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          <code className="rounded bg-canvas px-1">.env.local</code> 파일에{" "}
          <code className="rounded bg-canvas px-1">NEXT_PUBLIC_SUPABASE_URL</code>과{" "}
          <code className="rounded bg-canvas px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>를
          넣고 개발 서버를 다시 켜 주세요. (<code className="rounded bg-canvas px-1">.env.example</code>{" "}
          참고)
        </p>
      </div>
    </div>
  );
}
