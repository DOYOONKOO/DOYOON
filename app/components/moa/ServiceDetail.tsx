"use client";

import { useState } from "react";
import { defaultCycleFor, getService, listPlans, PRICE_DISCLAIMER } from "../../lib/moa/catalog";
import { formatMoney } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import { CATEGORY_LABELS, CYCLE_LABELS, type Cycle } from "../../lib/moa/types";
import { Icon } from "./icons";
import SubscriptionForm, { type SubscriptionPreset } from "./SubscriptionForm";
import { Badge, Button, Modal, Notice, ServiceAvatar, cn } from "./ui";

/** 공식 사이트로 보낸 뒤, 가입을 마쳤는지 사용자가 직접 알려주는 확인창 */
export function SignupCheckDialog({
  serviceName,
  onRegistered,
  onWishlist,
  onClose,
}: {
  serviceName: string;
  onRegistered: () => void;
  onWishlist?: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title="공식 사이트에서 가입하셨나요?"
      onClose={onClose}
      top
      footer={
        <div className="flex flex-col gap-2">
          <Button onClick={onRegistered}>가입했어요 · 내 구독에 등록</Button>
          {onWishlist && (
            <Button variant="secondary" onClick={onWishlist}>
              아직이에요 · 관심 목록에 담기
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            나중에 할게요
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-[15px] leading-relaxed text-muted">
        <p>
          <strong className="text-ink">{serviceName}</strong> 공식 사이트를 새 탭으로 열었어요.
          가입과 결제는 공식 사이트에서 직접 진행해야 해요.
        </p>
        <Notice>
          모아구독은 가입 여부를 알 수 없어요. 가입을 마친 뒤에 &quot;가입했어요&quot;를 눌러야 내
          구독에 등록돼요.
        </Notice>
      </div>
    </Modal>
  );
}

export default function ServiceDetail({
  serviceId,
  onClose,
}: {
  serviceId: string;
  onClose: () => void;
}) {
  const { data, actions, toast } = useApp();
  const service = getService(serviceId);
  const plans = listPlans(serviceId);

  const wish = data.wishlist.find((w) => w.serviceId === serviceId);
  const using = data.subscriptions.find((s) => s.serviceId === serviceId && s.status !== "ended");

  const [planId, setPlanId] = useState(wish?.planId ?? plans[0]?.id ?? "");
  const [cycle, setCycle] = useState<Cycle>(() => {
    const initial = plans.find((p) => p.id === (wish?.planId ?? plans[0]?.id));
    if (wish && initial?.prices[wish.cycle] !== undefined) return wish.cycle;
    return initial ? defaultCycleFor(initial) : "monthly";
  });
  const [signupCheck, setSignupCheck] = useState(false);
  const [registerPreset, setRegisterPreset] = useState<SubscriptionPreset | null>(null);

  if (!service) return null;
  const plan = plans.find((p) => p.id === planId);
  const price = plan?.prices[cycle];

  function selectPlan(id: string) {
    setPlanId(id);
    const p = plans.find((x) => x.id === id);
    if (p && p.prices[cycle] === undefined) setCycle(defaultCycleFor(p));
  }

  function addToWishlist() {
    actions.addWishlist(serviceId, planId || null, cycle);
    toast(wish ? "관심 목록의 요금제를 바꿨어요." : "관심 목록에 담았어요.");
  }

  function openOfficial() {
    window.open(service!.officialUrl, "_blank", "noopener,noreferrer");
    setSignupCheck(true);
  }

  const presetBase: SubscriptionPreset = {
    serviceId,
    planId: planId || undefined,
    cycle,
  };

  return (
    <>
      <Modal title="서비스 상세" variant="drawer" onClose={onClose}>
        <div className="flex items-center gap-4">
          <ServiceAvatar name={service.name} size="lg" />
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-ink">{service.name}</h3>
            <p className="text-sm text-muted">{service.tagline}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge>{CATEGORY_LABELS[service.category]}</Badge>
              {using && <Badge tone="ok">이용 중</Badge>}
              {wish && <Badge tone="accent">관심 목록</Badge>}
            </div>
          </div>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-muted">{service.description}</p>

        <ul className="mt-3 space-y-1.5">
          {service.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm font-medium text-ink">
              <Icon name="check" className="h-4 w-4 text-accent" />
              {f}
            </li>
          ))}
        </ul>

        <h4 className="mb-2 mt-6 text-base font-bold text-ink">요금제 선택</h4>
        <div role="radiogroup" aria-label="요금제" className="space-y-2">
          {plans.map((p) => {
            const selected = p.id === planId;
            const shown = p.prices[cycle] ?? p.prices[defaultCycleFor(p)];
            const shownCycle = p.prices[cycle] !== undefined ? cycle : defaultCycleFor(p);
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectPlan(p.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-surface hover:bg-canvas",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-ink">{p.name}</span>
                  <span className="block text-[13px] text-muted">{p.summary}</span>
                </span>
                <span className="tabular shrink-0 text-right text-[15px] font-bold text-ink">
                  {formatMoney(shown as number, p.currency)}
                  <span className="block text-xs font-medium text-muted">
                    {shownCycle === "yearly" ? "/ 년" : "/ 월"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-muted">결제 주기</span>
          <div className="inline-flex rounded-xl border border-line bg-canvas p-1">
            {(Object.keys(CYCLE_LABELS) as Cycle[]).map((c) => {
              const available = plan?.prices[c] !== undefined;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cycle === c}
                  disabled={!available}
                  onClick={() => setCycle(c)}
                  className={cn(
                    "h-9 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    cycle === c ? "bg-surface text-ink shadow-sm" : "text-muted",
                  )}
                >
                  {CYCLE_LABELS[c]}
                </button>
              );
            })}
          </div>
        </div>
        {plan && price !== undefined && (
          <p className="tabular mt-3 text-right text-sm text-muted">
            선택한 요금{" "}
            <strong className="text-base text-ink">{formatMoney(price, plan.currency)}</strong>{" "}
            {cycle === "yearly" ? "/ 년" : "/ 월"}
          </p>
        )}

        <p className="mt-3 text-[13px] leading-relaxed text-muted">{PRICE_DISCLAIMER}</p>

        {using && (
          <div className="mt-4">
            <Notice tone="warn">
              이미 이용 중으로 등록한 <strong>{using.name}</strong> 구독이 있어요
              {using.planName ? ` (${using.planName})` : ""}. 같은 서비스를 또 등록하면 중복될 수
              있어요.
            </Notice>
          </div>
        )}
        {wish && !using && (
          <div className="mt-4">
            <Notice>이미 관심 목록에 있어요. 다시 담으면 선택한 요금제로 바뀌어요.</Notice>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={openOfficial}>
            공식 사이트에서 가입 <Icon name="external" className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={addToWishlist}>
            <Icon name="heart" className="h-4 w-4" />
            {wish ? "관심 목록 요금제 바꾸기" : "관심 목록에 담기"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setRegisterPreset({ ...presetBase, source: "explore" })}
          >
            이미 이용 중이에요 · 내 구독에 등록
          </Button>
        </div>
      </Modal>

      {signupCheck && (
        <SignupCheckDialog
          serviceName={service.name}
          onClose={() => setSignupCheck(false)}
          onRegistered={() => {
            setSignupCheck(false);
            setRegisterPreset({ ...presetBase, source: "official" });
          }}
          onWishlist={() => {
            setSignupCheck(false);
            addToWishlist();
          }}
        />
      )}

      {registerPreset && (
        <SubscriptionForm
          preset={registerPreset}
          onClose={() => setRegisterPreset(null)}
          onSaved={onClose}
        />
      )}
    </>
  );
}
