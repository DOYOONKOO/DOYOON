"use client";

import { useState } from "react";
import { isValidISO } from "../../lib/moa/date";
import { CURRENCIES } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import {
  PAYMENT_STATUS_LABELS,
  type Currency,
  type Payment,
  type PaymentStatus,
} from "../../lib/moa/types";
import { Button, Field, Modal, inputClass, textareaClass } from "./ui";

export interface PaymentPreset {
  subscriptionId?: string | null;
  serviceName?: string;
  cardId?: string | null;
  amount?: number;
  currency?: Currency;
  date?: string;
  status?: PaymentStatus;
}

const STATUSES: PaymentStatus[] = ["paid", "scheduled", "failed", "refunded"];

export default function PaymentForm({
  editing,
  preset,
  onClose,
}: {
  editing?: Payment;
  preset?: PaymentPreset;
  onClose: () => void;
}) {
  const { data, today, actions, toast } = useApp();

  const [subscriptionId, setSubscriptionId] = useState(
    editing?.subscriptionId ?? preset?.subscriptionId ?? "",
  );
  const [serviceName, setServiceName] = useState(
    editing?.serviceName ?? preset?.serviceName ?? "",
  );
  const [cardId, setCardId] = useState(editing?.cardId ?? preset?.cardId ?? "");
  const [amount, setAmount] = useState(
    String(editing?.amount ?? preset?.amount ?? ""),
  );
  const [currency, setCurrency] = useState<Currency>(
    editing?.currency ?? preset?.currency ?? "KRW",
  );
  const [date, setDate] = useState(editing?.date ?? preset?.date ?? today);
  const [status, setStatus] = useState<PaymentStatus>(
    editing?.status ?? preset?.status ?? "paid",
  );
  const [memo, setMemo] = useState(editing?.memo ?? "");
  const [submitted, setSubmitted] = useState(false);

  const linked = data.subscriptions.find((s) => s.id === subscriptionId);

  function handleSubscription(id: string) {
    setSubscriptionId(id);
    const sub = data.subscriptions.find((s) => s.id === id);
    if (sub) {
      setServiceName(sub.name);
      setAmount(String(sub.amount));
      setCurrency(sub.currency);
      setCardId(sub.cardId ?? "");
    }
  }

  const amountNumber = Number(amount);
  const errors = {
    name: (linked?.name ?? serviceName).trim() === "" ? "서비스를 선택하거나 입력해 주세요." : "",
    amount:
      amount.trim() === "" || !Number.isFinite(amountNumber) || amountNumber <= 0
        ? "금액을 0보다 크게 입력해 주세요."
        : "",
    date: isValidISO(date) ? "" : "날짜를 선택해 주세요.",
  };
  const hasError = Object.values(errors).some(Boolean);
  const show = (msg: string) => (submitted ? msg : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (hasError) return;
    const input = {
      subscriptionId: subscriptionId || null,
      serviceName: (linked?.name ?? serviceName).trim(),
      cardId: cardId || null,
      amount: amountNumber,
      currency,
      date,
      status,
      memo: memo.trim(),
    };
    if (editing) {
      actions.updatePayment(editing.id, input);
      toast("결제 내역을 수정했어요.");
    } else {
      actions.addPayment(input);
      toast("결제 내역을 추가했어요.");
    }
    onClose();
  }

  return (
    <Modal
      title={editing ? "결제 내역 수정" : "결제 내역 추가"}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="neutral" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="payment-form" className="flex-[2]">
            {editing ? "저장하기" : "추가하기"}
          </Button>
        </div>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="구독">
          <select
            className={inputClass}
            value={subscriptionId}
            onChange={(e) => handleSubscription(e.target.value)}
          >
            <option value="">구독과 연결하지 않음 (직접 입력)</option>
            {data.subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.planName ? ` · ${s.planName}` : ""}
              </option>
            ))}
          </select>
        </Field>

        {!linked && (
          <Field label="서비스 이름" error={show(errors.name)}>
            <input
              className={inputClass}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="예: 도서 정기구독"
              maxLength={40}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="금액" error={show(errors.amount)}>
            <input
              className={inputClass}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
            />
          </Field>
          <Field label="통화">
            <select
              className={inputClass}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c === "KRW" ? "원 (KRW)" : "달러 (USD)"}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="결제일" error={show(errors.date)}>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field label="처리 상태">
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as PaymentStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="결제 카드">
          <select
            className={inputClass}
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
          >
            <option value="">카드 미지정</option>
            {data.cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} · {c.issuer} ···{c.last4}
              </option>
            ))}
          </select>
        </Field>

        <Field label="메모 (선택)">
          <textarea
            className={textareaClass}
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={200}
          />
        </Field>
      </form>
    </Modal>
  );
}
