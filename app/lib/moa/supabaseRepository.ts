import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRepository } from "./repository";
import {
  defaultSettings,
  emptyData,
  type AppData,
  type CategoryId,
  type Card,
  type Currency,
  type Cycle,
  type Payment,
  type PaymentStatus,
  type Settings,
  type Source,
  type Subscription,
  type SubscriptionStatus,
  type WishlistItem,
} from "./types";

// ── DB 행 모양 ─────────────────────────────────────────────
interface CardRow {
  id: string;
  nickname: string;
  issuer: string;
  last4: string;
  demo: boolean;
}
interface SubscriptionRow {
  id: string;
  service_id: string | null;
  name: string;
  category: CategoryId;
  plan_id: string | null;
  plan_name: string;
  amount: number | string;
  currency: Currency;
  cycle: Cycle;
  first_billing_date: string;
  status: SubscriptionStatus;
  end_date: string | null;
  card_id: string | null;
  memo: string;
  source: Source;
  demo: boolean;
  created_at: string;
}
interface PaymentRow {
  id: string;
  subscription_id: string | null;
  service_name: string;
  card_id: string | null;
  amount: number | string;
  currency: Currency;
  date: string;
  status: PaymentStatus;
  memo: string;
  demo: boolean;
}
interface WishlistRow {
  id: string;
  service_id: string;
  plan_id: string | null;
  cycle: Cycle;
  demo: boolean;
  created_at: string;
}
interface SettingsRow {
  monthly_budget: number | string | null;
  alert_payment: boolean;
  alert_days_before: number;
  alert_trial_end: boolean;
}

// ── 앱 모델 → DB 행 ────────────────────────────────────────
export const toCardRow = (c: Card, userId: string) => ({
  id: c.id,
  user_id: userId,
  nickname: c.nickname,
  issuer: c.issuer,
  last4: c.last4,
  demo: c.demo ?? false,
});

export const toSubscriptionRow = (s: Subscription, userId: string) => ({
  id: s.id,
  user_id: userId,
  service_id: s.serviceId,
  name: s.name,
  category: s.category,
  plan_id: s.planId,
  plan_name: s.planName,
  amount: s.amount,
  currency: s.currency,
  cycle: s.cycle,
  first_billing_date: s.firstBillingDate,
  status: s.status,
  end_date: s.endDate,
  card_id: s.cardId,
  memo: s.memo,
  source: s.source,
  demo: s.demo ?? false,
  created_at: s.createdAt,
});

export const toPaymentRow = (p: Payment, userId: string) => ({
  id: p.id,
  user_id: userId,
  subscription_id: p.subscriptionId,
  service_name: p.serviceName,
  card_id: p.cardId,
  amount: p.amount,
  currency: p.currency,
  date: p.date,
  status: p.status,
  memo: p.memo,
  demo: p.demo ?? false,
});

export const toWishlistRow = (w: WishlistItem, userId: string) => ({
  id: w.id,
  user_id: userId,
  service_id: w.serviceId,
  plan_id: w.planId,
  cycle: w.cycle,
  demo: w.demo ?? false,
  created_at: w.createdAt,
});

export const toSettingsRow = (s: Settings, userId: string) => ({
  user_id: userId,
  monthly_budget: s.monthlyBudget,
  alert_payment: s.alertPayment,
  alert_days_before: s.alertDaysBefore,
  alert_trial_end: s.alertTrialEnd,
});

// ── DB 행 → 앱 모델 ────────────────────────────────────────
// demo 는 true 일 때만 붙인다 (기존 앱 모델과 같은 모양 유지)
const demoFlag = (demo: boolean) => (demo ? { demo: true as const } : {});

export const fromCardRow = (r: CardRow): Card => ({
  id: r.id,
  nickname: r.nickname,
  issuer: r.issuer,
  last4: r.last4,
  ...demoFlag(r.demo),
});

export const fromSubscriptionRow = (r: SubscriptionRow): Subscription => ({
  id: r.id,
  serviceId: r.service_id,
  name: r.name,
  category: r.category,
  planId: r.plan_id,
  planName: r.plan_name,
  amount: Number(r.amount),
  currency: r.currency,
  cycle: r.cycle,
  firstBillingDate: r.first_billing_date,
  status: r.status,
  endDate: r.end_date,
  cardId: r.card_id,
  memo: r.memo,
  source: r.source,
  createdAt: r.created_at,
  ...demoFlag(r.demo),
});

export const fromPaymentRow = (r: PaymentRow): Payment => ({
  id: r.id,
  subscriptionId: r.subscription_id,
  serviceName: r.service_name,
  cardId: r.card_id,
  amount: Number(r.amount),
  currency: r.currency,
  date: r.date,
  status: r.status,
  memo: r.memo,
  ...demoFlag(r.demo),
});

