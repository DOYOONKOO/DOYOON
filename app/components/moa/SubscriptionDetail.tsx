"use client";

import { useState, type ReactNode } from "react";
import {
  isTrialOverdue,
  monthlyEquivalent,
  nextBillingDate,
  paymentsOfSubscription,
} from "../../lib/moa/billing";
import { getService } from "../../lib/moa/catalog";
import { formatKoDate, relativeDayLabel } from "../../lib/moa/date";
import { formatMoney } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import {
  CATEGORY_LABELS,
  CYCLE_LABELS,
  PAYMENT_STATUS_LABELS,
  SOURCE_LABELS,
} from "../../lib/moa/types";
import { Icon } from "./icons";
import { cardLabel, cycleSuffix, subscriptionToInput } from "./parts";
import PaymentForm from "./PaymentForm";
import SubscriptionForm from "./SubscriptionForm";
import {
  Badge,
  Button,
  ConfirmDialog,
  Modal,
  Notice,
  ServiceAvatar,
  SubscriptionStatusBadge,
} from "./ui";

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

export default function SubscriptionDetail({
  subscriptionId,
  onClose,
}: {
  subscriptionId: string;
  onClose: () => void;
}) {
  const { data, today, actions, toast } = useApp();
  const [editing, setEditing] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [confirm, setConfirm] = useState<"end" | "delete" | null>(null);

  const sub = data.subscriptions.find((s) => s.id === subscriptionId);
  if (!sub) return null;

  const service = getService(sub.serviceId);
  const next = nextBillingDate(sub, today);
  const history = paymentsOfSubscription(data, sub.id);
  const trialOverdue = isTrialOverdue(sub, today);

  return (
    <>
      <Modal
        title="구독 상세"
        variant="drawer"
        onClose={onClose}
        footer={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(true)}>
              <Icon name="edit" className="h-4 w-4" />
              수정
            </Button>
            {sub.status !== "ended" && (
              <Button variant="secondary" className="flex-1" onClick={() => setConfirm("end")}>
                앱에서 종료 처리
              </Button>
            )}
            <Button variant="dangerSoft" onClick={() => setConfirm("delete")}>
              <Icon name="trash" className="h-4 w-4" />
              삭제
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-4">
          <ServiceAvatar name={sub.name} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-ink">{sub.name}</h3>
            <p className="truncate text-sm text-muted">
              {sub.planName || "요금제 미입력"} · {CATEGORY_LABELS[sub.category]}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <SubscriptionStatusBadge status={sub.status} />
              {sub.demo && <Badge>예시 데이터</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-canvas p-4">
          <p className="tabular text-3xl font-bold text-ink">
            {formatMoney(sub.amount, sub.currency)}{" "}
            <span className="text-base font-semibold text-muted">{cycleSuffix(sub.cycle)}</span>
          </p>
          {sub.cycle === "yearly" && (
            <p className="tabular mt-1 text-sm text-muted">
              월 환산 약 {formatMoney(monthlyEquivalent(sub), sub.currency)} (실제 청구액은 연 1회)
            </p>
          )}
        </div>

        <dl className="mt-3 divide-y divide-line">
          <InfoRow label={sub.status === "trial" ? "체험 종료 · 첫 결제일" : "다음 결제일"}>
            {sub.status === "trial" ? (
              <>
                {formatKoDate(sub.firstBillingDate, true)}
                <span className="block text-[13px] font-medium text-muted">
                  {relativeDayLabel(sub.firstBillingDate, today)}
                </span>
              </>
            ) : next ? (
              <>
                {formatKoDate(next, true)}
                <span className="block text-[13px] font-medium text-muted">
                  {relativeDayLabel(next, today)}
                </span>
              </>
            ) : sub.status === "ended" ? (
              "결제 예정 없음"
            ) : (
              "이용 종료 전 예정된 결제 없음"
            )}
          </InfoRow>
          {sub.endDate && (
            <InfoRow label={sub.status === "ended" ? "종료일" : "마지막 이용일"}>
              {formatKoDate(sub.endDate, true)}
            </InfoRow>
          )}
          <InfoRow label="결제 주기">{CYCLE_LABELS[sub.cycle]}</InfoRow>
          <InfoRow label="결제 카드">{cardLabel(data.cards, sub.cardId)}</InfoRow>
          <InfoRow label="가입 경로">{SOURCE_LABELS[sub.source]}</InfoRow>
          <InfoRow label="메모">{sub.memo || <span className="text-muted">없음</span>}</InfoRow>
        </dl>

        {trialOverdue && (
          <div className="mt-3">
            <Notice tone="warn">
              무료체험 종료일이 지났어요. 유료로 전환됐는지 확인하고 상태를 바꿔 주세요.
            </Notice>
          </div>
        )}

        <div className="mt-4">
          <Notice>
            이 앱에서 상태를 바꾸는 건 <strong>내 기록을 정리하는 것</strong>이에요. 실제 서비스는
            해지되지 않으니, 해지는 {service ? `${service.name} 공식 사이트` : "해당 서비스"}에서
            직접 해 주세요.
          </Notice>
          {service && (
            <a
              href={service.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong hover:underline"
            >
              공식 사이트 열기 <Icon name="external" className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-base font-bold text-ink">결제 이력</h4>
            <Button variant="ghost" size="sm" onClick={() => setAddingPayment(true)}>
              <Icon name="plus" className="h-4 w-4" />
              결제 기록 추가
            </Button>
          </div>
          {history.length === 0 ? (
            <p className="rounded-xl bg-canvas px-4 py-6 text-center text-sm text-muted">
              아직 기록된 결제가 없어요. 결제가 되면 &quot;결제 기록 추가&quot;로 남겨 보세요.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {history.slice(0, 12).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{formatKoDate(p.date, true)}</p>
                    <p className="truncate text-[13px] text-muted">
                      {cardLabel(data.cards, p.cardId)}
                      {p.memo && ` · ${p.memo}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-sm font-bold text-ink">
                      {formatMoney(p.amount, p.currency)}
                    </p>
                    <p className="text-[13px] text-muted">{PAYMENT_STATUS_LABELS[p.status]}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {history.length > 12 && (
            <p className="mt-2 text-center text-[13px] text-muted">
              최근 12건만 보여요. 전체는 결제 내역 화면에서 확인하세요.
            </p>
          )}
        </div>
      </Modal>

      {editing && <SubscriptionForm editing={sub} onClose={() => setEditing(false)} />}
      {addingPayment && (
        <PaymentForm
          preset={{
            subscriptionId: sub.id,
            serviceName: sub.name,
            cardId: sub.cardId,
            amount: sub.amount,
            currency: sub.currency,
          }}
          onClose={() => setAddingPayment(false)}
        />
      )}

      {confirm === "end" && (
        <ConfirmDialog
          title="이 앱에서 종료로 표시할까요?"
          description={
            <>
              모아구독 안에서 <strong>{sub.name}</strong> 구독을 &quot;종료&quot;로 바꾸고 앞으로의
              결제 예정에서 뺄게요. <strong>실제 서비스 해지는 아니에요.</strong> 아직 해지하지 않았다면
              공식 사이트에서 직접 해지해야 요금이 멈춰요.
            </>
          }
          confirmLabel="종료로 표시"
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            actions.updateSubscription(sub.id, {
              ...subscriptionToInput(sub),
              status: "ended",
              endDate: sub.endDate ?? today,
            });
            setConfirm(null);
            toast("이 앱에서 종료로 표시했어요. 실제 해지는 공식 사이트에서 해 주세요.", "info");
          }}
        />
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          title="구독을 삭제할까요?"
          description={
            <>
              내 구독 목록에서 <strong>{sub.name}</strong> 구독을 삭제해요. 이미 기록된 결제
              내역은 남아요. 이 앱의 기록만 지워지고 실제 구독은 그대로예요.
            </>
          }
          confirmLabel="삭제"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            actions.deleteSubscription(sub.id);
            setConfirm(null);
            toast("구독을 삭제했어요.", "info");
            onClose();
          }}
        />
      )}
    </>
  );
}
