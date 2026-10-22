import {
  addDays,
  addMonthsClamped,
  diffDays,
  monthEnd,
  monthKey,
  monthStart,
  parseISO,
  type ISODate,
} from "./date";
import { addMoney, type MoneyMap } from "./money";
import type {
  AppData,
  CategoryId,
  Currency,
  Cycle,
  Payment,
  PaymentStatus,
  Subscription,
} from "./types";

export const CYCLE_MONTHS: Record<Cycle, number> = { monthly: 1, yearly: 12 };

/** 이 기간(일)보다 오래전에 지난 결제 예정일은 "확인 필요"로 되살리지 않는다 */
export const OVERDUE_WINDOW_DAYS = 62;
/** 결제 기록 날짜가 예정일과 이 일수 이내로 차이 나면 같은 결제로 본다 */
export const MATCH_TOLERANCE_DAYS = 3;

/** 지금 실제로 요금을 내고 있는 구독 (무료체험·종료 제외) */
export function isPaying(sub: Subscription) {
  return sub.status === "active" || sub.status === "ending";
}

/** 월 환산 금액. 연간 요금은 12로 나눈 값 — 실제 청구액이 아니다. */
export function monthlyEquivalent(sub: Subscription) {
  return sub.cycle === "yearly" ? sub.amount / 12 : sub.amount;
}

// ── 결제일 계산 ─────────────────────────────────────────────

/** [from, to] 구간의 결제 예정일. 종료일이 있으면 그 이후는 만들지 않는다. */
export function billingDates(
  sub: Subscription,
  from: ISODate,
  to: ISODate,
): ISODate[] {
  let upper: ISODate | null;
  if (sub.status === "ended") {
    // 종료일을 모르는 종료 구독은 결제일을 만들지 않는다
    upper = sub.endDate ? (sub.endDate < to ? sub.endDate : to) : null;
  } else {
    upper = sub.endDate && sub.endDate < to ? sub.endDate : to;
  }
  if (!upper || upper < sub.firstBillingDate) return [];

  const step = CYCLE_MONTHS[sub.cycle];
  const a = parseISO(sub.firstBillingDate);
  const f = parseISO(from);
  const monthsGap = (f.y - a.y) * 12 + (f.m - a.m);
  let n = Math.max(0, Math.floor(monthsGap / step) - 1);

  const out: ISODate[] = [];
  for (let i = 0; i < 1200; i++, n++) {
    const d = addMonthsClamped(sub.firstBillingDate, n * step);
    if (d > upper) break;
    if (d >= from) out.push(d);
  }
  return out;
}

export function nextBillingDate(sub: Subscription, today: ISODate): ISODate | null {
  if (sub.status === "ended") return null;
  const horizon = addDays(today, CYCLE_MONTHS[sub.cycle] * 31 + 2);
  return billingDates(sub, today, horizon)[0] ?? null;
}

/** 무료체험 종료일이 이미 지났는데 상태가 그대로인 경우 */
export function isTrialOverdue(sub: Subscription, today: ISODate) {
  return sub.status === "trial" && sub.firstBillingDate < today;
}

// ── 결제 행 (실제 기록 + 자동 계산된 예정) ────────────────────

export type RowStatus = PaymentStatus | "projected" | "overdue";

export interface PaymentRow {
  key: string;
  date: ISODate;
  subscriptionId: string | null;
  serviceName: string;
  cardId: string | null;
  amount: number;
  currency: Currency;
  status: RowStatus;
  /** 사용자가 기록한 결제면 id, 자동 계산된 예정이면 null */
  paymentId: string | null;
  memo: string;
}

function isHandled(payments: Payment[], sub: Subscription, date: ISODate) {
  return payments.some(
    (p) =>
      p.subscriptionId === sub.id &&
      Math.abs(diffDays(p.date, date)) <= MATCH_TOLERANCE_DAYS,
  );
}

/**
 * [from, to] 구간의 결제 행을 만든다.
 * - 사용자가 기록한 결제는 그대로 보여준다.
 * - 구독에서 계산한 결제일 중 기록이 없는 날짜는 "예정(자동 계산)"이다.
 * - 예정일이 지났는데 기록이 없으면 완료로 바꾸지 않고 "확인 필요"로 둔다.
 */
export function buildRows(
  data: AppData,
  from: ISODate,
  to: ISODate,
  today: ISODate,
): PaymentRow[] {
  const rows: PaymentRow[] = [];

  for (const p of data.payments) {
    if (p.date < from || p.date > to) continue;
    rows.push({
      key: p.id,
      date: p.date,
      subscriptionId: p.subscriptionId,
      serviceName: p.serviceName,
      cardId: p.cardId,
      amount: p.amount,
      currency: p.currency,
      status: p.status === "scheduled" && p.date < today ? "overdue" : p.status,
      paymentId: p.id,
      memo: p.memo,
    });
  }

  for (const sub of data.subscriptions) {
    for (const date of billingDates(sub, from, to)) {
      if (isHandled(data.payments, sub, date)) continue;
      if (date < today && diffDays(date, today) > OVERDUE_WINDOW_DAYS) continue;
      rows.push({
        key: `proj_${sub.id}_${date}`,
        date,
        subscriptionId: sub.id,
        serviceName: sub.name,
        cardId: sub.cardId,
        amount: sub.amount,
        currency: sub.currency,
        status: date < today ? "overdue" : "projected",
        paymentId: null,
        memo: "",
      });
    }
  }

  return rows.sort((a, b) => (a.date === b.date ? a.key.localeCompare(b.key) : a.date < b.date ? 1 : -1));
}

