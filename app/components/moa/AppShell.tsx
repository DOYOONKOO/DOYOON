"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "../../lib/moa/auth";
import { useApp } from "../../lib/moa/store";
import { Icon, type IconName } from "./icons";
import { MoreSheet, SidebarAccount } from "./MoreMenu";
import { ConfirmDialog, cn } from "./ui";

interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { href: "/", label: "대시보드", short: "홈", icon: "home" },
  { href: "/subscriptions", label: "내 구독", short: "내 구독", icon: "list" },
  { href: "/explore", label: "서비스 둘러보기", short: "둘러보기", icon: "compass" },
  { href: "/payments", label: "결제 내역", short: "결제", icon: "receipt" },
  { href: "/cards", label: "결제 수단", short: "결제 수단", icon: "card" },
  { href: "/settings", label: "설정", short: "설정", icon: "sliders" },
];

const MOBILE_MAIN = NAV.slice(0, 4);
const MOBILE_MORE = NAV.slice(4);

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isDemo, saveFailed, actions, toast } = useApp();
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [clearDemoOpen, setClearDemoOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function handleLogout() {
    try {
      await signOut();
      // 성공하면 로그인 화면으로 바뀌면서 이 화면은 사라진다
    } catch {
      setLogoutOpen(false);
      toast("로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.", "error");
    }
  }

  const moreActive = MOBILE_MORE.some((n) => isActive(pathname, n.href));

  return (
    <div className="min-h-dvh md:flex">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden bg-surface md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:px-4 md:py-7">
        <Link href="/" className="mb-9 flex items-center gap-2.5 px-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-accent text-lg font-bold text-white">
            모
          </span>
          <span className="text-xl font-bold tracking-tight text-ink">모아구독</span>
        </Link>
        <nav className="flex flex-col gap-1" aria-label="주 메뉴">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition-colors",
                  active ? "bg-fill text-ink" : "text-muted hover:bg-fill hover:text-ink",
                )}
              >
                <Icon name={item.icon} className={cn("h-[22px] w-[22px]", active && "text-accent")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <SidebarAccount onLogout={() => setLogoutOpen(true)} />
        </div>
      </aside>

      <div className="min-w-0 flex-1 md:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-10 md:pb-16 md:pt-10">
          {isDemo && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-accent-soft px-4 py-3 text-[13px] text-accent-strong">
              <p>
                <strong className="font-bold">데모 모드</strong> · 예시 데이터가 들어 있어요. 실제
                카드·결제 내역이 아니에요.
              </p>
              <button
                type="button"
                onClick={() => setClearDemoOpen(true)}
                className="font-semibold underline underline-offset-2"
              >
                예시 데이터 지우기
              </button>
            </div>
          )}
          {saveFailed && (
            <div
              role="alert"
              className="mb-3 rounded-2xl bg-bad-soft px-4 py-3 text-[13px] font-medium leading-relaxed text-bad"
            >
              서버에 저장하지 못했어요. 인터넷 연결을 확인해 주세요. 연결되면 다음 저장 때 함께
              다시 저장되지만, 그 전에 창을 닫거나 새로고침하면 방금 입력한 내용이 사라질 수 있어요.
            </div>
          )}
          {children}
        </main>
      </div>

      {/* 모바일 하단 내비게이션 */}
      <nav
        aria-label="주 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgba(0,0,0,0.05)] backdrop-blur md:hidden"
      >
        {MOBILE_MAIN.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Icon name={item.icon} className="h-[22px] w-[22px]" />
              {item.short}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
            moreActive ? "text-accent" : "text-muted",
          )}
        >
          <Icon name="more" className="h-[22px] w-[22px]" />
          더보기
        </button>
      </nav>

      {moreOpen && (
        <MoreSheet
          onClose={() => setMoreOpen(false)}
          onLogout={() => {
            setMoreOpen(false);
            setLogoutOpen(true);
          }}
          onClearDemo={() => {
            setMoreOpen(false);
            setClearDemoOpen(true);
          }}
        />
      )}

      {logoutOpen && (
        <ConfirmDialog
          title="로그아웃할까요?"
          description="저장된 구독 정보는 그대로 남아 있어요. 다시 로그인하면 이어서 볼 수 있어요."
          confirmLabel="로그아웃"
          onClose={() => setLogoutOpen(false)}
          onConfirm={handleLogout}
        />
      )}

      {clearDemoOpen && (
        <ConfirmDialog
          title="예시 데이터를 지울까요?"
          description="데모용으로 들어 있던 구독·결제·카드·관심 목록만 지워요. 직접 추가한 내용은 그대로 남아요."
          confirmLabel="예시 데이터 지우기"
          danger
          onClose={() => setClearDemoOpen(false)}
          onConfirm={() => {
            actions.clearDemo();
            setClearDemoOpen(false);
            toast("예시 데이터를 지웠어요.", "info");
          }}
        />
      )}
    </div>
  );
}
