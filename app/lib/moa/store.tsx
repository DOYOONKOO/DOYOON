"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createDemoData } from "./demo";
import { todayISO, type ISODate } from "./date";
import { localStorageRepository as repository } from "./repository";
import {
  emptyData,
  type AppData,
  type Card,
  type Cycle,
  type Payment,
  type Settings,
  type Subscription,
} from "./types";

type Status = "loading" | "ready" | "error";
export type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export type SubscriptionInput = Omit<Subscription, "id" | "createdAt" | "demo">;
export type PaymentInput = Omit<Payment, "id" | "demo">;
export type CardInput = Omit<Card, "id" | "demo">;

interface Actions {
  addSubscription(input: SubscriptionInput): Subscription;
  updateSubscription(id: string, input: SubscriptionInput): void;
  deleteSubscription(id: string): void;
  addPayment(input: PaymentInput): void;
  updatePayment(id: string, input: PaymentInput): void;
  deletePayment(id: string): void;
  addCard(input: CardInput): void;
  updateCard(id: string, input: CardInput): void;
  deleteCard(id: string): void;
  /** 이미 관심 목록에 있는 서비스면 새로 추가하지 않고 요금제만 바꾼다 */
  addWishlist(serviceId: string, planId: string | null, cycle: Cycle): void;
  removeWishlist(id: string): void;
  updateSettings(patch: Partial<Settings>): void;
  loadDemo(): void;
  clearDemo(): void;
  resetAll(): void;
}

