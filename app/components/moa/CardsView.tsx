"use client";

import { useState } from "react";
import { cardSummary } from "../../lib/moa/billing";
import { useApp } from "../../lib/moa/store";
import type { Card as CardType } from "../../lib/moa/types";
import CardForm from "./CardForm";
import { Icon } from "./icons";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  MoneyView,
  Notice,
  PageHeader,
} from "./ui";

export default function CardsView() {
  const { data, actions, toast } = useApp();
  const [form, setForm] = useState<{ editing?: CardType } | null>(null);
  const [deleting, setDeleting] = useState<CardType | null>(null);

  const unassigned = cardSummary(data, null);

  const addButton = (
    <Button onClick={() => setForm({})}>
      <Icon name="plus" className="h-[18px] w-[18px]" />
      결제 수단 추가
    </Button>
  );

  return (
    <>
      <PageHeader
        title="결제 수단"
        description="구독 결제에 쓰는 카드를 관리용으로 등록해 두세요."
        actions={addButton}
      />

      <div className="mb-5">
        <Notice>
          여기에 등록하는 카드는 <strong>정리용 정보</strong>예요. 실제 카드사나 결제수단과 연결되지
          않고, 카드번호 전체·CVC·비밀번호는 입력받지 않아요.
        </Notice>
      </div>

      {data.cards.length === 0 ? (
        <EmptyState
          icon="card"
          title="등록한 결제 수단이 없어요"
          description="카드 별칭과 끝 4자리만 등록하면, 카드별로 나가는 구독료를 모아 볼 수 있어요."
          action={addButton}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.cards.map((c) => {
            const summary = cardSummary(data, c.id);
            return (
              <li key={c.id}>
                <Card className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-base font-bold text-ink">
                        <span className="truncate">{c.nickname}</span>
                        {c.demo && <Badge>예시</Badge>}
                      </p>
                      <p className="tabular mt-0.5 text-sm text-muted">
                        {c.issuer} ···{c.last4}
                      </p>
                    </div>
                    <span className="flex shrink-0">
                      <IconButton icon="edit" label="수정" onClick={() => setForm({ editing: c })} />
                      <IconButton icon="trash" label="삭제" onClick={() => setDeleting(c)} />
                    </span>
                  </div>
                  <dl className="mt-4 space-y-2 border-t border-fill pt-4 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted">연결된 구독</dt>
                      <dd className="font-bold text-ink">{summary.count}개</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted">월 환산 구독료</dt>
                      <dd className="text-right text-ink">
                        <MoneyView map={summary.monthly} className="text-base" />
                      </dd>
                    </div>
                  </dl>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {unassigned.count > 0 && (
        <p className="mt-4 text-sm text-muted">
          카드를 지정하지 않은 구독이 {unassigned.count}개 있어요. 내 구독에서 결제 카드를 골라 주세요.
        </p>
      )}

      {form && <CardForm editing={form.editing} onClose={() => setForm(null)} />}
      {deleting && (
        <ConfirmDialog
          title="결제 수단을 삭제할까요?"
          description={
            <>
              <strong>{deleting.nickname}</strong> 결제 수단을 삭제해요. 이 카드에 연결된 구독과
              결제 내역은 지워지지 않고 &quot;카드 미지정&quot;으로 바뀌어요.
            </>
          }
          confirmLabel="삭제"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            actions.deleteCard(deleting.id);
            setDeleting(null);
            toast("결제 수단을 삭제했어요.", "info");
          }}
        />
      )}
    </>
  );
}
