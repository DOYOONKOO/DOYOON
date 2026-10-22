"use client";

import { useMemo, useState } from "react";
import { getPlan, getService, listServices, lowestMonthlyPrice, PRICE_DISCLAIMER } from "../../lib/moa/catalog";
import { formatMoney } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import {
  CATALOG_CATEGORIES,
  CATEGORY_LABELS,
  CYCLE_LABELS,
  type CatalogCategoryId,
  type WishlistItem,
} from "../../lib/moa/types";
import { Icon } from "./icons";
import ServiceDetail, { SignupCheckDialog } from "./ServiceDetail";
import SubscriptionForm, { type SubscriptionPreset } from "./SubscriptionForm";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  PageHeader,
  Segmented,
  ServiceAvatar,
  cn,
  inputOnGrayClass,
} from "./ui";

type Tab = "browse" | "wishlist";

function WishlistTab({ onBrowse }: { onBrowse: () => void }) {
  const { data, actions, toast } = useApp();
  const [signupFor, setSignupFor] = useState<WishlistItem | null>(null);
  const [register, setRegister] = useState<SubscriptionPreset | null>(null);
  const [removing, setRemoving] = useState<WishlistItem | null>(null);

  if (data.wishlist.length === 0) {
    return (
      <EmptyState
        icon="heart"
        title="관심 목록이 비어 있어요"
        description="가입을 고민 중인 서비스를 담아두면 이용 중인 구독과 따로 모아볼 수 있어요."
        action={<Button onClick={onBrowse}>서비스 둘러보기</Button>}
      />
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted">
        가입을 검토 중인 서비스예요. 아직 이용 중인 구독이 아니라서 월 구독료에 포함되지 않아요.
      </p>
      <ul className="space-y-3">
        {data.wishlist.map((w) => {
          const service = getService(w.serviceId);
          if (!service) return null;
          const plan = getPlan(w.planId);
          const price = plan?.prices[w.cycle];
          return (
            <li key={w.id} className="rounded-3xl bg-surface p-5">
              <div className="flex items-center gap-3">
                <ServiceAvatar name={service.name} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
                    <span className="truncate">{service.name}</span>
                    {w.demo && <Badge>예시</Badge>}
                  </p>
                  <p className="tabular truncate text-[13px] text-muted">
                    {plan
                      ? `${plan.name} · ${CYCLE_LABELS[w.cycle]}${price !== undefined ? ` ${formatMoney(price, plan.currency)} (예시)` : ""}`
                      : "요금제 미선택"}
                  </p>
                </div>
                <IconButton icon="trash" label="관심 목록에서 빼기" onClick={() => setRemoving(w)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    window.open(service.officialUrl, "_blank", "noopener,noreferrer");
                    setSignupFor(w);
                  }}
                >
                  공식 사이트에서 가입 <Icon name="external" className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setRegister({
                      serviceId: w.serviceId,
                      planId: w.planId ?? undefined,
                      cycle: w.cycle,
                      source: "explore",
                    })
                  }
                >
                  이미 이용 중 · 등록
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[13px] text-muted">{PRICE_DISCLAIMER}</p>

      {signupFor && (
        <SignupCheckDialog
          serviceName={getService(signupFor.serviceId)?.name ?? ""}
          onClose={() => setSignupFor(null)}
          onRegistered={() => {
            setRegister({
              serviceId: signupFor.serviceId,
              planId: signupFor.planId ?? undefined,
              cycle: signupFor.cycle,
              source: "official",
            });
            setSignupFor(null);
          }}
        />
      )}
      {register && <SubscriptionForm preset={register} onClose={() => setRegister(null)} />}
      {removing && (
        <ConfirmDialog
          title="관심 목록에서 뺄까요?"
          description={<>관심 목록에서 &quot;{getService(removing.serviceId)?.name}&quot; 항목을 빼요.</>}
          confirmLabel="빼기"
          danger
          onClose={() => setRemoving(null)}
          onConfirm={() => {
            actions.removeWishlist(removing.id);
            setRemoving(null);
            toast("관심 목록에서 뺐어요.", "info");
          }}
        />
      )}
    </>
  );
}

export default function ExploreView() {
  const { data } = useApp();
  const [tab, setTab] = useState<Tab>("browse");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CatalogCategoryId | "all">("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const services = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listServices().filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.features.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const usingIds = new Set(
    data.subscriptions.filter((s) => s.status !== "ended").map((s) => s.serviceId),
  );
  const wishIds = new Set(data.wishlist.map((w) => w.serviceId));

  return (
    <>
      <PageHeader
        title="서비스 둘러보기"
        description="새로운 구독 서비스를 찾아보고, 요금제를 비교해 보세요."
      />

      <div className="mb-4">
        <Segmented<Tab>
          label="보기"
          value={tab}
          onChange={setTab}
          options={[
            { value: "browse", label: "탐색", icon: "compass" },
            { value: "wishlist", label: `관심 목록 ${data.wishlist.length}`, icon: "heart" },
          ]}
        />
      </div>

      {tab === "wishlist" ? (
        <WishlistTab onBrowse={() => setTab("browse")} />
      ) : (
        <>
          <div className="relative mb-3">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              className={cn(inputOnGrayClass, "pl-10")}
              placeholder="서비스명이나 기능으로 검색"
              aria-label="서비스 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
            {(["all", ...CATALOG_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                  category === c
                    ? "bg-ink text-white"
                    : "bg-surface text-body hover:bg-fill-strong",
                )}
              >
                {c === "all" ? "전체" : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {services.length === 0 ? (
            <EmptyState
              icon="search"
              title="검색 결과가 없어요"
              description="다른 검색어를 입력하거나 카테고리를 바꿔 보세요. 목록에 없는 서비스는 '내 구독'에서 직접 추가할 수 있어요."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                >
                  검색 초기화
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((s) => {
                const low = lowestMonthlyPrice(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setDetailId(s.id)}
                      className="flex h-full w-full flex-col rounded-3xl bg-surface p-6 text-left transition-transform active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3">
                        <ServiceAvatar name={s.name} />
                        <div className="min-w-0 flex-1">
                          <p className="break-keep text-base font-bold leading-snug text-ink">
                            {s.name}
                          </p>
                          <p className="text-[13px] text-muted">{CATEGORY_LABELS[s.category]}</p>
                        </div>
                        {usingIds.has(s.id) ? (
                          <Badge tone="ok">이용 중</Badge>
                        ) : wishIds.has(s.id) ? (
                          <Badge tone="accent">관심</Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-ink">{s.tagline}</p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {s.features.slice(0, 2).map((f) => (
                          <li
                            key={f}
                            className="rounded-full bg-fill px-2.5 py-1 text-xs font-medium text-muted"
                          >
                            {f}
                          </li>
                        ))}
                      </ul>
                      {low && (
                        <p className="tabular mt-4 border-t border-fill pt-3 text-sm text-muted">
                          <strong className="text-base font-bold text-ink">
                            월 {formatMoney(low.amount, low.currency)}
                          </strong>{" "}
                          부터 · 예시 요금
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-5 text-[13px] text-muted">{PRICE_DISCLAIMER}</p>
        </>
      )}

      {detailId && <ServiceDetail serviceId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