export const fromWishlistRow = (r: WishlistRow): WishlistItem => ({
  id: r.id,
  serviceId: r.service_id,
  planId: r.plan_id,
  cycle: r.cycle,
  createdAt: r.created_at,
  ...demoFlag(r.demo),
});

export const fromSettingsRow = (r: SettingsRow): Settings => ({
  ...defaultSettings(),
  monthlyBudget: r.monthly_budget === null ? null : Number(r.monthly_budget),
  alertPayment: r.alert_payment,
  alertDaysBefore: ([1, 3, 7] as const).find((d) => d === r.alert_days_before) ?? 3,
  alertTrialEnd: r.alert_trial_end,
});

// ── 바뀐 항목 찾기 ─────────────────────────────────────────
// 객체가 바뀌지 않았다면 store 가 같은 참조를 그대로 유지하므로 참조 비교로 충분하다.
export function diffById<T extends { id: string }>(prev: T[], next: T[]) {
  const before = new Map(prev.map((x) => [x.id, x]));
  const nextIds = new Set(next.map((x) => x.id));
  return {
    changed: next.filter((x) => before.get(x.id) !== x),
    removedIds: prev.filter((x) => !nextIds.has(x.id)).map((x) => x.id),
  };
}

const CHUNK = 100;

function chunks<T>(list: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK));
  return out;
}

export function createSupabaseRepository(
  supabase: SupabaseClient,
  userId: string,
): AppRepository {
  async function fetchAll<R>(table: string, orderBy: string, ascending: boolean): Promise<R[]> {
    const pageSize = 1000;
    const all: R[] = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderBy, { ascending })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      all.push(...((data ?? []) as R[]));
      if (!data || data.length < pageSize) return all;
    }
  }

  async function upsert(table: string, rows: object[]) {
    for (const part of chunks(rows)) {
      const { error } = await supabase.from(table).upsert(part, { onConflict: "id" });
      if (error) throw error;
    }
  }

  async function remove(table: string, ids: string[]) {
    for (const part of chunks(ids)) {
      const { error } = await supabase.from(table).delete().in("id", part);
      if (error) throw error;
    }
  }

  return {
    async load() {
      const { data: settingsRow, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .maybeSingle();
      if (settingsError) throw settingsError;

      if (!settingsRow) {
        // 처음 이용하는 사용자: 설정 행을 만들어 "시작 설정 완료"로 표시한다
        const { error } = await supabase
          .from("user_settings")
          .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
        if (error) throw error;
        return null;
      }

      const [cards, subscriptions, payments, wishlist] = await Promise.all([
        fetchAll<CardRow>("cards", "created_at", true),
        fetchAll<SubscriptionRow>("subscriptions", "created_at", false),
        fetchAll<PaymentRow>("payments", "date", false),
        fetchAll<WishlistRow>("wishlist_items", "created_at", false),
      ]);

      return {
        ...emptyData(),
        cards: cards.map(fromCardRow),
        subscriptions: subscriptions.map(fromSubscriptionRow),
        payments: payments.map(fromPaymentRow),
        wishlist: wishlist.map(fromWishlistRow),
        settings: fromSettingsRow(settingsRow as SettingsRow),
      } satisfies AppData;
    },

    async sync(prev, next) {
      const cards = diffById(prev.cards, next.cards);
      const subs = diffById(prev.subscriptions, next.subscriptions);
      const pays = diffById(prev.payments, next.payments);
      const wish = diffById(prev.wishlist, next.wishlist);

      // 관심 목록은 (사용자, 서비스) 가 유일해야 하므로 지운 뒤에 넣는다
      await remove("wishlist_items", wish.removedIds);

      // 참조되는 쪽부터 넣는다: 카드 → 구독 → 결제
      await upsert("cards", cards.changed.map((c) => toCardRow(c, userId)));
      await upsert("subscriptions", subs.changed.map((s) => toSubscriptionRow(s, userId)));
      await upsert("payments", pays.changed.map((p) => toPaymentRow(p, userId)));
      await upsert("wishlist_items", wish.changed.map((w) => toWishlistRow(w, userId)));

      if (prev.settings !== next.settings) {
        const { error } = await supabase
          .from("user_settings")
          .upsert(toSettingsRow(next.settings, userId), { onConflict: "user_id" });
        if (error) throw error;
      }

      // 지우는 건 참조하는 쪽부터: 결제 → 구독 → 카드
      // (store 가 이미 연결을 끊은 행을 위에서 먼저 저장했으므로 안전하다)
      await remove("payments", pays.removedIds);
      await remove("subscriptions", subs.removedIds);
      await remove("cards", cards.removedIds);
    },
  };
}
