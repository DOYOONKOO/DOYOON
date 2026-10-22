"use client";

import { useState } from "react";
import { computeStats } from "../../lib/moa/billing";
import { formatMoney } from "../../lib/moa/money";
import { useApp } from "../../lib/moa/store";
import { Button, Card, ConfirmDialog, Field, Notice, PageHeader, ProgressBar, cn, inputClass } from "./ui";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-[15px] font-semibold text-ink">{label}</p>
        {description && <p className="text-[13px] text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-[#d9d5cc]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsView() {
  const { data, today, isDemo, actions, toast } = useApp();
  const { settings } = data;
  const [budgetInput, setBudgetInput] = useState(
    settings.monthlyBudget === null ? "" : String(settings.monthlyBudget),
  );
  const [budgetError, setBudgetError] = useState("");
  const [confirm, setConfirm] = useState<"loadDemo" | "reset" | null>(null);

  const stats = computeStats(data, today);
  const krwMonthly = stats.monthlyCost.KRW ?? 0;
  const budget = settings.monthlyBudget;

  function saveBudget() {
    const trimmed = budgetInput.trim();
    if (trimmed === "") {
      actions.updateSettings({ monthlyBudget: null });
      setBudgetError("");
      toast("예산을 해제했어요.", "info");
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) {
      setBudgetError("0보다 큰 금액을 입력해 주세요.");
      return;
    }
    actions.updateSettings({ monthlyBudget: Math.round(n) });
    setBudgetError("");
    toast("월 예산을 저장했어요.");
  }

  return (
    <>
      <PageHeader title="설정" description="예산과 알림, 데이터를 관리해요." />

      <div className="space-y-5">
        <Card>
          <h2 className="text-base font-bold text-ink">월 구독 예산</h2>
          <p className="mt-1 text-sm text-muted">
            원화 구독의 월 환산 구독료와 비교해서 보여줘요. 외화 구독은 환율 없이 합산하지 않아
            제외돼요.
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-2">
            <div className="min-w-[180px] flex-1">
              <Field label="월 예산 (원)" error={budgetError}>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="예: 150000"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && saveBudget()}
                />
              </Field>
            </div>
            <Button className="mt-[26px]" onClick={saveBudget}>
              저장
            </Button>
          </div>
          {budget !== null && (
            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="text-muted">월 환산 구독료 (원화)</span>
                <span className="tabular font-semibold text-ink">
                  {formatMoney(krwMonthly, "KRW")} / {formatMoney(budget, "KRW")}
                </span>
              </div>
              <ProgressBar ratio={krwMonthly / budget} over={krwMonthly > budget} />
              <p className="mt-2 text-[13px] text-muted">
                {krwMonthly > budget
                  ? `예산을 ${formatMoney(krwMonthly - budget, "KRW")} 넘었어요.`
                  : `예산까지 ${formatMoney(budget - krwMonthly, "KRW")} 남았어요. (${Math.round((krwMonthly / budget) * 100)}% 사용)`}
              </p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-bold text-ink">결제 전 알림</h2>
          <div className="mt-3">
            <Notice>
              알림 설정 화면만 먼저 만들어 두었어요. <strong>지금은 알림이 실제로 발송되지 않아요.</strong>{" "}
              설정값만 이 브라우저에 저장돼요.
            </Notice>
          </div>
          <div className="mt-2 divide-y divide-line">
            <Toggle
              label="결제 예정 알림"
              description="결제일이 가까워지면 알려줄 예정이에요."
              checked={settings.alertPayment}
              onChange={(v) => actions.updateSettings({ alertPayment: v })}
            />
            <div className="py-3">
              <Field label="알림 시점">
                <select
                  className={inputClass}
                  value={settings.alertDaysBefore}
                  disabled={!settings.alertPayment}
                  onChange={(e) =>
                    actions.updateSettings({
                      alertDaysBefore: Number(e.target.value) as 1 | 3 | 7,
                    })
                  }
                >
                  <option value={1}>결제 1일 전</option>
                  <option value={3}>결제 3일 전</option>
                  <option value={7}>결제 7일 전</option>
                </select>
              </Field>
            </div>
            <Toggle
              label="무료체험 종료 알림"
              description="체험이 끝나기 전에 알려줄 예정이에요."
              checked={settings.alertTrialEnd}
              onChange={(v) => actions.updateSettings({ alertTrialEnd: v })}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-ink">데이터</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            입력한 내용은 로그인한 내 계정에 저장돼요(Supabase DB). 같은 계정으로 로그인하면 다른
            기기에서도 볼 수 있고, 다른 사람은 볼 수 없어요. 아래 버튼으로 지운 데이터는 되돌릴 수
            없어요.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => (isDemo ? setConfirm("loadDemo") : (actions.loadDemo(), toast("예시 데이터를 불러왔어요.", "info")))}
            >
              예시 데이터 {isDemo ? "다시 불러오기" : "불러오기"}
            </Button>
            {isDemo && (
              <Button
                variant="secondary"
                onClick={() => {
                  actions.clearDemo();
                  toast("예시 데이터를 지웠어요.", "info");
                }}
              >
                예시 데이터만 지우기
              </Button>
            )}
            <Button variant="dangerSoft" onClick={() => setConfirm("reset")}>
              모든 데이터 지우고 빈 상태로
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-ink">아직 연결되지 않은 기능</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {[
              "카드사·마이데이터 연동으로 결제 내역 자동 가져오기",
              "공식 서비스 API 연동 (가입·해지·실시간 요금)",
              "실제 알림 발송 (이메일·푸시)",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-accent">•</span>
                {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {confirm === "loadDemo" && (
        <ConfirmDialog
          title="예시 데이터를 다시 불러올까요?"
          description="기존 예시 데이터는 새 예시 데이터로 바뀌어요. 직접 추가한 내용은 그대로 남아요."
          confirmLabel="다시 불러오기"
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            actions.loadDemo();
            setConfirm(null);
            toast("예시 데이터를 불러왔어요.", "info");
          }}
        />
      )}
      {confirm === "reset" && (
        <ConfirmDialog
          title="모든 데이터를 지울까요?"
          description="구독, 결제 내역, 결제 수단, 관심 목록, 설정이 모두 지워지고 빈 상태로 시작해요. 되돌릴 수 없어요."
          confirmLabel="모두 지우기"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            actions.resetAll();
            setBudgetInput("");
            setConfirm(null);
            toast("모든 데이터를 지웠어요.", "info");
          }}
        />
      )}
    </>
  );
}
