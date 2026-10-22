"use client";

import { useMemo, useState } from "react";
import { buildRows, type PaymentRow, type RowStatus } from "../../lib/moa/billing";
import {
  formatKoDate,
  formatMonthLabel,
  monthEnd,
  monthKey,
  monthStart,
  shiftMonthKey,
} from "../../lib/moa/date";
import { addMoney, formatMoneyMap, type MoneyMap } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import { Icon } from "./icons";
import { PaymentRowItem } from "./parts";
import PaymentForm, { type PaymentPreset } from "./PaymentForm";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Notice,
  PageHeader,
  Segmented,
  inputOnGrayClass,
} from "./ui";

type Tab = "all" | "paid" | "upcoming" | "check" | "problem";

const TAB_MATCH: Record<Tab, (s: RowStatus) => boolean> = {
  all: () => true,
  paid: (s) => s === "paid",
  upcoming: (s) => s === "projected" || s === "scheduled",
  check: (s) => s === "overdue",
  problem: (s) => s === "failed" || s === "refunded",
};

export default function PaymentsView() {
  const { data, today, actions, toast } = useApp();
  const [month, setMonth] = useState(() => monthKey(today));
  const [tab, setTab] = useState<Tab>("all");
  const [service, setService] = useState("all");
  const [cardId, setCardId] = useState("all");
  const [form, setForm] = useState<
    { mode: "new"; preset?: PaymentPreset } | { mode: "edit"; id: string } | null
  >(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const monthRows = useMemo(
    () => buildRows(data, monthStart(month), monthEnd(month), today),
    [data, month, today],
  );

  const serviceNames = useMemo(() => {
    const names = new Set<string>();
    data.subscriptions.forEach((s) => names.add(s.name));
    data.payments.forEach((p) => names.add(p.serviceName));
    return [...names].sort((a, b) => a.localeCompare(b, "ko"));
  }, [data]);

  // 서비스·카드 필터를 적용한 뒤 합계를 내고, 그 다음에 상태 탭을 적용한다
  const scoped = useMemo(
    () =>
      monthRows.filter(
        (r) =>
          (service === "all" || r.serviceName === service) &&
          (cardId === "all" || (cardId === "none" ? r.cardId === null : r.cardId === cardId)),
      ),
    [monthRows, service, cardId],
  );
  const visible = useMemo(() => scoped.filter((r) => TAB_MATCH[tab](r.status)), [scoped, tab]);

  const totals = useMemo(() => {
    const paid: MoneyMap = {};
    const upcoming: MoneyMap = {};
    let check = 0;
    for (const r of scoped) {
      if (r.status === "paid") addMoney(paid, r.currency, r.amount);
      else if (r.status === "projected" || r.status === "scheduled")
        addMoney(upcoming, r.currency, r.amount);
      else if (r.status === "overdue") check++;
    }
    return { paid, upcoming, check };
  }, [scoped]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaymentRow[]>();
    for (const r of visible) map.set(r.date, [...(map.get(r.date) ?? []), r]);
    return [...map.entries()];
  }, [visible]);

  const editingPayment = form?.mode === "edit" ? data.payments.find((p) => p.id === form.id) : undefined;
  const deletingPayment = data.payments.find((p) => p.id === deleteId);
  const currentMonth = monthKey(today);

  function recordPreset(r: PaymentRow): PaymentPreset {
    return {
      subscriptionId: r.subscriptionId,
      serviceName: r.serviceName,
      cardId: r.cardId,
      amount: r.amount,
      currency: r.currency,
      date: r.date,
      status: "paid",
    };
  }

  return (
    <>
      <PageHeader
        title="결제 내역"
        description="실제로 결제된 내역과 앞으로 나갈 예정 금액을 구분해서 보여줘요."
        actions={
          <Button onClick={() => setForm({ mode: "new" })}>
            <Icon name="plus" className="h-[18px] w-[18px]" />
            결제 내역 추가
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-2xl bg-surface p-1">
          <IconButton icon="chevronLeft" label="이전 달" onClick={() => setMonth(shiftMonthKey(month, -1))} />
          <span className="min-w-[96px] text-center text-[15px] font-bold text-ink">
            {formatMonthLabel(month)}
          </span>
          <IconButton icon="chevronRight" label="다음 달" onClick={() => setMonth(shiftMonthKey(month, 1))} />
        </div>
        {month !== currentMonth && (
          <Button variant="ghost" size="sm" onClick={() => setMonth(currentMonth)}>
            이번 달로
          </Button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-sm font-medium text-muted">결제 완료</p>
          <p className="tabular mt-1 text-xl font-bold text-ink">{formatMoneyMap(totals.paid)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted">결제 예정</p>
          <p className="tabular mt-1 text-xl font-bold text-ink">{formatMoneyMap(totals.upcoming)}</p>
        </Card>
      </div>

      {totals.check > 0 && (
        <div className="mb-4">
          <Notice tone="warn">
            예정일이 지났지만 결제 기록이 없는 건이 {totals.check}건 있어요. 실제로 결제됐다면{" "}
            <strong>&quot;결제 기록&quot;</strong>을 눌러 완료로 남겨 주세요. 자동으로 완료 처리하지는
            않아요.
          </Notice>
        </div>
      )}

      <div className="mb-4 space-y-3">
        <div className="overflow-x-auto">
          <Segmented<Tab>
            label="상태 필터"
            value={tab}
            onChange={setTab}
            options={[
              { value: "all", label: "전체" },
              { value: "paid", label: "완료" },
              { value: "upcoming", label: "예정" },
              { value: "check", label: "확인 필요" },
              { value: "problem", label: "실패·환불" },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            className={inputOnGrayClass}
            aria-label="서비스 필터"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="all">모든 서비스</option>
            {serviceNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            className={inputOnGrayClass}
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

      {grouped.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={`${formatMonthLabel(month)}에는 표시할 결제가 없어요`}
          description="다른 달을 선택하거나 필터를 바꿔 보세요. 직접 결제 내역을 추가할 수도 있어요."
          action={
            <Button variant="secondary" onClick={() => setForm({ mode: "new" })}>
              결제 내역 추가
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {grouped.map(([date, rows]) => (
            <Card key={date} className="p-4 pb-2">
              <h3 className="text-sm font-semibold text-muted">{formatKoDate(date, true)}</h3>
              <ul className="divide-y divide-fill">
                {rows.map((r) => (
                  <PaymentRowItem
                    key={r.key}
                    row={r}
                    cards={data.cards}
                    today={today}
                    showDate={false}
                    actions={
                      r.paymentId ? (
                        <span className="flex shrink-0">
                          <IconButton
                            icon="edit"
                            label="수정"
                            onClick={() => setForm({ mode: "edit", id: r.paymentId as string })}
                          />
                          <IconButton
                            icon="trash"
                            label="삭제"
                            onClick={() => setDeleteId(r.paymentId as string)}
                          />
                        </span>
                      ) : r.date <= today ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setForm({ mode: "new", preset: recordPreset(r) })}
                        >
                          결제 기록
                        </Button>
                      ) : null
                    }
                  />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {form?.mode === "new" && <PaymentForm preset={form.preset} onClose={() => setForm(null)} />}
      {form?.mode === "edit" && editingPayment && (
        <PaymentForm editing={editingPayment} onClose={() => setForm(null)} />
      )}
      {deletingPayment && (
        <ConfirmDialog
          title="결제 내역을 삭제할까요?"
          description={
            <>
              {formatKoDate(deletingPayment.date, true)} <strong>{deletingPayment.serviceName}</strong>{" "}
              결제 기록을 지워요. 이 앱의 기록만 지워지고 실제 결제에는 영향이 없어요.
            </>
          }
          confirmLabel="삭제"
          danger
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            actions.deletePayment(deletingPayment.id);
            setDeleteId(null);
            toast("결제 내역을 삭제했어요.", "info");
          }}
        />
      )}
    </>
  );
}
