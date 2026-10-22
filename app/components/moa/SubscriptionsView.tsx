"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { isTrialOverdue, nextBillingDate, sortSubscriptions } from "../../lib/moa/billing";
import { formatKoDate, relativeDayLabel } from "../../lib/moa/date";
import { formatMoney } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import {
  CATEGORY_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type CategoryId,
  type Subscription,
  type SubscriptionStatus,
} from "../../lib/moa/types";
import { Icon } from "./icons";
import { cardLabel, cycleSuffix } from "./parts";
import SubscriptionDetail from "./SubscriptionDetail";
import SubscriptionForm from "./SubscriptionForm";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Segmented,
  ServiceAvatar,
  SubscriptionStatusBadge,
  cn,
  inputClass,
} from "./ui";

type ViewMode = "card" | "list";

function NextBillingText({ sub, today }: { sub: Subscription; today: string }) {
  if (sub.status === "ended") {
    return <span className="text-muted">{sub.endDate ? `${formatKoDate(sub.endDate)} 종료` : "종료됨"}</span>;
  }
  if (sub.status === "trial") {
    return (
      <span className={isTrialOverdue(sub, today) ? "text-warn" : "text-ink"}>
        체험 종료 {formatKoDate(sub.firstBillingDate)}
        {isTrialOverdue(sub, today) ? " · 확인 필요" : ` · ${relativeDayLabel(sub.firstBillingDate, today)}`}
      </span>
    );
  }
  const next = nextBillingDate(sub, today);
  if (!next) {
    return (
      <span className="text-warn">
        {sub.endDate ? `${formatKoDate(sub.endDate)}까지 이용` : "결제 예정 없음"}
      </span>
    );
  }
  return (
    <span className="text-ink">
      {formatKoDate(next)} · {relativeDayLabel(next, today)}
    </span>
  );
}

export default function SubscriptionsView() {
  const { data, today } = useApp();
  const [view, setView] = useState<ViewMode>("card");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const [cardId, setCardId] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const sorted = useMemo(() => sortSubscriptions(data.subscriptions, today), [data.subscriptions, today]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.planName.toLowerCase().includes(q)) return false;
      if (category !== "all" && s.category !== category) return false;
      if (status !== "all" && s.status !== status) return false;
      if (cardId === "none" ? s.cardId !== null : cardId !== "all" && s.cardId !== cardId) return false;
      return true;
    });
  }, [sorted, query, category, status, cardId]);

  const filtering = query.trim() !== "" || category !== "all" || status !== "all" || cardId !== "all";

  function resetFilters() {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setCardId("all");
  }

  const addButton = (
    <Button onClick={() => setAdding(true)}>
      <Icon name="plus" className="h-[18px] w-[18px]" />
      구독 추가
    </Button>
  );

  return (
    <>
      <PageHeader
        title="내 구독"
        description={`전체 ${data.subscriptions.length}개 · 이용 중인 서비스와 정기결제를 관리해요.`}
        actions={addButton}
      />

      {data.subscriptions.length === 0 ? (
        <EmptyState
          icon="list"
          title="등록한 구독이 없어요"
          description="이용 중인 구독을 추가하면 결제일과 금액을 한곳에서 볼 수 있어요."
          action={
            <>
              {addButton}
              <Link
                href="/explore"
                className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-canvas"
              >
                서비스 둘러보기
              </Link>
            </>
          }
        />
      ) : (
        <>
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
                />
                <input
                  className={cn(inputClass, "pl-10")}
                  type="search"
                  placeholder="서비스명 검색"
                  aria-label="서비스명 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Segmented<ViewMode>
                label="보기 방식"
                value={view}
                onChange={setView}
                options={[
                  { value: "card", label: "카드", icon: "grid" },
                  { value: "list", label: "목록", icon: "list" },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                className={inputClass}
                aria-label="카테고리 필터"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId | "all")}
              >
                <option value="all">모든 카테고리</option>
                {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                aria-label="상태 필터"
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus | "all")}
              >
                <option value="all">모든 상태</option>
                {(Object.keys(SUBSCRIPTION_STATUS_LABELS) as SubscriptionStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {SUBSCRIPTION_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                aria-label="결제 카드 필터"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
              >
                <option value="all">모든 결제 카드</option>
                {data.cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nickname} ···{c.last4}
                  </option>
                ))}
                <option value="none">카드 미지정</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title="조건에 맞는 구독이 없어요"
              description="검색어나 필터를 바꿔 보세요."
              action={
                filtering ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    필터 초기화
                  </Button>
                ) : undefined
              }
            />
          ) : view === "card" ? (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setDetailId(s.id)}
                    className={cn(
                      "flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-5 text-left transition-shadow hover:shadow-md",
                      s.status === "ended" && "opacity-70",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <ServiceAvatar name={s.name} />
                      <div className="min-w-0 flex-1">
                        <p className="break-keep text-base font-bold leading-snug text-ink">{s.name}</p>
                        <p className="truncate text-[13px] text-muted">
                          {s.planName || CATEGORY_LABELS[s.category]}
                        </p>
                      </div>
                      <SubscriptionStatusBadge status={s.status} />
                    </div>
                    <p className="tabular mt-4 text-2xl font-bold text-ink">
                      {formatMoney(s.amount, s.currency)}{" "}
                      <span className="text-sm font-semibold text-muted">{cycleSuffix(s.cycle)}</span>
                    </p>
                    <dl className="mt-3 space-y-1 border-t border-line pt-3 text-[13px]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">다음 결제</dt>
                        <dd className="text-right font-semibold">
                          <NextBillingText sub={s} today={today} />
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted">결제 카드</dt>
                        <dd className="truncate text-right font-semibold text-ink">
                          {cardLabel(data.cards, s.cardId)}
                        </dd>
                      </div>
                    </dl>
                    {s.demo && (
                      <div className="mt-3">
                        <Badge>예시</Badge>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setDetailId(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-canvas",
                      s.status === "ended" && "opacity-70",
                    )}
                  >
                    <ServiceAvatar name={s.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-[15px] font-semibold text-ink">
                        <span className="truncate">{s.name}</span>
                        {s.demo && <Badge>예시</Badge>}
                      </p>
                      <p className="truncate text-[13px] text-muted">
                        {s.planName || CATEGORY_LABELS[s.category]} · {cardLabel(data.cards, s.cardId)}
                      </p>
                      <p className="mt-0.5 text-[13px] font-medium md:hidden">
                        <NextBillingText sub={s} today={today} />
                      </p>
                    </div>
                    <p className="hidden w-60 shrink-0 text-right text-[13px] font-medium md:block">
                      <NextBillingText sub={s} today={today} />
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="tabular text-[15px] font-bold text-ink">
                        {formatMoney(s.amount, s.currency)}
                        <span className="ml-1 text-xs font-medium text-muted">{cycleSuffix(s.cycle)}</span>
                      </p>
                      <SubscriptionStatusBadge status={s.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {adding && <SubscriptionForm onClose={() => setAdding(false)} />}
      {detailId && <SubscriptionDetail subscriptionId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
