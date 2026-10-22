"use client";

import { useState } from "react";
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

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

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