export function isUpcomingStatus(status: RowStatus) {
  return status === "projected" || status === "scheduled";
}

// ── 대시보드 집계 ───────────────────────────────────────────

export interface Stats {
  /** 월 환산 구독료 (이용 중 + 종료 예정). 연간 요금은 12로 나눈 값 */
  monthlyCost: MoneyMap;
  /** 무료체험이 끝나고 유료 전환되면 추가될 월 환산 금액 */
  trialAfterCost: MoneyMap;
  usingCount: number;
  trialCount: number;
  /** 이번 달 실제 결제 완료 기록의 합 */
  paidThisMonth: MoneyMap;
  /** 오늘 이후 이번 달에 나갈 예정 금액 */
  remainingThisMonth: MoneyMap;
  /** 예정일이 지났지만 결제 기록이 없는 건수 (이번 달) */
  overdueCount: number;
}

export function computeStats(data: AppData, today: ISODate): Stats {
  const monthlyCost: MoneyMap = {};
  const trialAfterCost: MoneyMap = {};
  let usingCount = 0;
  let trialCount = 0;
  for (const s of data.subscriptions) {
    if (s.status !== "ended") usingCount++;
    if (s.status === "trial") {
      trialCount++;
      addMoney(trialAfterCost, s.currency, monthlyEquivalent(s));
    }
    if (isPaying(s)) addMoney(monthlyCost, s.currency, monthlyEquivalent(s));
  }

  const key = monthKey(today);
  const rows = buildRows(data, monthStart(key), monthEnd(key), today);
  const paidThisMonth: MoneyMap = {};
  const remainingThisMonth: MoneyMap = {};
  let overdueCount = 0;
  for (const r of rows) {
    if (r.status === "paid") addMoney(paidThisMonth, r.currency, r.amount);
    else if (isUpcomingStatus(r.status) && r.date >= today)
      addMoney(remainingThisMonth, r.currency, r.amount);
    else if (r.status === "overdue") overdueCount++;
  }

  return {
    monthlyCost,
    trialAfterCost,
    usingCount,
    trialCount,
    paidThisMonth,
    remainingThisMonth,
    overdueCount,
  };
}

export function upcomingRows(data: AppData, today: ISODate, days: number) {
  return buildRows(data, today, addDays(today, days), today)
    .filter((r) => isUpcomingStatus(r.status))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function overdueRows(data: AppData, today: ISODate) {
  return buildRows(data, addDays(today, -OVERDUE_WINDOW_DAYS), addDays(today, -1), today).filter(
    (r) => r.status === "overdue",
  );
}

export function trialSubscriptions(data: AppData) {
  return data.subscriptions
    .filter((s) => s.status === "trial")
    .sort((a, b) => (a.firstBillingDate < b.firstBillingDate ? -1 : 1));
}

export interface CategoryShare {
  category: CategoryId;
  amount: number;
  ratio: number;
  count: number;
}

/** 원화 구독만 비중을 계산한다. 환율 없이 외화를 합산하지 않는다. */
export function categoryShares(data: AppData) {
  const byCategory = new Map<CategoryId, { amount: number; count: number }>();
  const foreign: MoneyMap = {};
  let krwTotal = 0;
  for (const s of data.subscriptions) {
    if (!isPaying(s)) continue;
    if (s.currency !== "KRW") {
      addMoney(foreign, s.currency, monthlyEquivalent(s));
      continue;
    }
    const cur = byCategory.get(s.category) ?? { amount: 0, count: 0 };
    cur.amount += monthlyEquivalent(s);
    cur.count += 1;
    byCategory.set(s.category, cur);
    krwTotal += monthlyEquivalent(s);
  }
  const shares: CategoryShare[] = [...byCategory.entries()]
    .map(([category, v]) => ({
      category,
      amount: v.amount,
      count: v.count,
      ratio: krwTotal > 0 ? v.amount / krwTotal : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  return { shares, krwTotal, foreign };
}

export function recentPayments(data: AppData, today: ISODate, limit: number) {
  return data.payments
    .filter((p) => p.status !== "scheduled" && p.date <= today)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);
}

export function paymentsOfSubscription(data: AppData, subscriptionId: string) {
  return data.payments
    .filter((p) => p.subscriptionId === subscriptionId)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function cardSummary(data: AppData, cardId: string | null) {
  const monthly: MoneyMap = {};
  let count = 0;
  for (const s of data.subscriptions) {
    if (s.cardId !== cardId || s.status === "ended") continue;
    count++;
    if (isPaying(s)) addMoney(monthly, s.currency, monthlyEquivalent(s));
  }
  return { count, monthly };
}

/** 다음 결제일이 가까운 순. 종료된 구독은 맨 뒤 */
export function sortSubscriptions(subs: Subscription[], today: ISODate) {
  const rank = (s: Subscription) => {
    if (s.status === "ended") return 3;
    return nextBillingDate(s, today) ? 0 : 1;
  };
  return [...subs].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    const na = nextBillingDate(a, today) ?? "9999-12-31";
    const nb = nextBillingDate(b, today) ?? "9999-12-31";
    return na === nb ? a.name.localeCompare(b.name, "ko") : na < nb ? -1 : 1;
  });
}
