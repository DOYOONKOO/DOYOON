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
import { useAuth } from "./auth";
import { createDemoData } from "./demo";
import { todayISO, type ISODate } from "./date";
import { newId } from "./id";
import type { AppRepository } from "./repository";
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

export function AppProvider({
  repository,
  children,
}: {
  repository: AppRepository;
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<AppData>(emptyData);
  const [today, setToday] = useState<ISODate>("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [attempt, setAttempt] = useState(0);
  const loaded = useRef(false);
  const toastId = useRef(0);
  // 서버에 마지막으로 저장된 상태. 저장이 실패하면 그대로 두어서 다음 저장 때 같이 다시 보낸다.
  const syncedRef = useRef<AppData>(emptyData());
  // 저장 요청을 한 줄로 세워서 순서가 뒤바뀌지 않게 한다
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  // 최초 로드. 처음 이용하는 사용자라면 데모 데이터로 시작한다.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const now = todayISO();
        const stored = await repository.load();
        if (cancelled) return;
        syncedRef.current = stored ?? emptyData();
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
  }, [attempt, repository]);

  // 변경될 때마다 바뀐 부분만 서버에 저장
  useEffect(() => {
    if (!loaded.current) return;
    const next = data;
    queueRef.current = queueRef.current.then(async () => {
      if (syncedRef.current === next) return;
      try {
        await repository.sync(syncedRef.current, next);
        syncedRef.current = next;
        setSaveFailed(false);
      } catch {
        setSaveFailed(true);
      }
    });
  }, [data, repository]);

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
          id: newId(),
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
        update((d) => ({ ...d, payments: [{ ...input, id: newId() }, ...d.payments] }));
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
        update((d) => ({ ...d, cards: [...d.cards, { ...input, id: newId() }] }));
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
                id: newId(),
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
          // 관심 목록은 서비스당 1개만 둘 수 있어서, 이미 담은 서비스는 예시에서 뺀다
          const keptServices = new Set(kept.wishlist.map((w) => w.serviceId));
          return {
            ...kept,
            subscriptions: [...kept.subscriptions, ...demo.subscriptions],
            payments: [...kept.payments, ...demo.payments],
            cards: [...kept.cards, ...demo.cards],
            wishlist: [
              ...kept.wishlist,
              ...demo.wishlist.filter((w) => !keptServices.has(w.serviceId)),
            ],
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
        onSignOut={signOut}
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
  onSignOut,
}: {
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="text-3xl">⚠️</p>
        <h1 className="mt-3 text-lg font-bold text-ink">데이터를 불러오지 못했어요</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          인터넷 연결이 끊겼거나 서버에 문제가 있을 수 있어요. 잠시 후 다시 시도해 주세요. 계속
          안 되면 로그아웃했다가 다시 로그인해 보세요. 저장된 데이터는 지워지지 않아요.
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
            onClick={onSignOut}
            className="h-11 rounded-xl border border-line font-semibold text-ink hover:bg-canvas"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
