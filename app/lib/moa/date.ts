// 날짜는 모두 "YYYY-MM-DD" 문자열로 다룬다. (시간대 문제를 피하려고 Date 객체를 저장하지 않는다.)
export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(y: number, m: number, d: number): ISODate {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseISO(s: ISODate) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

export function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function isValidISO(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const { y, m, d } = parseISO(s);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

/** 렌더링 중에 호출하지 말 것 — 앱 시작 시점과 이벤트 핸들러에서만 사용 */
export function todayISO(): ISODate {
  const n = new Date();
  return toISO(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

/**
 * 기준일의 "일"을 유지하며 n개월 이동. 해당 월에 그 날짜가 없으면 말일로 맞춘다.
 * 예) 1/31 기준 → 2월은 28(29)일, 3월은 다시 31일
 */
export function addMonthsClamped(anchor: ISODate, months: number): ISODate {
  const { y, m, d } = parseISO(anchor);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12 + 1;
  return toISO(ny, nm, Math.min(d, daysInMonth(ny, nm)));
}

export function addDays(iso: ISODate, n: number): ISODate {
  const { y, m, d } = parseISO(iso);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return toISO(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** to - from (일 수) */
export function diffDays(from: ISODate, to: ISODate) {
  const a = parseISO(from);
  const b = parseISO(to);
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000,
  );
}

// ── 월 단위 ──
export type MonthKey = string; // "YYYY-MM"

export const monthKey = (iso: ISODate): MonthKey => iso.slice(0, 7);
export const monthStart = (key: MonthKey): ISODate => `${key}-01`;

export function monthEnd(key: MonthKey): ISODate {
  const [y, m] = key.split("-").map(Number);
  return toISO(y, m, daysInMonth(y, m));
}

export function shiftMonthKey(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  return `${ny}-${pad(total - ny * 12 + 1)}`;
}

export function formatMonthLabel(key: MonthKey) {
  const [y, m] = key.split("-").map(Number);
  return `${y}년 ${m}월`;
}

// ── 표시용 ──
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatKoDate(iso: ISODate, withYear = false) {
  const { y, m, d } = parseISO(iso);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${withYear ? `${y}년 ` : ""}${m}월 ${d}일 (${wd})`;
}

/** "오늘", "내일", "3일 후", "2일 지남" */
export function relativeDayLabel(date: ISODate, today: ISODate) {
  const n = diffDays(today, date);
  if (n === 0) return "오늘";
  if (n === 1) return "내일";
  if (n > 0) return `${n}일 후`;
  return `${-n}일 지남`;
}
