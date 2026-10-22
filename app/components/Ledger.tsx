"use client";

import { useState } from "react";
import ExpenseSheet from "./ExpenseSheet";
import {
  categoryInfo,
  formatDateLabel,
  formatWon,
  todayStr,
  type Expense,
} from "../lib/expense";

export default function Ledger() {
  // 저장하지 않음: 새로고침하면 사라지는 임시 데이터
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const monthKey = todayStr().slice(0, 7);
  const month = Number(monthKey.slice(5));
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(monthKey))
    .reduce((sum, e) => sum + e.amount, 0);

  const byDate = new Map<string, Expense[]>();
  for (const e of expenses) {
    byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  }
  const groups = [...byDate.entries()].sort(([a], [b]) => (a < b ? 1 : -1));

  function addExpense(data: Omit<Expense, "id">) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setExpenses((prev) => [{ id, ...data }, ...prev]);
    setSheetOpen(false);
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-[#f2f4f6] pb-28">
      <header className="px-5 pb-2 pt-6">
        <p className="text-sm font-semibold text-[#8b95a1]">Yoon&apos;s cal</p>
      </header>

      <section className="px-5 pb-6 pt-4">
        <p
          suppressHydrationWarning
          className="text-base font-medium text-[#6b7684]"
        >
          {month}월 지출
        </p>
        <p className="mt-1 text-[40px] font-bold leading-tight tracking-tight text-[#191f28]">
          {formatWon(monthTotal)}
        </p>
      </section>

      <main className="space-y-3 px-4">
        {groups.length === 0 && (
          <div className="rounded-3xl bg-white px-5 py-14 text-center">
            <p className="text-4xl">🧾</p>
            <p className="mt-3 text-base font-semibold text-[#333d4b]">
              아직 입력한 지출이 없어요
            </p>
            <p className="mt-1 text-sm text-[#8b95a1]">
              아래 버튼을 눌러 첫 지출을 입력해보세요
            </p>
          </div>
        )}

        {groups.map(([date, items]) => (
          <section key={date} className="rounded-3xl bg-white px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#6b7684]">
                {formatDateLabel(date)}
              </h2>
              <span className="text-sm font-semibold text-[#6b7684]">
                {formatWon(items.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>
            <ul>
              {items.map((e) => {
                const cat = categoryInfo(e.category);
                return (
                  <li key={e.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                      style={{ backgroundColor: cat.bg }}
                    >
                      {cat.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-[#191f28]">
                        {e.merchant}
                      </p>
                      <p className="truncate text-sm text-[#8b95a1]">
                        {e.category}
                        {e.memo && ` · ${e.memo}`}
                      </p>
                    </div>
                    <p className="shrink-0 text-base font-bold text-[#191f28]">
                      -{formatWon(e.amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#f2f4f6] via-[#f2f4f6] to-transparent px-5 pb-5 pt-6">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="mx-auto block h-14 w-full max-w-md rounded-2xl bg-[#3182f6] text-base font-bold text-white shadow-lg shadow-blue-500/20 transition-colors active:bg-[#1b64da]"
        >
          지출 입력하기
        </button>
      </div>

      {sheetOpen && (
        <ExpenseSheet onClose={() => setSheetOpen(false)} onSubmit={addExpense} />
      )}
    </div>
  );
}
