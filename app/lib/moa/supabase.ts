import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_ 값은 빌드할 때 브라우저 코드에 들어간다. publishable key 는 공개용이라 괜찮지만,
// secret / service_role 키는 절대 여기에 넣지 않는다. 데이터 보호는 DB의 RLS 규칙이 한다.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !key) throw new Error("Supabase 환경변수가 설정되지 않았어요.");
  client ??= createClient(url, key);
  return client;
}
