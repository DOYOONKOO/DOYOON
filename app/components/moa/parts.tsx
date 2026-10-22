"use client";

import type { ReactNode } from "react";
import { relativeDayLabel, formatKoDate, type ISODate } from "../../lib/moa/date";
import type { PaymentRow } from "../../lib/moa/billing";
import { formatMoney } from "../../lib/moa/money";
import type { Card, Cycle, Subscription } from "../../lib/moa/types";
import { RowStatusBadge, ServiceAvatar } from "./ui";

export function cardLabel(cards: Card[], cardId: string | null) {
  const card = cards.find((c) => c.id === cardId);
  return card ? `${card.nickname} ···${card.last4}` : "카드 미지정";
}

export function cycleSuffix(cycle: Cycle) {
  return cycle === "yearly" ? "/ 년" : "/ 월";
}

export function subscriptionToInput(sub: Subscription) {
  // id, createdAt, demo 를 뺀 값 (수정 액션 입력용)
  const { id: _id, createdAt: _createdAt, demo: _demo, ...input } = sub;
  void _id;
  void _createdAt;
  void _demo;
  return input;
}

export function PaymentRowItem({
  row,
  cards,
  today,
  actions,
  showRelative = false,
  showDate = true,
}: {
  row: PaymentRow;
  cards: Card[];
  today: ISODate;
  actions?: ReactNode;
  showRelative?: boolean;
  showDate?: boolean;
}) {
  return (
    <li className="flex items-center gap-3.5 py-3">
      <ServiceAvatar name={row.serviceName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-ink">{row.serviceName}</p>
        <p className="truncate text-[13px] text-subtle">
          {showDate && formatKoDate(row.date)}
          {showRelative && ` · ${relativeDayLabel(row.date, today)}`}
          {(showDate || showRelative) && " · "}
          {cardLabel(cards, row.cardId)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="tabular text-base font-bold text-ink">
          {formatMoney(row.amount, row.currency)}
        </p>
        <RowStatusBadge status={row.status} />
      </div>
      {actions}
    </li>
  );
}
