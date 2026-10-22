"use client";

import { useState } from "react";
import { nextBillingDate } from "../../lib/moa/billing";
import {
  defaultCycleFor,
  getPlan,
  getService,
  listPlans,
  listServices,
} from "../../lib/moa/catalog";
import { isValidISO, type ISODate } from "../../lib/moa/date";
import { CURRENCIES } from "../../lib/moa/money";
import { useApp, type SubscriptionInput } from "../../lib/moa/store";
import {
  CATEGORY_LABELS,
  CYCLE_LABELS,
  SOURCE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type CategoryId,
  type Currency,
  type Cycle,
  type Source,
  type Subscription,
  type SubscriptionStatus,
} from "../../lib/moa/types";
import { Button, Field, Modal, Notice, inputClass, textareaClass } from "./ui";

export interface SubscriptionPreset {
  serviceId?: string;
  planId?: string;
  cycle?: Cycle;
  status?: SubscriptionStatus;
  source?: Source;
}

interface Draft {
  serviceId: string; // "" = 직접 입력
  name: string;
  category: CategoryId;
  planId: string; // "" = 직접 입력
  planName: string;
  amount: string;
  currency: Currency;
  cycle: Cycle;
  status: SubscriptionStatus;
  billingDate: string;
  endDate: string;
  cardId: string;
  memo: string;
  source: Source;
}

function makeDraft(
  editing: Subscription | undefined,
  preset: SubscriptionPreset | undefined,
  today: ISODate,
): Draft {
  if (editing) {
    const billingDate =
      editing.status === "trial" || editing.status === "ended"
        ? editing.firstBillingDate
        : (nextBillingDate(editing, today) ?? editing.firstBillingDate);
    return {
      serviceId: editing.serviceId ?? "",
      name: editing.name,
      category: editing.category,
      planId: editing.planId ?? "",
      planName: editing.planId ? "" : editing.planName,
      amount: String(editing.amount),
      currency: editing.currency,
      cycle: editing.cycle,
      status: editing.status,
      billingDate,
      endDate: editing.endDate ?? "",
      cardId: editing.cardId ?? "",
      memo: editing.memo,
      source: editing.source,
    };
  }

  const base: Draft = {
    serviceId: "",
    name: "",
    category: "etc",
    planId: "",
    planName: "",
    amount: "",
    currency: "KRW",
    cycle: preset?.cycle ?? "monthly",
    status: preset?.status ?? "active",
    billingDate: today,
    endDate: "",
    cardId: "",
    memo: "",
    source: preset?.source ?? "direct",
  };

  const service = getService(preset?.serviceId);
  if (!service) return base;
  const plan = getPlan(preset?.planId) ?? listPlans(service.id)[0];
  const cycle: Cycle =
    preset?.cycle && plan?.prices[preset.cycle] !== undefined
      ? preset.cycle
      : plan
        ? defaultCycleFor(plan)
        : "monthly";
  return {
    ...base,
    serviceId: service.id,
    name: service.name,
    category: service.category,
    planId: plan?.id ?? "",
    cycle,
    amount: plan ? String(plan.prices[cycle] ?? "") : "",
    currency: plan?.currency ?? "KRW",
  };
}

const STATUS_OPTIONS: SubscriptionStatus[] = ["active", "trial", "ending", "ended"];

