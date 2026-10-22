export const CATEGORIES = [
  { name: "식비", emoji: "🍚", bg: "#fff1e6" },
  { name: "카페", emoji: "☕", bg: "#f4ece4" },
  { name: "교통", emoji: "🚌", bg: "#e8f3ff" },
  { name: "쇼핑", emoji: "🛍️", bg: "#fdeaf1" },
  { name: "구독", emoji: "📺", bg: "#efeaff" },
  { name: "기타", emoji: "📦", bg: "#eef0f3" },
] as const;

export type Category = (typeof CATEGORIES)[number]["name"];

export type Expense = {
  id: string;
  amount: number;
  merchant: string;
  category: Category;
  date: string; // YYYY-MM-DD
  memo: string;
};

export function categoryInfo(name: Category) {
  return CATEGORIES.find((c) => c.name === name) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${weekday})`;
}
