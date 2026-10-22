import type { Currency, Cycle, Plan, Service } from "./types";

// 서비스 카탈로그. 지금은 예시 데이터이며, 추후 서버/외부 API로 교체한다.
// UI는 이 파일의 함수만 사용하고 아래 배열을 직접 참조하지 않는다.

export const PRICE_DISCLAIMER =
  "요금제와 가격은 예시 데이터예요. 실제 요금은 공식 사이트에서 꼭 확인하세요.";

const SERVICES: Service[] = [
  // OTT·영상
  {
    id: "netflix",
    name: "넷플릭스",
    tagline: "영화·드라마·예능을 한곳에서",
    description:
      "오리지널 시리즈와 영화를 폭넓게 볼 수 있는 대표적인 영상 스트리밍 서비스예요.",
    category: "ott",
    features: ["광고형 저가 요금제", "동시 시청 기기 수 선택", "콘텐츠 오프라인 저장"],
    officialUrl: "https://www.netflix.com/kr/",
  },
  {
    id: "youtube-premium",
    name: "유튜브 프리미엄",
    tagline: "광고 없이 영상과 음악을",
    description: "광고 없는 시청과 백그라운드 재생, 유튜브 뮤직이 함께 제공돼요.",
    category: "ott",
    features: ["광고 없는 시청", "백그라운드·오프라인 재생", "유튜브 뮤직 포함"],
    officialUrl: "https://www.youtube.com/premium",
  },
  {
    id: "disney-plus",
    name: "디즈니+",
    tagline: "디즈니·마블·스타워즈 모음",
    description: "디즈니, 픽사, 마블, 스타워즈 콘텐츠를 모아 볼 수 있어요.",
    category: "ott",
    features: ["가족 콘텐츠 풍부", "연간 요금제 제공", "4K 화질(프리미엄)"],
    officialUrl: "https://www.disneyplus.com/ko-kr",
  },
  {
    id: "tving",
    name: "티빙",
    tagline: "국내 방송·예능·스포츠",
    description: "국내 방송 콘텐츠와 오리지널, 스포츠 중계를 즐길 수 있어요.",
    category: "ott",
    features: ["국내 예능·드라마 다시보기", "라이브 채널", "스포츠 중계"],
    officialUrl: "https://www.tving.com",
  },
  {
    id: "wavve",
    name: "웨이브",
    tagline: "지상파·종편 콘텐츠 한곳에",
    description: "지상파 3사와 종편 콘텐츠를 중심으로 한 국내 스트리밍 서비스예요.",
    category: "ott",
    features: ["지상파 실시간·다시보기", "해외 시리즈", "동시 시청 선택"],
    officialUrl: "https://www.wavve.com",
  },
  // 음악
  {
    id: "spotify",
    name: "스포티파이",
    tagline: "취향 맞춤 음악·팟캐스트",
    description: "개인화된 추천과 플레이리스트가 강점인 음악 스트리밍이에요.",
    category: "music",
    features: ["맞춤 추천 플레이리스트", "오프라인 다운로드", "듀오·가족 요금제"],
    officialUrl: "https://www.spotify.com/kr-ko/premium/",
  },
  {
    id: "melon",
    name: "멜론",
    tagline: "국내 음원 스트리밍",
    description: "국내 음원 차트와 최신곡을 가장 빠르게 들을 수 있어요.",
    category: "music",
    features: ["국내 최신 음원", "차트·DJ 플레이리스트", "오프라인 저장"],
    officialUrl: "https://www.melon.com",
  },
  {
    id: "apple-music",
    name: "애플 뮤직",
    tagline: "고음질 무손실 음악",
    description: "무손실 오디오와 공간 음향을 지원하는 음악 서비스예요.",
    category: "music",
    features: ["무손실·공간 음향", "애플 기기 연동", "가족 요금제"],
    officialUrl: "https://www.apple.com/kr/apple-music/",
  },
  // AI·생산성
  {
    id: "chatgpt",
    name: "ChatGPT",
    tagline: "대화형 AI 어시스턴트",
    description: "글쓰기, 코딩, 분석 등 다양한 작업을 도와주는 AI 서비스예요.",
    category: "ai",
    features: ["최신 모델 우선 이용", "파일·이미지 분석", "음성 대화"],
    officialUrl: "https://chatgpt.com",
  },
  {
    id: "claude",
    name: "Claude",
    tagline: "긴 문서에 강한 AI 어시스턴트",
    description: "긴 문서 이해와 글쓰기, 코딩에 강점이 있는 AI 서비스예요.",
    category: "ai",
    features: ["긴 문서 요약·분석", "코딩 지원", "프로젝트별 맥락 유지"],
    officialUrl: "https://claude.ai",
  },
  {
    id: "notion",
    name: "노션",
    tagline: "문서·할 일·지식 관리",
    description: "문서, 데이터베이스, 프로젝트 관리를 한곳에서 할 수 있는 워크스페이스예요.",
    category: "ai",
    features: ["문서·DB 통합", "팀 협업", "AI 기능 옵션"],
    officialUrl: "https://www.notion.so/pricing",
  },
  {
    id: "microsoft-365",
    name: "마이크로소프트 365",
    tagline: "워드·엑셀·파워포인트",
    description: "오피스 앱과 클라우드 저장공간이 함께 제공되는 구독이에요.",
    category: "ai",
    features: ["오피스 앱 전체", "OneDrive 1TB", "가족 공유 요금제"],
    officialUrl: "https://www.microsoft.com/ko-kr/microsoft-365",
  },
  // 디자인
  {
    id: "figma",
    name: "피그마",
    tagline: "협업형 UI 디자인 도구",
    description: "브라우저에서 팀과 함께 화면을 디자인하고 프로토타입을 만드는 도구예요.",
    category: "design",
    features: ["실시간 협업", "프로토타입", "디자인 시스템"],
    officialUrl: "https://www.figma.com/pricing/",
  },
  {
    id: "canva",
    name: "캔바",
    tagline: "누구나 쉬운 템플릿 디자인",
    description: "템플릿으로 발표자료, SNS 이미지, 포스터를 빠르게 만들 수 있어요.",
    category: "design",
    features: ["방대한 템플릿", "배경 제거·리사이즈", "브랜드 키트"],
    officialUrl: "https://www.canva.com/ko_kr/pro/",
  },
  {
    id: "adobe-cc",
    name: "어도비 Creative Cloud",
    tagline: "포토샵·일러스트레이터",
    description: "전문가용 이미지·영상·디자인 앱 모음 구독이에요.",
    category: "design",
    features: ["포토샵·일러스트레이터", "클라우드 저장", "폰트 제공"],
    officialUrl: "https://www.adobe.com/kr/creativecloud.html",
  },
  // 클라우드
  {
    id: "icloud",
    name: "iCloud+",
    tagline: "애플 기기 백업·저장공간",
    description: "사진과 기기 백업을 위한 애플 클라우드 저장공간이에요.",
    category: "cloud",
    features: ["기기 자동 백업", "저장공간 가족 공유", "개인 정보 보호 기능"],
    officialUrl: "https://www.apple.com/kr/icloud/",
  },
  {
    id: "google-one",
    name: "구글 원",
    tagline: "구글 계정 저장공간 확장",
    description: "구글 드라이브·포토·지메일이 함께 쓰는 저장공간을 늘려줘요.",
    category: "cloud",
    features: ["저장공간 확장", "가족 공유", "연간 요금제 할인"],
    officialUrl: "https://one.google.com",
  },
  {
    id: "dropbox",
    name: "드롭박스",
    tagline: "파일 동기화·공유",
    description: "파일을 여러 기기에 동기화하고 링크로 간편하게 공유할 수 있어요.",
    category: "cloud",
    features: ["자동 동기화", "대용량 파일 공유", "파일 복구"],
    officialUrl: "https://www.dropbox.com/plans",
  },
  // 쇼핑·멤버십
  {
    id: "coupang-wow",
    name: "쿠팡 와우 멤버십",
    tagline: "로켓배송·무료 반품",
    description: "로켓배송 무료 혜택과 쿠팡플레이 등이 묶인 멤버십이에요.",
    category: "shopping",
    features: ["로켓배송·새벽배송", "무료 반품", "쿠팡플레이 포함"],
    officialUrl: "https://www.coupang.com",
  },
  {
    id: "naver-plus",
    name: "네이버플러스 멤버십",
    tagline: "쇼핑 적립·콘텐츠 혜택",
    description: "네이버 쇼핑 적립과 콘텐츠 혜택을 받는 멤버십이에요.",
    category: "shopping",
    features: ["쇼핑 추가 적립", "콘텐츠 혜택 선택", "무료 반품 혜택"],
    officialUrl: "https://shopping.naver.com",
  },
  {
    id: "baemin-club",
    name: "배민클럽",
    tagline: "배달비 할인 구독",
    description: "배달 주문 시 배달비 할인을 받을 수 있는 구독이에요.",
    category: "shopping",
    features: ["배달비 무료·할인", "자주 시키는 가게 혜택", "월 구독"],
    officialUrl: "https://www.baemin.com",
  },
  {
    id: "kurly",
    name: "컬리멤버스",
    tagline: "신선식품 새벽배송 혜택",
    description: "새벽배송 식료품 쇼핑에서 적립과 무료 배송 혜택을 받아요.",
    category: "shopping",
    features: ["적립 혜택", "무료 배송 쿠폰", "전용 할인"],
    officialUrl: "https://www.kurly.com",
  },
];

