import type { AppData } from "./types";

/**
 * 저장소 인터페이스. 화면 코드는 store.tsx 를 거쳐 이것만 사용한다.
 * 구현: supabaseRepository.ts (로그인한 사용자의 데이터를 Supabase DB에 저장)
 */
export interface AppRepository {
  /** 처음 이용하는 사용자라면 null (이때 데모 데이터로 시작한다) */
  load(): Promise<AppData | null>;
  /** prev 와 next 를 비교해서 바뀐 항목만 저장한다 */
  sync(prev: AppData, next: AppData): Promise<void>;
}
