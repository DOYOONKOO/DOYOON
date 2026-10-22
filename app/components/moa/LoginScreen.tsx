"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/moa/supabase";
import { Button, Field, Notice, Segmented, inputClass } from "./ui";

type Mode = "login" | "signup";

function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (m.includes("email not confirmed"))
    return "이메일 인증이 아직이에요. 받은 편지함의 확인 메일에서 인증을 먼저 완료해 주세요.";
  if (m.includes("already registered")) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (m.includes("at least") && m.includes("character")) return "비밀번호는 6자 이상이어야 해요.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  if (m.includes("valid email") || m.includes("invalid email"))
    return "이메일 주소 형식을 확인해 주세요.";
  if (m.includes("fetch") || m.includes("network"))
    return "네트워크에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.";
  return "문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}

// Supabase 대시보드에서 구글 설정을 마친 뒤 NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=1 로 켠다
const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "1";
// 카카오도 Kakao Developers 와 Supabase 설정을 마친 뒤 NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=1 로 켠다
const kakaoEnabled = process.env.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED === "1";

type SocialProvider = "google" | "kakao";

/** 소셜 로그인에 실패하면 주소에 error 가 붙어서 돌아온다 */
function oauthErrorFromUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search + "&" + window.location.hash.slice(1));
  if (!params.get("error") && !params.get("error_description")) return "";
  return params.get("error") === "access_denied"
    ? "로그인을 취소했어요."
    : "소셜 로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function KakaoIcon() {
  // 카카오 말풍선 심볼
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#191919"
        d="M12 3C6.48 3 2 6.58 2 10.99c0 2.86 1.87 5.37 4.68 6.78-.2.74-.74 2.68-.85 3.1-.13.52.19.51.4.37.17-.11 2.64-1.8 3.7-2.53.67.1 1.37.15 2.07.15 5.52 0 10-3.58 10-7.99S17.52 3 12 3z"
      />
    </svg>
  );
}

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(oauthErrorFromUrl);
  const [sentTo, setSentTo] = useState("");

  // 실패 메시지를 읽었으면 주소창의 error 값은 지운다
  useEffect(() => {
    if (oauthErrorFromUrl()) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function handleSocial(provider: SocialProvider) {
    setError("");
    setBusy(true);
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          // 카카오는 이메일(account_email)이 비즈 앱에서만 열려서, 닉네임·프로필만 요청한다
          ...(provider === "kakao" ? { scopes: "profile_nickname profile_image" } : {}),
        },
      });
      // 성공하면 소셜 로그인 화면으로 이동하므로 여기서 더 할 일은 없다
      if (error) {
        setError(friendlyError(error.message));
        setBusy(false);
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : ""));
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (email.trim() === "" || password === "") {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    setBusy(true);
    try {
      const auth = getSupabase().auth;
      if (mode === "login") {
        const { error } = await auth.signInWithPassword({ email: email.trim(), password });
        if (error) setError(friendlyError(error.message));
        // 성공하면 AuthGate 가 알아서 앱 화면으로 바꿔 준다
      } else {
        const { data, error } = await auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          setError(friendlyError(error.message));
        } else if (data.user && data.user.identities?.length === 0) {
          setError("이미 가입된 이메일이에요. 로그인해 주세요.");
        } else if (!data.session) {
          // 이메일 인증이 켜져 있으면 세션이 바로 만들어지지 않는다
          setSentTo(email.trim());
        }
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-xl font-bold text-white">
            모
          </span>
          <span className="text-2xl font-bold tracking-tight text-ink">모아구독</span>
        </div>

        <div className="rounded-3xl bg-surface p-7">
          {sentTo ? (
            <div className="text-center">
              <p className="text-3xl">📬</p>
              <h1 className="mt-3 text-lg font-bold text-ink">확인 메일을 보냈어요</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                <strong className="text-ink">{sentTo}</strong>로 보낸 메일의 링크를 눌러 인증한 뒤,
                이 화면에서 로그인해 주세요.
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => {
                  setSentTo("");
                  setMode("login");
                  setPassword("");
                }}
              >
                로그인 화면으로
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="flex justify-center">
                <Segmented<Mode>
                  label="로그인 방식"
                  value={mode}
                  onChange={(m) => {
                    setMode(m);
                    setError("");
                  }}
                  options={[
                    { value: "login", label: "로그인" },
                    { value: "signup", label: "회원가입" },
                  ]}
                />
              </div>

              <Field label="이메일">
                <input
                  className={inputClass}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field
                label="비밀번호"
                hint={mode === "signup" ? "6자 이상으로 정해 주세요." : undefined}
              >
                <input
                  className={inputClass}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              {error && <Notice tone="bad">{error}</Notice>}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "잠시만요…" : mode === "login" ? "로그인" : "가입하기"}
              </Button>

              {(kakaoEnabled || googleEnabled) && (
                <>
                  <div className="flex items-center gap-3 text-[13px] text-subtle">
                    <span className="h-px flex-1 bg-fill-strong" />또는
                    <span className="h-px flex-1 bg-fill-strong" />
                  </div>
                  <div className="space-y-2.5">
                    {kakaoEnabled && (
                      <button
                        type="button"
                        onClick={() => handleSocial("kakao")}
                        disabled={busy}
                        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] text-base font-semibold text-[#191919] transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <KakaoIcon />
                        카카오로 계속하기
                      </button>
                    )}
                    {googleEnabled && (
                      <button
                        type="button"
                        onClick={() => handleSocial("google")}
                        disabled={busy}
                        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-fill-strong bg-surface text-base font-semibold text-ink transition-all hover:bg-fill active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <GoogleIcon />
                        구글로 계속하기
                      </button>
                    )}
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[13px] leading-relaxed text-muted">
          내 구독 정보는 로그인한 계정에만 저장되고, 다른 사람은 볼 수 없어요.
          <br />
          카드번호나 카드 비밀번호는 입력받지 않아요.
        </p>
      </div>
    </div>
  );
}