interface AppContextValue {
  data: AppData;
  today: ISODate;
  isDemo: boolean;
  saveFailed: boolean;
  actions: Actions;
  toast: (message: string, tone?: ToastTone) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp은 AppProvider 안에서만 사용할 수 있어요.");
  return ctx;
}

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<AppData>(emptyData);
  const [today, setToday] = useState<ISODate>("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [attempt, setAttempt] = useState(0);
  const loaded = useRef(false);
  const toastId = useRef(0);

  // 최초 로드. 저장된 데이터가 없으면 데모 데이터로 시작한다.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const now = todayISO();
        const stored = await repository.load();
        if (cancelled) return;
        setToday(now);
        setData(stored ?? createDemoData(now));
        loaded.current = true;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // 변경될 때마다 저장
  useEffect(() => {
    if (!loaded.current) return;
    repository
      .save(data)
      .then(() => setSaveFailed(false))
      .catch(() => setSaveFailed(true));
  }, [data]);

  // 자정을 넘겨 켜 둔 경우를 위해 화면으로 돌아올 때 오늘 날짜를 다시 읽는다
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const actions = useMemo<Actions>(() => {
    const update = (fn: (prev: AppData) => AppData) => setData(fn);
    return {
      addSubscription(input) {
        const sub: Subscription = {
          ...input,
          id: uid("sub"),
          createdAt: new Date().toISOString(),
        };
        update((d) => ({
          ...d,
          subscriptions: [sub, ...d.subscriptions],
          // 가입 검토 중이던 서비스는 이용 중으로 옮겨졌으니 관심 목록에서 뺀다
          wishlist: sub.serviceId
            ? d.wishlist.filter((w) => w.serviceId !== sub.serviceId)
            : d.wishlist,
        }));
        return sub;
      },
      updateSubscription(id, input) {
        update((d) => ({
          ...d,
          subscriptions: d.subscriptions.map((s) => (s.id === id ? { ...s, ...input } : s)),
        }));
      },
      deleteSubscription(id) {
        // 결제 내역은 지난 기록이므로 남기고, 구독과의 연결만 끊는다
        update((d) => ({
          ...d,
          subscriptions: d.subscriptions.filter((s) => s.id !== id),
          payments: d.payments.map((p) =>
            p.subscriptionId === id ? { ...p, subscriptionId: null } : p,
          ),
        }));
      },
      addPayment(input) {
        update((d) => ({ ...d, payments: [{ ...input, id: uid("pay") }, ...d.payments] }));
      },
      updatePayment(id, input) {
        update((d) => ({
          ...d,
          payments: d.payments.map((p) => (p.id === id ? { ...p, ...input } : p)),
        }));
      },
      deletePayment(id) {
        update((d) => ({ ...d, payments: d.payments.filter((p) => p.id !== id) }));
      },
      addCard(input) {
        update((d) => ({ ...d, cards: [...d.cards, { ...input, id: uid("card") }] }));
      },
      updateCard(id, input) {
        update((d) => ({
          ...d,
          cards: d.cards.map((c) => (c.id === id ? { ...c, ...input } : c)),
        }));
      },
      deleteCard(id) {
        update((d) => ({
          ...d,
          cards: d.cards.filter((c) => c.id !== id),
          subscriptions: d.subscriptions.map((s) =>
            s.cardId === id ? { ...s, cardId: null } : s,
          ),
          payments: d.payments.map((p) => (p.cardId === id ? { ...p, cardId: null } : p)),
        }));
      },
      addWishlist(serviceId, planId, cycle) {
        update((d) => {
          const existing = d.wishlist.find((w) => w.serviceId === serviceId);
          if (existing) {
            return {
              ...d,
              wishlist: d.wishlist.map((w) =>
                w.id === existing.id ? { ...w, planId, cycle } : w,
              ),
            };
          }
          return {
            ...d,
            wishlist: [
              {
                id: uid("wish"),
                serviceId,
                planId,
                cycle,
                createdAt: new Date().toISOString(),
              },
              ...d.wishlist,
            ],
          };
        });
      },
      removeWishlist(id) {
        update((d) => ({ ...d, wishlist: d.wishlist.filter((w) => w.id !== id) }));
      },
      updateSettings(patch) {
        update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
      },
      loadDemo() {
        const demo = createDemoData(todayISO());
        update((d) => {
          const kept = stripDemo(d);
          return {
            ...kept,
            subscriptions: [...kept.subscriptions, ...demo.subscriptions],
            payments: [...kept.payments, ...demo.payments],
            cards: [...kept.cards, ...demo.cards],
            wishlist: [...kept.wishlist, ...demo.wishlist],
            settings: {
              ...kept.settings,
              monthlyBudget: kept.settings.monthlyBudget ?? demo.settings.monthlyBudget,
            },
          };
        });
      },
      clearDemo() {
        update(stripDemo);
      },
      resetAll() {
        update(() => emptyData());
      },
    };
  }, []);

  const isDemo = useMemo(
    () =>
      data.subscriptions.some((s) => s.demo) ||
      data.payments.some((p) => p.demo) ||
      data.cards.some((c) => c.demo) ||
      data.wishlist.some((w) => w.demo),
    [data],
  );

  const value = useMemo<AppContextValue>(
    () => ({ data, today, isDemo, saveFailed, actions, toast }),
    [data, today, isDemo, saveFailed, actions, toast],
  );

  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <LoadErrorScreen
        onRetry={() => {
          setStatus("loading");
          setAttempt((a) => a + 1);
        }}
        onReset={async () => {
          try {
            await repository.clear();
          } catch {
            /* 지우지 못해도 다시 시도해 본다 */
          }
          setStatus("loading");
          setAttempt((a) => a + 1);
        }}
      />
    );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-8"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              t.tone === "error"
                ? "bg-bad text-white"
                : t.tone === "info"
                  ? "bg-ink text-white"
                  : "bg-ink text-white"
            }`}
          >
            {t.tone === "success" && <span className="mr-1.5">✓</span>}
            {t.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

/** 예시(demo) 표시가 붙은 항목을 모두 제거하고, 남은 항목이 지워진 카드를 가리키면 연결을 푼다 */
function stripDemo(d: AppData): AppData {
  const cards = d.cards.filter((c) => !c.demo);
  const cardIds = new Set(cards.map((c) => c.id));
  const fixCard = (id: string | null) => (id && cardIds.has(id) ? id : null);
  return {
    ...d,
    cards,
    subscriptions: d.subscriptions
      .filter((s) => !s.demo)
      .map((s) => ({ ...s, cardId: fixCard(s.cardId) })),
    payments: d.payments
      .filter((p) => !p.demo)
      .map((p) => ({ ...p, cardId: fixCard(p.cardId) })),
    wishlist: d.wishlist.filter((w) => !w.demo),
  };
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <div className="flex items-center gap-3 text-muted">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" />
        <span className="text-sm">불러오는 중…</span>
      </div>
    </div>
  );
}

function LoadErrorScreen({
  onRetry,
  onReset,
}: {
  onRetry: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="text-3xl">⚠️</p>
        <h1 className="mt-3 text-lg font-bold text-ink">저장된 데이터를 읽지 못했어요</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          브라우저 저장소를 사용할 수 없거나 저장된 내용이 손상됐을 수 있어요. 다시 시도하거나,
          저장된 데이터를 지우고 처음부터 시작할 수 있어요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="h-11 rounded-xl bg-accent font-semibold text-white hover:bg-accent-strong"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-11 rounded-xl border border-line font-semibold text-bad hover:bg-canvas"
          >
            저장된 데이터 지우고 시작
          </button>
        </div>
      </div>
    </div>
  );
}
