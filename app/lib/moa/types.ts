import type { ISODate } from "./date";

export type Currency = "KRW" | "USD";
export type Cycle = "monthly" | "yearly";

export type CategoryId =
  | "ott"
  | "music"
  | "ai"
  | "design"
  | "cloud"
  | "shopping"
  | "etc";
export type CatalogCategoryId = Exclude<CategoryId, "etc">;

export type SubscriptionStatus = "active" | "trial" | "ending" | "ended";
export type PaymentStatus = "paid" | "scheduled" | "failed" | "refunded";
export type Source = "direct" | "explore" | "official";

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  ott: "OTT·영상",
  music: "음악",
  ai: "AI·생산성",
  design: "디자인",
  cloud: "클라우드",
  shopping: "쇼핑·멤버십",
  etc: "기타",
};

export const CATALOG_CATEGORIES: CatalogCategoryId[] = [
  "ott",
  "music",
  "ai",
  "design",
  "cloud",
  "shopping",
];

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "이용 중",
  trial: "무료체험",
  ending: "종료 예정",
  ended: "종료",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "결제 완료",
  scheduled: "결제 예정",
  failed: "결제 실패",
  refunded: "환불",
};

export const SOURCE_LABELS: Record<Source, string> = {
  direct: "직접 등록",
  explore: "서비스 둘러보기",
  official: "공식 사이트 가입 후 등록",
};

export const CYCLE_LABELS: Record<Cycle, string> = {
  monthly: "월간",
  yearly: "연간",
};

// ── 카탈로그 (서비스 · 요금제) ──────────────────────────────
export interface Service {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: CatalogCategoryId;
  features: string[];
  officialUrl: string;
}

export interface Plan {
  id: string;
  serviceId: string;
  name: string;
  summary: string;
  currency: Currency;
  prices: Partial<Record<Cycle, number>>;
}

// ── 사용자 데이터 ─────────────────────────────────────────────
export interface Card {
  id: string;
  nickname: string;
  issuer: string;
  last4: string;
  demo?: boolean;
}

export interface Subscription {
  id: string;
  serviceId: string | null;
  name: string;
  category: CategoryId;
  planId: string | null;
  planName: string;
  /** 사용자가 실제로 내는 금액 (요금제 가격과 별도로 관리) */
  amount: number;
  currency: Currency;
  cycle: Cycle;
  /** 결제 기준일. 이 날짜에서 결제 주기마다 반복된다. 무료체험이면 체험 종료일(첫 결제일). */
  firstBillingDate: ISODate;
  status: SubscriptionStatus;
  /** 종료 예정/종료 상태의 마지막 이용일 */
  endDate: ISODate | null;
  cardId: string | null;
  memo: string;
  source: Source;
  createdAt: string;
  demo?: boolean;
}

export interface Payment {
  id: string;
  subscriptionId: string | null;
  serviceName: string;
  cardId: string | null;
  amount: number;
  currency: Currency;
  date: ISODate;
  status: PaymentStatus;
  memo: string;
  demo?: boolean;
}

export interface WishlistItem {
  id: string;
  serviceId: string;
  planId: string | null;
  cycle: Cycle;
  createdAt: string;
  demo?: boolean;
}

export interface Settings {
  /** 월 구독 예산 (원화) */
  monthlyBudget: number | null;
  alertPayment: boolean;
  alertDaysBefore: 1 | 3 | 7;
  alertTrialEnd: boolean;
}

export interface AppData {
  version: 1;
  subscriptions: Subscription[];
  payments: Payment[];
  cards: Card[];
  wishlist: WishlistItem[];
  settings: Settings;
}

export function defaultSettings(): Settings {
  return {
    monthlyBudget: null,
    alertPayment: true,
    alertDaysBefore: 3,
    alertTrialEnd: true,
  };
}

export function emptyData(): AppData {
  return {
    version: 1,
    subscriptions: [],
    payments: [],
    cards: [],
    wishlist: [],
    settings: defaultSettings(),
  };
}
