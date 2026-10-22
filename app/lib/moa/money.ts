import type { Currency } from "./types";

export const CURRENCIES: Currency[] = ["KRW", "USD"];

/** 통화별 합계. 환율 없이 서로 다른 통화를 더하지 않기 위해 통화별로 따로 쌓는다. */
export type MoneyMap = Partial<Record<Currency, number>>;

export function formatMoney(amount: number, currency: Currency) {
  if (currency === "KRW") {
    return `${Math.round(amount).toLocaleString("ko-KR")}원`;
  }
  return amount.toLocaleString("en-US", { style: "currency", currency });
}

export function addMoney(map: MoneyMap, currency: Currency, amount: number) {
  map[currency] = (map[currency] ?? 0) + amount;
}

export function moneyEntries(map: MoneyMap): [Currency, number][] {
  return CURRENCIES.filter((c) => (map[c] ?? 0) !== 0).map(
    (c) => [c, map[c] as number] as [Currency, number],
  );
}

export function formatMoneyMap(map: MoneyMap) {
  const entries = moneyEntries(map);
  if (entries.length === 0) return "0원";
  return entries.map(([c, v]) => formatMoney(v, c)).join(" + ");
}
