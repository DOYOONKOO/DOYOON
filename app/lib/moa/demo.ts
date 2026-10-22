import { billingDates, CYCLE_MONTHS } from "./billing";
import { getPlan, getService } from "./catalog";
import {
  addDays,
  addMonthsClamped,
  daysInMonth,
  parseISO,
  type ISODate,
} from "./date";
import {
  defaultSettings,
  type AppData,
  type Card,
  type Cycle,
  type Payment,
  type Source,
  type Subscription,
  type SubscriptionStatus,
  type WishlistItem,
} from "./types";

/** 데모 모드용 예시 데이터. 오늘 날짜를 기준으로 만들어서 모든 화면이 채워진다. */
export function createDemoData(today: ISODate): AppData {
  const cards: Card[] = [
    { id: "demo_card_life", nickname: "생활비 카드", issuer: "삼성카드", last4: "4821", demo: true },
    { id: "demo_card_global", nickname: "해외결제용", issuer: "현대카드", last4: "7305", demo: true },
    { id: "demo_card_check", nickname: "월급통장 체크", issuer: "KB국민카드", last4: "1190", demo: true },
  ];

  // 결제일이 29~31일이면 달마다 어긋나 보이므로 데모에서는 28일 이하로 맞춘다
  const nextDate = (offset: number): ISODate => {
    const d = addDays(today, offset);
    const { y, m, d: day } = parseISO(d);
    return day > 28 ? addDays(d, daysInMonth(y, m) - day + 1) : d;
  };

  const createdAt = `${addDays(today, -180)}T00:00:00.000Z`;

  const sub = (
    key: string,
    serviceId: string,
    planId: string,
    cycle: Cycle,
    next: ISODate,
    o: {
      cardId: string;
      historyCycles?: number;
      status?: SubscriptionStatus;
      endDate?: ISODate | null;
      memo?: string;
      source?: Source;
    },
  ): Subscription => {
    const service = getService(serviceId)!;
    const plan = getPlan(planId)!;
    const status = o.status ?? "active";
    const first =
      status === "trial"
        ? next
        : addMonthsClamped(next, -CYCLE_MONTHS[cycle] * (o.historyCycles ?? 6));
    return {
      id: `demo_sub_${key}`,
      serviceId,
      name: service.name,
      category: service.category,
      planId,
      planName: plan.name,
      amount: plan.prices[cycle] as number,
      currency: plan.currency,
      cycle,
      firstBillingDate: first,
      status,
      endDate: o.endDate ?? null,
      cardId: o.cardId,
      memo: o.memo ?? "",
      source: o.source ?? "direct",
      createdAt,
      demo: true,
    };
  };

  // 31일 결제 예시: 짧은 달에는 말일로 당겨지고 다시 31일로 돌아온다
  let anchor31: ISODate = addDays(today, -120);
  for (let i = 60; i <= 215; i++) {
    const d = addDays(today, -i);
    if (parseISO(d).d === 31) {
      anchor31 = d;
      break;
    }
  }

  const melonNext = nextDate(-40);

  const subscriptions: Subscription[] = [
    sub("netflix", "netflix", "netflix:standard", "monthly", nextDate(3), {
      cardId: "demo_card_life",
      memo: "가족과 같이 봄",
    }),
    sub("coupang", "coupang-wow", "coupang-wow:wow", "monthly", nextDate(6), {
      cardId: "demo_card_life",
      source: "explore",
    }),
    sub("youtube", "youtube-premium", "youtube-premium:individual", "monthly", nextDate(11), {
      cardId: "demo_card_life",
    }),
    sub("chatgpt", "chatgpt", "chatgpt:plus", "monthly", nextDate(15), {
      cardId: "demo_card_global",
      memo: "업무용",
    }),
    sub("notion", "notion", "notion:plus", "yearly", nextDate(20), {
      cardId: "demo_card_global",
      historyCycles: 1,
    }),
    sub("google-one", "google-one", "google-one:2tb", "yearly", nextDate(270), {
      cardId: "demo_card_check",
      historyCycles: 1,
    }),
    sub("disney", "disney-plus", "disney-plus:premium", "monthly", nextDate(4), {
      cardId: "demo_card_life",
      status: "trial",
      memo: "체험 끝나기 전에 계속 쓸지 결정하기",
      source: "official",
    }),
    sub("tving", "tving", "tving:standard", "monthly", nextDate(8), {
      cardId: "demo_card_life",
      status: "ending",
      endDate: addDays(today, 7),
      memo: "이번 시즌만 보고 해지 예정 (공식 사이트에서 직접 해지해야 함)",
    }),
    {
      ...sub("icloud", "icloud", "icloud:200gb", "monthly", anchor31, {
        cardId: "demo_card_check",
      }),
      firstBillingDate: anchor31,
      memo: "매월 31일 결제 — 짧은 달엔 말일에 결제돼요",
    },
    {
      ...sub("melon", "melon", "melon:streaming", "monthly", melonNext, {
        cardId: "demo_card_life",
        historyCycles: 5,
        status: "ended",
        endDate: melonNext,
      }),
    },
    {
      id: "demo_sub_gym",
      serviceId: null,
      name: "동네 필라테스",
      category: "etc",
      planId: null,
      planName: "월 회원권",
      amount: 55000,
      currency: "KRW",
      cycle: "monthly",
      firstBillingDate: addMonthsClamped(nextDate(18), -6),
      status: "active",
      endDate: null,
      cardId: "demo_card_check",
      memo: "월말 자동이체",
      source: "direct",
      createdAt,
      demo: true,
    },
  ];

  // 과거 결제 내역: 계산된 결제일마다 "완료" 기록을 만든다.
  // 일부러 하나는 실패, 하나는 기록 없음(확인 필요)으로 두어 해당 화면을 보여준다.
  const payments: Payment[] = [];
  const since = addDays(today, -200);
  const yesterday = addDays(today, -1);
  for (const s of subscriptions) {
    if (s.status === "trial") continue;
    const dates = billingDates(s, since, yesterday);
    dates.forEach((date, i) => {
      const isLatest = i === dates.length - 1;
      if (s.id === "demo_sub_chatgpt" && isLatest) return;
      payments.push({
        id: `demo_pay_${s.id}_${date}`,
        subscriptionId: s.id,
        serviceName: s.name,
        cardId: s.cardId,
        amount: s.amount,
        currency: s.currency,
        date,
        status: s.id === "demo_sub_youtube" && isLatest ? "failed" : "paid",
        memo: s.id === "demo_sub_youtube" && isLatest ? "한도 초과로 결제 실패" : "",
        demo: true,
      });
    });
  }

  const wishlist: WishlistItem[] = [
    {
      id: "demo_wish_claude",
      serviceId: "claude",
      planId: "claude:pro",
      cycle: "monthly",
      createdAt,
      demo: true,
    },
    {
      id: "demo_wish_apple-music",
      serviceId: "apple-music",
      planId: "apple-music:individual",
      cycle: "monthly",
      createdAt,
      demo: true,
    },
  ];

  return {
    version: 1,
    subscriptions,
    payments,
    cards,
    wishlist,
    settings: { ...defaultSettings(), monthlyBudget: 150000 },
  };
}
