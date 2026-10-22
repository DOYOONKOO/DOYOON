import { defaultSettings, type AppData } from "./types";

/**
 * 저장소 인터페이스.
 * 지금은 브라우저 localStorage 구현만 있고, 나중에 서버 DB 구현으로 바꿔 끼우면 된다.
 * 화면 코드는 이 인터페이스(store.tsx 경유)만 사용한다.
 */
export interface AppRepository {
  /** 저장된 데이터가 없으면 null */
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY = "moa-subscriptions:v1";

function isAppData(value: unknown): value is AppData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.subscriptions) &&
    Array.isArray(v.payments) &&
    Array.isArray(v.cards) &&
    Array.isArray(v.wishlist) &&
    typeof v.settings === "object" &&
    v.settings !== null
  );
}

export const localStorageRepository: AppRepository = {
  async load() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAppData(parsed)) throw new Error("저장된 데이터 형식이 올바르지 않아요.");
    // 나중에 설정 항목이 늘어나도 기본값으로 채워진다
    return { ...parsed, settings: { ...defaultSettings(), ...parsed.settings } };
  },
  async save(data) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
  async clear() {
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