function plan(
  serviceId: string,
  slug: string,
  name: string,
  summary: string,
  currency: Currency,
  monthly: number | null,
  yearly: number | null = null,
): Plan {
  const prices: Plan["prices"] = {};
  if (monthly !== null) prices.monthly = monthly;
  if (yearly !== null) prices.yearly = yearly;
  return { id: `${serviceId}:${slug}`, serviceId, name, summary, currency, prices };
}

const PLANS: Plan[] = [
  plan("netflix", "ads", "광고형 스탠다드", "광고가 있고 HD 화질", "KRW", 5500),
  plan("netflix", "standard", "스탠다드", "광고 없음 · 동시 2대", "KRW", 13500),
  plan("netflix", "premium", "프리미엄", "광고 없음 · 4K · 동시 4대", "KRW", 17000),

  plan("youtube-premium", "individual", "개인", "1인 이용", "KRW", 14900),
  plan("youtube-premium", "family", "가족", "최대 5명 구성원", "KRW", 23900),

  plan("disney-plus", "standard", "스탠다드", "FHD · 동시 2대", "KRW", 9900, 99000),
  plan("disney-plus", "premium", "프리미엄", "4K · 동시 4대", "KRW", 13900, 139000),

  plan("tving", "basic", "베이직", "광고형 · 동시 1대", "KRW", 9500),
  plan("tving", "standard", "스탠다드", "동시 2대 · FHD", "KRW", 13500),
  plan("tving", "premium", "프리미엄", "동시 4대 · 4K", "KRW", 17000),

  plan("wavve", "basic", "베이직", "동시 1대", "KRW", 7900),
  plan("wavve", "standard", "스탠다드", "동시 2대", "KRW", 10900),
  plan("wavve", "premium", "프리미엄", "동시 4대", "KRW", 13900),

  plan("spotify", "individual", "개인", "1인 이용", "KRW", 11990),
  plan("spotify", "duo", "듀오", "2인 이용", "KRW", 16350),
  plan("spotify", "family", "패밀리", "최대 6인", "KRW", 20990),

  plan("melon", "streaming", "스트리밍 클럽", "무제한 스트리밍", "KRW", 10900),
  plan("melon", "download", "스트리밍+다운로드", "오프라인 저장 포함", "KRW", 13900),

  plan("apple-music", "individual", "개인", "1인 이용", "KRW", 10900),
  plan("apple-music", "family", "가족", "최대 6인", "KRW", 16900),

  plan("chatgpt", "plus", "Plus", "개인용 확장 사용량", "USD", 20),
  plan("chatgpt", "pro", "Pro", "고급 사용자용", "USD", 200),

  plan("claude", "pro", "Pro", "개인용 확장 사용량", "USD", 20, 200),
  plan("claude", "max", "Max", "대량 사용자용", "USD", 100),

  plan("notion", "plus", "Plus", "소규모 팀", "USD", 10, 96),
  plan("notion", "business", "Business", "전사 협업", "USD", 20, 180),

  plan("microsoft-365", "personal", "Personal", "1인 · 오피스 앱", "KRW", 14900, 149000),
  plan("microsoft-365", "family", "Family", "최대 6인", "KRW", 18900, 189000),

  plan("figma", "professional", "Professional", "전문가·팀용", "USD", 15, 144),
  plan("figma", "organization", "Organization", "조직용", "USD", 45, 540),

  plan("canva", "pro", "Pro", "프리미엄 템플릿·도구", "KRW", 14900, 149000),
  plan("canva", "teams", "Teams", "팀 협업", "KRW", 12000, 120000),

  plan("adobe-cc", "photo", "포토그래피", "포토샵·라이트룸", "KRW", 11900),
  plan("adobe-cc", "all-apps", "전체 앱", "Creative Cloud 전체", "KRW", 79000, 790000),

  plan("icloud", "50gb", "50GB", "기본 저장공간", "KRW", 1100),
  plan("icloud", "200gb", "200GB", "가족 공유 가능", "KRW", 3500),
  plan("icloud", "2tb", "2TB", "대용량", "KRW", 11900),

  plan("google-one", "100gb", "100GB", "기본 확장", "KRW", 2400, 24000),
  plan("google-one", "2tb", "2TB", "대용량", "KRW", 11900, 119000),

  plan("dropbox", "plus", "Plus", "개인용 2TB", "USD", 11.99, 119.88),
  plan("dropbox", "essentials", "Essentials", "전문가용 3TB", "USD", 22, 216),

  plan("coupang-wow", "wow", "와우 멤버십", "월 정기 결제", "KRW", 7890),
  plan("naver-plus", "membership", "멤버십", "월 정기 결제", "KRW", 4900),
  plan("baemin-club", "club", "배민클럽", "월 정기 결제", "KRW", 3990),
  plan("kurly", "members", "컬리멤버스", "월 정기 결제", "KRW", 1900),
];

export function listServices(): Service[] {
  return SERVICES;
}

export function getService(id: string | null | undefined): Service | undefined {
  return id ? SERVICES.find((s) => s.id === id) : undefined;
}

export function listPlans(serviceId: string): Plan[] {
  return PLANS.filter((p) => p.serviceId === serviceId);
}

export function getPlan(id: string | null | undefined): Plan | undefined {
  return id ? PLANS.find((p) => p.id === id) : undefined;
}

/** 서비스에서 가장 저렴한 월간 요금 (카드 표시용) */
export function lowestMonthlyPrice(
  serviceId: string,
): { amount: number; currency: Currency } | null {
  const plans = listPlans(serviceId).filter((p) => p.prices.monthly !== undefined);
  if (plans.length === 0) return null;
  const cheapest = plans.reduce((a, b) =>
    (a.prices.monthly as number) <= (b.prices.monthly as number) ? a : b,
  );
  return { amount: cheapest.prices.monthly as number, currency: cheapest.currency };
}

export function defaultCycleFor(plan: Plan): Cycle {
  return plan.prices.monthly !== undefined ? "monthly" : "yearly";
}
