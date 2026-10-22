/** DB의 uuid 컬럼에 그대로 들어갈 수 있는 v4 uuid. (crypto.randomUUID 는 http 로컬 네트워크에서 없을 수 있어 getRandomValues 사용) */
export function newId(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
