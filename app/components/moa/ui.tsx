"use client";

import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import type { RowStatus } from "../../lib/moa/billing";
import { moneyEntries, formatMoney, type MoneyMap } from "../../lib/moa/money";
import {
  PAYMENT_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type SubscriptionStatus,
} from "../../lib/moa/types";
import { Icon, type IconName } from "./icons";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ── 버튼 ───────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "neutral" | "ghost" | "danger" | "dangerSoft";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  // 토스의 연한 파랑 버튼
  secondary: "bg-accent-soft text-accent-strong hover:bg-[#d5e8ff]",
  neutral: "bg-fill text-body hover:bg-fill-strong",
  ghost: "text-muted hover:bg-fill",
  danger: "bg-bad text-white hover:opacity-90",
  dangerSoft: "bg-bad-soft text-bad hover:opacity-90",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold transition-all active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        size === "sm" ? "h-9 rounded-xl px-3.5 text-sm" : "h-12 rounded-2xl px-5 text-base",
        BUTTON_VARIANTS[variant],
        className,
      )}
    />
  );
}

export function IconButton({
  icon,
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-subtle transition-colors hover:bg-fill hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-accent",
        className,
      )}
    >
      <Icon name={icon} className="h-[18px] w-[18px]" />
    </button>
  );
}

// ── 폼 ─────────────────────────────────────────────────
// 흰 카드·시트 안에서 쓰는 입력창 (연회색 면)
export const inputClass =
  "h-12 w-full rounded-2xl border border-transparent bg-fill px-4 text-base text-ink outline-none transition-colors placeholder:text-[#b0b8c1] focus:border-accent focus:bg-surface disabled:text-subtle";
// 회색 배경 위에서 쓰는 입력창 (흰 면)
export const inputOnGrayClass =
  "h-12 w-full rounded-2xl border border-transparent bg-surface px-4 text-base text-ink outline-none transition-colors placeholder:text-[#b0b8c1] focus:border-accent";
export const textareaClass =
  "w-full rounded-2xl border border-transparent bg-fill px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-[#b0b8c1] focus:border-accent focus:bg-surface";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block text-[13px] font-semibold text-muted">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-[13px] font-medium text-bad">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-[13px] text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; icon?: IconName; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-2xl bg-fill-strong p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
            value === o.value
              ? "bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-muted hover:text-ink",
          )}
        >
          {o.icon && <Icon name={o.icon} className="h-4 w-4" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── 모달 / 확인창 ───────────────────────────────────────
const openModals: object[] = [];

export function Modal({
  title,
  onClose,
  children,
  footer,
  variant = "center",
  top = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** center: 가운데 창(모바일에서는 아래 시트), drawer: 데스크톱에서 오른쪽 패널 */
  variant?: "center" | "drawer";
  /** 다른 모달 위에 띄울 때 */
  top?: boolean;
}) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 모달이 겹쳐 있으면 맨 위 모달만 Esc에 반응한다
    const token = {};
    openModals.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openModals[openModals.length - 1] === token) {
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      openModals.splice(openModals.indexOf(token), 1);
      if (openModals.length === 0) document.body.style.overflow = "";
    };
  }, []);

  const drawer = variant === "drawer";
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-end justify-center",
        drawer ? "md:items-stretch md:justify-end" : "md:items-center",
        top ? "z-[60]" : "z-50",
      )}
    >
      <button
        type="button"
        aria-label="닫기"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface outline-none",
          drawer
            ? "md:max-h-none md:max-w-md md:rounded-none md:rounded-l-[28px]"
            : "md:max-w-lg md:rounded-[28px]",
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-fill-strong md:hidden" />
        <div className="flex items-center justify-between gap-3 px-6 pb-2 pt-4 md:pt-6">
          <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
          <IconButton icon="x" label="닫기" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">{children}</div>
        {footer && <div className="bg-surface px-6 pb-6 pt-2">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      top
      footer={
        <div className="flex gap-2">
          <Button variant="neutral" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-[15px] leading-relaxed text-body">{description}</div>
    </Modal>
  );
}

// ── 표시용 조각 ──────────────────────────────────────────
type Tone = "ok" | "accent" | "warn" | "bad" | "neutral";

const TONES: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  accent: "bg-accent-soft text-accent-strong",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  neutral: "bg-fill text-muted",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

const SUB_TONE: Record<SubscriptionStatus, Tone> = {
  active: "ok",
  trial: "accent",
  ending: "warn",
  ended: "neutral",
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge tone={SUB_TONE[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>;
}

export function RowStatusBadge({ status }: { status: RowStatus }) {
  switch (status) {
    case "paid":
      return <Badge tone="ok">{PAYMENT_STATUS_LABELS.paid}</Badge>;
    case "scheduled":
      return <Badge tone="accent">{PAYMENT_STATUS_LABELS.scheduled}</Badge>;
    case "projected":
      return <Badge tone="accent">예정 · 자동 계산</Badge>;
    case "overdue":
      return <Badge tone="warn">확인 필요</Badge>;
    case "failed":
      return <Badge tone="bad">{PAYMENT_STATUS_LABELS.failed}</Badge>;
    case "refunded":
      return <Badge tone="neutral">{PAYMENT_STATUS_LABELS.refunded}</Badge>;
  }
}

const AVATAR_TINTS = [
  ["#e8f3ff", "#3182f6"],
  ["#e3f6ee", "#0a9d6a"],
  ["#fff2df", "#d9780f"],
  ["#ffecee", "#f04452"],
  ["#f1ebff", "#7a4de8"],
  ["#f2f4f6", "#4e5968"],
];

export function ServiceAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = AVATAR_TINTS[hash % AVATAR_TINTS.length];
  const initial = [...name.trim()][0] ?? "?";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        size === "sm" && "h-10 w-10 text-base",
        size === "md" && "h-12 w-12 text-lg",
        size === "lg" && "h-16 w-16 text-2xl",
      )}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initial.toUpperCase()}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-surface px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <p className="mt-5 text-lg font-bold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-[15px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "bad";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-2xl px-4 py-3.5 text-[14px] leading-relaxed",
        tone === "info" && "bg-accent-soft text-accent-strong",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "bad" && "bg-bad-soft text-bad",
      )}
    >
      <Icon name={tone === "info" ? "info" : "alert"} className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-3xl bg-surface p-6", className)}>{children}</section>;
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** 통화별 금액. 첫 통화를 크게, 나머지는 그 아래에 작게 보여준다. */
export function MoneyView({
  map,
  className,
}: {
  map: MoneyMap;
  className?: string;
}) {
  const entries = moneyEntries(map);
  if (entries.length === 0) {
    return <span className={cn("tabular font-bold", className)}>0원</span>;
  }
  const [[c0, v0], ...rest] = entries;
  return (
    <span className="block">
      <span className={cn("tabular font-bold", className)}>{formatMoney(v0, c0)}</span>
      {rest.map(([c, v]) => (
        <span key={c} className="tabular mt-0.5 block text-sm font-semibold text-muted">
          + {formatMoney(v, c)}
        </span>
      ))}
    </span>
  );
}

export function ProgressBar({ ratio, over = false }: { ratio: number; over?: boolean }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-fill">
      <div
        className={cn("h-full rounded-full transition-all", over ? "bg-bad" : "bg-accent")}
        style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
      />
    </div>
  );
}