export default function SubscriptionForm({
  editing,
  preset,
  onClose,
  onSaved,
}: {
  editing?: Subscription;
  preset?: SubscriptionPreset;
  onClose: () => void;
  onSaved?: (sub: Subscription) => void;
}) {
  const { data, today, actions, toast } = useApp();
  const [draft, setDraft] = useState<Draft>(() => makeDraft(editing, preset, today));
  const [initialBilling] = useState(draft.billingDate);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const service = getService(draft.serviceId);
  const plans = draft.serviceId ? listPlans(draft.serviceId) : [];
  const selectedPlan = getPlan(draft.planId);

  const duplicate =
    !editing &&
    draft.serviceId !== "" &&
    data.subscriptions.find((s) => s.serviceId === draft.serviceId && s.status !== "ended");

  function handleService(id: string) {
    const svc = getService(id);
    if (!svc) {
      setDraft((d) => ({ ...d, serviceId: "", planId: "" }));
      return;
    }
    const plan = listPlans(id)[0];
    const cycle = plan ? defaultCycleFor(plan) : "monthly";
    setDraft((d) => ({
      ...d,
      serviceId: id,
      name: svc.name,
      category: svc.category,
      planId: plan?.id ?? "",
      planName: "",
      cycle,
      amount: plan ? String(plan.prices[cycle] ?? "") : "",
      currency: plan?.currency ?? d.currency,
    }));
  }

  function handlePlan(id: string) {
    const plan = getPlan(id);
    if (!plan) {
      setDraft((d) => ({ ...d, planId: "" }));
      return;
    }
    setDraft((d) => {
      const cycle = plan.prices[d.cycle] !== undefined ? d.cycle : defaultCycleFor(plan);
      return {
        ...d,
        planId: id,
        planName: "",
        cycle,
        amount: String(plan.prices[cycle] ?? ""),
        currency: plan.currency,
      };
    });
  }

  function handleCycle(cycle: Cycle) {
    setDraft((d) => {
      const price = getPlan(d.planId)?.prices[cycle];
      return { ...d, cycle, amount: price !== undefined ? String(price) : d.amount };
    });
  }

  const amountNumber = Number(draft.amount);
  const errors = {
    name: draft.name.trim() === "" ? "서비스 이름을 입력해 주세요." : "",
    amount:
      draft.amount.trim() === "" || !Number.isFinite(amountNumber) || amountNumber <= 0
        ? "금액을 0보다 크게 입력해 주세요."
        : "",
    billingDate: isValidISO(draft.billingDate) ? "" : "날짜를 선택해 주세요.",
    endDate:
      (draft.status === "ending" || draft.status === "ended") && !isValidISO(draft.endDate)
        ? "마지막으로 이용하는 날짜를 선택해 주세요."
        : "",
  };
  const hasError = Object.values(errors).some(Boolean);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (hasError) return;

    const input: SubscriptionInput = {
      serviceId: draft.serviceId || null,
      name: draft.name.trim(),
      category: draft.category,
      planId: draft.planId || null,
      planName: selectedPlan ? selectedPlan.name : draft.planName.trim(),
      amount: amountNumber,
      currency: draft.currency,
      cycle: draft.cycle,
      // 날짜를 건드리지 않았다면 원래 기준일을 유지한다 (말일 결제 보정이 깨지지 않도록)
      firstBillingDate:
        editing && draft.billingDate === initialBilling
          ? editing.firstBillingDate
          : draft.billingDate,
      status: draft.status,
      endDate:
        draft.status === "ending" || draft.status === "ended" ? draft.endDate : null,
      cardId: draft.cardId || null,
      memo: draft.memo.trim(),
      source: draft.source,
    };

    if (editing) {
      actions.updateSubscription(editing.id, input);
      toast("구독 정보를 수정했어요.");
      onClose();
    } else {
      const movedFromWishlist =
        input.serviceId !== null && data.wishlist.some((w) => w.serviceId === input.serviceId);
      const created = actions.addSubscription(input);
      toast(
        movedFromWishlist
          ? "내 구독에 등록했어요. 관심 목록에서는 뺐어요."
          : "내 구독에 등록했어요.",
      );
      onSaved?.(created);
      onClose();
    }
  }

  const billingLabel =
    draft.status === "trial"
      ? "무료체험 종료일 (첫 결제일)"
      : draft.status === "ended"
        ? "마지막 결제일 (기준일)"
        : "다음 결제일";

  const show = (msg: string) => (submitted ? msg : "");

  return (
    <Modal
      title={editing ? "구독 수정" : "구독 추가"}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="neutral" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="subscription-form" className="flex-[2]">
            {editing ? "저장하기" : duplicate ? "그래도 추가하기" : "추가하기"}
          </Button>
        </div>
      }
    >
      <form id="subscription-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {duplicate && (
          <Notice tone="warn">
            이미 이용 중으로 등록한 <strong>{duplicate.name}</strong> 구독이 있어요
            {duplicate.planName ? ` (${duplicate.planName})` : ""}. 다른 계정이나 다른 요금제를
            따로 쓰는 게 아니라면 기존 구독을 수정하는 게 좋아요.
          </Notice>
        )}

        <Field label="서비스">
          <select
            className={inputClass}
            value={draft.serviceId}
            onChange={(e) => handleService(e.target.value)}
            disabled={!!editing && !!editing.serviceId}
          >
            <option value="">직접 입력</option>
            {listServices().map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="서비스 이름" error={show(errors.name)}>
          <input
            className={inputClass}
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="예: 동네 헬스장"
            maxLength={40}
            disabled={!!service}
          />
        </Field>

        {!service && (
          <Field label="카테고리">
            <select
              className={inputClass}
              value={draft.category}
              onChange={(e) => set("category", e.target.value as CategoryId)}
            >
              {(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
        )}

        {service ? (
          <Field label="요금제" hint="요금제 가격은 예시예요. 실제로 내는 금액은 아래에서 수정할 수 있어요.">
            <select
              className={inputClass}
              value={draft.planId}
              onChange={(e) => handlePlan(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.summary}
                </option>
              ))}
              <option value="">직접 입력</option>
            </select>
          </Field>
        ) : null}

        {!selectedPlan && (
          <Field label="요금제 이름 (선택)">
            <input
              className={inputClass}
              value={draft.planName}
              onChange={(e) => set("planName", e.target.value)}
              placeholder="예: 월 회원권"
              maxLength={30}
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="결제 주기">
            <select
              className={inputClass}
              value={draft.cycle}
              onChange={(e) => handleCycle(e.target.value as Cycle)}
            >
              {(Object.keys(CYCLE_LABELS) as Cycle[]).map((c) => (
                <option
                  key={c}
                  value={c}
                  disabled={!!selectedPlan && selectedPlan.prices[c] === undefined}
                >
                  {CYCLE_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="통화">
            <select
              className={inputClass}
              value={draft.currency}
              onChange={(e) => set("currency", e.target.value as Currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c === "KRW" ? "원 (KRW)" : "달러 (USD)"}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label={`실제 결제 금액 (${draft.cycle === "yearly" ? "연" : "월"})`}
          error={show(errors.amount)}
        >
          <input
            className={inputClass}
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) => set("amount", e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
          />
        </Field>

        <Field label="상태">
          <select
            className={inputClass}
            value={draft.status}
            onChange={(e) => set("status", e.target.value as SubscriptionStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {SUBSCRIPTION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={billingLabel}
          error={show(errors.billingDate)}
          hint={
            draft.status === "trial"
              ? "이 날짜부터 요금이 청구돼요."
              : "이 날짜를 기준으로 결제 주기마다 반복돼요. 31일 결제는 짧은 달에 말일로 계산돼요."
          }
        >
          <input
            type="date"
            className={inputClass}
            value={draft.billingDate}
            onChange={(e) => set("billingDate", e.target.value)}
          />
        </Field>

        {(draft.status === "ending" || draft.status === "ended") && (
          <Field
            label={draft.status === "ending" ? "마지막 이용일" : "종료일"}
            error={show(errors.endDate)}
            hint="이 날짜 이후의 결제는 예정에서 빠져요."
          >
            <input
              type="date"
              className={inputClass}
              value={draft.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
        )}

        {(draft.status === "ending" || draft.status === "ended") && (
          <Notice>
            여기서 상태를 바꿔도 <strong>실제 서비스는 해지되지 않아요.</strong> 해지는 해당
            서비스의 공식 사이트나 앱에서 직접 해야 해요.
          </Notice>
        )}

        <Field label="결제 카드">
          <select
            className={inputClass}
            value={draft.cardId}
            onChange={(e) => set("cardId", e.target.value)}
          >
            <option value="">카드 미지정</option>
            {data.cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nickname} · {c.issuer} ···{c.last4}
              </option>
            ))}
          </select>
        </Field>

        <Field label="가입 경로">
          <select
            className={inputClass}
            value={draft.source}
            onChange={(e) => set("source", e.target.value as Source)}
          >
            {(Object.keys(SOURCE_LABELS) as Source[]).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="메모 (선택)">
          <textarea
            className={textareaClass}
            rows={2}
            value={draft.memo}
            onChange={(e) => set("memo", e.target.value)}
            placeholder="예: 가족과 함께 사용, 연말까지만"
            maxLength={200}
          />
        </Field>
      </form>
    </Modal>
  );
}
