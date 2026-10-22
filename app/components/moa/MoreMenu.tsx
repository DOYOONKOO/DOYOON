"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { providerLabel, useAuth, userLabel } from "../../lib/moa/auth";
import { formatMoney } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import { Icon, type IconName } from "./icons";
import { Button, IconButton, Modal, cn } from "./ui";

function AccountAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initial = ([...name.trim()][0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-white",
        size === "sm" ? "h-10 w-10 text-base" : "h-14 w-14 text-xl",
      )}
    >
      {initial}
    </span>
  );
}

/** 데스크톱 사이드바 아래의 내 계정 카드 */
export function SidebarAccount({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl bg-fill p-3">
        <AccountAvatar name={userLabel(user)} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink" title={userLabel(user)}>
            {userLabel(user)}
          </p>
          <p className="truncate text-xs text-subtle">{providerLabel(user)}</p>
        </div>
        <IconButton
          icon="logout"
          label="로그아웃"
          onClick={onLogout}
          className="hover:bg-surface"
        />
      </div>
      <p className="px-1 text-xs leading-relaxed text-subtle">
        내 계정에 저장돼요. 카드사·결제·구독 서비스와는 아직 연결되어 있지 않아요.
      </p>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  sub,
  href,
  onClick,
}: {
  icon: IconName;
  label: string;
  sub?: string;
  href?: string;
  onClick: () => void;
}) {
  const body: ReactNode = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-body">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-base font-semibold text-ink">{label}</span>
        {sub && <span className="block truncate text-[13px] text-subtle">{sub}</span>}
      </span>
      <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-[#b0b8c1]" />
    </>
  );
  const cls =
    "flex w-full items-center gap-3.5 rounded-2xl px-2 py-3 transition-colors hover:bg-fill active:bg-fill";
  return href ? (
    <Link href={href} onClick={onClick} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/** 모바일 "더보기" 시트: 내 계정, 바로가기, 로그아웃 */
export function MoreSheet({
  onClose,
  onLogout,
  onClearDemo,
}: {
  onClose: () => void;
  onLogout: () => void;
  onClearDemo: () => void;
}) {
  const { user } = useAuth();
  const { data, isDemo } = useApp();
  const budget = data.settings.monthlyBudget;

  return (
    <Modal title="더보기" onClose={onClose}>
      <div className="flex items-center gap-4 rounded-3xl bg-fill p-4">
        <AccountAvatar name={userLabel(user)} />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-ink">{userLabel(user)}</p>
          <p className="text-sm text-subtle">{providerLabel(user)}</p>
        </div>
      </div>

      <div className="mt-3 space-y-0.5">
        <MenuRow
          href="/cards"
          icon="card"
          label="결제 수단"
          sub={data.cards.length > 0 ? `카드 ${data.cards.length}개 등록` : "카드를 등록해 보세요"}
          onClick={onClose}
        />
        <MenuRow
          href="/settings"
          icon="sliders"
          label="설정"
          sub={budget !== null ? `월 예산 ${formatMoney(budget, "KRW")}` : "예산·알림·데이터 관리"}
          onClick={onClose}
        />
        {isDemo && (
          <MenuRow
            icon="trash"
            label="예시 데이터 지우기"
            sub="데모용 구독·결제·카드를 지워요"
            onClick={onClearDemo}
          />
        )}
      </div>

      <Button variant="neutral" className="mt-5 w-full" onClick={onLogout}>
        <Icon name="logout" className="h-[18px] w-[18px]" />
        로그아웃
      </Button>

      <p className="mt-4 text-center text-xs leading-relaxed text-subtle">
        내 계정에 저장돼요. 카드사·결제·구독 서비스와는 아직 연결되어 있지 않아요.
      </p>
    </Modal>
  );
}
