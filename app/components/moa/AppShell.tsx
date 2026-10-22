"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useApp } from "../../lib/moa/store";
import { Icon, type IconName } from "./icons";
import { ConfirmDialog, Modal, cn } from "./ui";

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
  const [moreOpen, setMoreOpen] = useState(false);
  const [clearDemoOpen, setClearDemoOpen] = useState(false);

  const moreActive = MOBILE_MORE.some((n) => isActive(pathname, n.href));

  return (
    <div className="min-h-dvh md:flex">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden border-r border-line bg-surface md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col md:px-4 md:py-6">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
            모
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">모아구독</span>
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
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors",
                  active
                    ? "bg-accent-soft text-accent-strong"
                    : "text-muted hover:bg-canvas hover:text-ink",
                )}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-2 text-xs leading-relaxed text-muted">
          데이터는 이 브라우저에만 저장돼요. 카드사·결제·구독 서비스와는 아직 연결되어 있지 않아요.
        </p>
      </aside>

      <div className="min-w-0 flex-1 md:pl-60">
        {isDemo && (
          <div className="border-b border-accent/20 bg-accent-soft px-4 py-2.5 text-[13px] text-accent-strong md:px-8">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
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
          </div>
        )}
        {saveFailed && (
          <div
            role="alert"
            className="border-b border-bad/20 bg-bad-soft px-4 py-2.5 text-[13px] font-medium text-bad md:px-8"
          >
            <div className="mx-auto max-w-6xl">
              브라우저에 저장하지 못했어요. 지금 입력한 내용은 새로고침하면 사라질 수 있어요.
              (시크릿 모드이거나 저장 공간이 가득 찼는지 확인해 주세요.)
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
          {children}
        </main>
      </div>

      {/* 모바일 하단 내비게이션 */}
      <nav
        aria-label="주 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
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
        <Modal title="더보기" onClose={() => setMoreOpen(false)}>
          <ul className="flex flex-col gap-1">
            {MOBILE_MORE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-[15px] font-semibold text-ink hover:bg-canvas"
                >
                  <Icon name={item.icon} className="text-muted" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Modal>
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
