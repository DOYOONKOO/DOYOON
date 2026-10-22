"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  categoryShares,
  computeStats,
  isTrialOverdue,
  recentPayments,
  trialSubscriptions,
  upcomingRows,
  type PaymentRow,
} from "../../lib/moa/billing";
import { formatKoDate, relativeDayLabel } from "../../lib/moa/date";
import { formatMoney, formatMoneyMap, moneyEntries } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import { CATEGORY_LABELS } from "../../lib/moa/types";
import { Icon } from "./icons";
import { PaymentRowItem } from "./parts";
import SubscriptionForm from "./SubscriptionForm";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  MoneyView,
  Notice,
  PageHeader,
  ProgressBar,
  SectionHeader,
  ServiceAvatar,
} from "./ui";

function StatCard({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <div className="mt-2 text-[26px] leading-tight text-ink">{children}</div>
      {hint && <p className="mt-2 text-[13px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { data, today } = useApp();
  const [adding, setAdding] = useState(false);

  const stats = useMemo(() => computeStats(data, today), [data, today]);
  const upcoming = useMemo(() => upcomingRows(data, today, 7), [data, today]);
  const trials = useMemo(() => trialSubscriptions(data), [data]);
  const shares = useMemo(() => categoryShares(data), [data]);
  const recent = useMemo(() => recentPayments(data, today, 6), [data, today]);

  const budget = data.settings.monthlyBudget;
  const krwMonthly = stats.monthlyCost.KRW ?? 0;

  const headerActions = (
    <>
      <Link
        href="/explore"
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-canvas"
      >
        <Icon name="compass" className="h-[18px] w-[18px]" />
        서비스 둘러보기
      </Link>
      <Button onClick={() => setAdding(true)}>
        <Icon name="plus" className="h-[18px] w-[18px]" />
        구독 추가
      </Button>
    </>
  );

  const empty = data.subscriptions.length === 0;

  return (
    <>
      <PageHeader
        title="대시보드"
        description="내가 쓰는 구독과 정기결제를 한눈에 확인해요."
        actions={empty ? undefined : headerActions}
      />

      {empty ? (
        <EmptyState
          icon="list"
          title="아직 등록한 구독이 없어요"
          description="이용 중인 구독을 직접 추가하거나, 서비스 둘러보기에서 새로운 서비스를 찾아보세요."
          action={headerActions}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard
              label="월 환산 구독료"
              hint="연간 결제는 12로 나눈 금액이라 실제 청구액과 달라요."
            >
              <MoneyView map={stats.monthlyCost} className="text-[26px]" />
            </StatCard>
            <StatCard
              label="이번 달 결제 완료"
              hint={
                stats.overdueCount > 0
                  ? `결제 확인이 필요한 ${stats.overdueCount}건은 제외했어요.`
                  : "기록된 결제 완료 내역의 합계예요."
              }
            >
              <MoneyView map={stats.paidThisMonth} className="text-[26px]" />
            </StatCard>
            <StatCard label="이번 달 남은 예정" hint="오늘 이후 이번 달에 나갈 것으로 계산된 금액이에요.">
              <MoneyView map={stats.remainingThisMonth} className="text-[26px]" />
            </StatCard>
            <StatCard
              label="이용 중인 구독"
              hint={
                stats.trialCount > 0
                  ? `무료체험 ${stats.trialCount}개 포함 · 체험 후 월 ${formatMoneyMap(stats.trialAfterCost)} 추가`
                  : "종료된 구독은 빼고 센 숫자예요."
              }
            >
              <span className="tabular font-bold">{stats.usingCount}개</span>
            </StatCard>
          </div>

          {stats.overdueCount > 0 && (
            <Notice tone="warn">
              결제 예정일이 지났지만 결제 기록이 없는 건이 {stats.overdueCount}건 있어요. 실제로
              결제됐는지 확인하고{" "}
              <Link href="/payments" className="font-bold underline underline-offset-2">
                결제 내역
              </Link>
              에서 기록해 주세요. 자동으로 완료 처리하지는 않아요.
            </Notice>
          )}

          {budget !== null && (
            <Card>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-muted">월 구독 예산 (원화 기준)</p>
                <p className="tabular text-sm font-semibold text-ink">
                  {formatMoney(krwMonthly, "KRW")} / {formatMoney(budget, "KRW")}
                </p>
              </div>
              <div className="mt-3">
                <ProgressBar ratio={krwMonthly / budget} over={krwMonthly > budget} />
              </div>
              <p className="mt-2 text-[13px] text-muted">
                {krwMonthly > budget
                  ? `예산을 ${formatMoney(krwMonthly - budget, "KRW")} 넘었어요.`
                  : `예산까지 ${formatMoney(budget - krwMonthly, "KRW")} 남았어요.`}
                {moneyEntries(stats.monthlyCost).some(([c]) => c !== "KRW") &&
                  " 외화 구독은 환율 없이 합산하지 않아 제외했어요."}
              </p>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <SectionHeader
                title="7일 이내 결제 예정"
                action={
                  <Link href="/payments" className="text-sm font-semibold text-accent-strong">
                    전체 보기
                  </Link>
                }
              />
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  7일 안에 예정된 결제가 없어요.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {upcoming.map((r: PaymentRow) => (
                    <PaymentRowItem
                      key={r.key}
                      row={r}
                      cards={data.cards}
                      today={today}
                      showRelative
                    />
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <SectionHeader title="무료체험 종료 예정" />
              {trials.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  무료체험 중인 서비스가 없어요.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {trials.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-3">
                      <ServiceAvatar name={s.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-ink">{s.name}</p>
                        <p className="truncate text-[13px] text-muted">
                          체험 종료 {formatKoDate(s.firstBillingDate)} · 이후{" "}
                          {formatMoney(s.amount, s.currency)}
                          {s.cycle === "yearly" ? "/년" : "/월"}
                        </p>
                      </div>
                      {isTrialOverdue(s, today) ? (
                        <Badge tone="warn">종료일 지남</Badge>
                      ) : (
                        <Badge tone="accent">{relativeDayLabel(s.firstBillingDate, today)}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <SectionHeader title="카테고리별 월 환산 비중" />
              {shares.shares.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  원화로 결제 중인 구독이 없어요.
                </p>
              ) : (
                <ul className="space-y-3.5">
                  {shares.shares.map((s) => (
                    <li key={s.category}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-semibold text-ink">
                          {CATEGORY_LABELS[s.category]}{" "}
                          <span className="font-normal text-muted">{s.count}개</span>
                        </span>
                        <span className="tabular text-muted">
                          <strong className="font-bold text-ink">
                            {formatMoney(s.amount, "KRW")}
                          </strong>{" "}
                          · {Math.round(s.ratio * 100)}%
                        </span>
                      </div>
                      <ProgressBar ratio={s.ratio} />
                    </li>
                  ))}
                </ul>
              )}
              {moneyEntries(shares.foreign).length > 0 && (
                <p className="mt-4 text-[13px] leading-relaxed text-muted">
                  외화 구독({formatMoneyMap(shares.foreign)}/월 환산)은 환율 없이 원화와 합산하지
                  않아서 비중에서 제외했어요.
                </p>
              )}
            </Card>

            <Card>
              <SectionHeader
                title="최근 결제 내역"
                action={
                  <Link href="/payments" className="text-sm font-semibold text-accent-strong">
                    전체 보기
                  </Link>
                }
              />
              {recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">아직 기록된 결제가 없어요.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {recent.map((p) => (
                    <PaymentRowItem
                      key={p.id}
                      today={today}
                      cards={data.cards}
                      row={{
                        key: p.id,
                        date: p.date,
                        subscriptionId: p.subscriptionId,
                        serviceName: p.serviceName,
                        cardId: p.cardId,
                        amount: p.amount,
                        currency: p.currency,
                        status: p.status,
                        paymentId: p.id,
                        memo: p.memo,
                      }}
                    />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {adding && <SubscriptionForm onClose={() => setAdding(false)} />}
    </>
  );
}
