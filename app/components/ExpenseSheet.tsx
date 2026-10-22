"use client";

import { useState } from "react";
import { CATEGORIES, todayStr, type Category, type Expense } from "../lib/expense";

type Props = {
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, "id">) => void;
};

const fieldClass =
  "w-full rounded-2xl bg-[#f2f4f6] px-4 py-3.5 text-base text-[#191f28] outline-none placeholder:text-[#b0b8c1] focus:ring-2 focus:ring-[#3182f6]";

export default function ExpenseSheet({ onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<Category>("식비");
  const [date, setDate] = useState(todayStr);
  const [memo, setMemo] = useState("");

  const amountNumber = Number(amount);
  const canSubmit = amountNumber > 0 && merchant.trim() !== "" && date !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      amount: amountNumber,
      merchant: merchant.trim(),
      category,
      date,
      memo: memo.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white px-5 pb-6 pt-3"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#e5e8eb]" />
        <h2 className="mb-5 text-xl font-bold text-[#191f28]">지출 입력</h2>

        <label className="mb-1.5 block text-sm font-medium text-[#6b7684]">
          금액
        </label>
        <div className="mb-5 flex items-baseline gap-1">
          <input
            autoFocus
            inputMode="numeric"
            placeholder="0"
            value={amountNumber > 0 ? amountNumber.toLocaleString("ko-KR") : ""}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="min-w-0 flex-1 bg-transparent text-4xl font-bold text-[#191f28] outline-none placeholder:text-[#d1d6db]"
          />
          <span className="text-2xl font-bold text-[#191f28]">원</span>
        </div>

        <label className="mb-1.5 block text-sm font-medium text-[#6b7684]">
          사용처
        </label>
        <input
          placeholder="예: 스타벅스"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className={`${fieldClass} mb-5`}
        />

        <label className="mb-2 block text-sm font-medium text-[#6b7684]">
          카테고리
        </label>
        <div className="mb-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCategory(c.name)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                category === c.name
                  ? "bg-[#3182f6] text-white"
                  : "bg-[#f2f4f6] text-[#4e5968]"
              }`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-medium text-[#6b7684]">
          날짜
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${fieldClass} mb-5`}
        />

        <label className="mb-1.5 block text-sm font-medium text-[#6b7684]">
          메모 (선택)
        </label>
        <input
          placeholder="메모를 남겨보세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className={`${fieldClass} mb-6`}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="h-14 w-full rounded-2xl bg-[#3182f6] text-base font-bold text-white transition-colors active:bg-[#1b64da] disabled:bg-[#c9e2ff]"
        >
          추가하기
        </button>
      </form>
    </div>
  );
}
