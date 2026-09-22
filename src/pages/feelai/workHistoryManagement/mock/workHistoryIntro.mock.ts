export const WORK_HISTORY_INTRO_STATUSES = ['완료', '생성중', '제작중', '오류'] as const;
export type WorkHistoryIntroStatus = (typeof WORK_HISTORY_INTRO_STATUSES)[number];

export const WORK_HISTORY_INTRO_VISIBILITIES = ['노출중', '미노출'] as const;
export type WorkHistoryIntroVisibility = (typeof WORK_HISTORY_INTRO_VISIBILITIES)[number];

export const WORK_HISTORY_INTRO_STYLES = ['픽사', '지브리', '디즈니', '치비'] as const;
export type WorkHistoryIntroStyle = (typeof WORK_HISTORY_INTRO_STYLES)[number];

export const WORK_HISTORY_INTRO_CATEGORIES = ['웨딩', '베이비', '고희연'] as const;
export type WorkHistoryIntroCategory = (typeof WORK_HISTORY_INTRO_CATEGORIES)[number];

export const WORK_HISTORY_INTRO_RATIOS = ['16:9', '9:16', '1:1'] as const;
export type WorkHistoryIntroRatio = (typeof WORK_HISTORY_INTRO_RATIOS)[number];

export type WorkHistoryIntroProgress = {
  current: number;
  total: number;
};

export type WorkHistoryIntroItem = {
  id: string;
  thumbnailUrl: string;
  workId: string;
  visibility: WorkHistoryIntroVisibility;
  customerId: string;
  customerName: string;
  customerPhone: string;
  category: WorkHistoryIntroCategory;
  style: WorkHistoryIntroStyle;
  ratio: WorkHistoryIntroRatio;
  imageProgress: WorkHistoryIntroProgress;
  videoProgress: WorkHistoryIntroProgress;
  status: WorkHistoryIntroStatus;
  failReason: string | null;
  usedTokens: number;
  apiCost: number;
  hasFinalVideo: boolean;
  registeredAt: string;
};

const WORK_HISTORY_INTRO_THUMBNAIL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><rect width='160' height='160' fill='%23f3f4f6'/><rect x='18' y='24' width='124' height='112' rx='12' fill='%23e5e7eb'/><circle cx='80' cy='80' r='22' fill='%23d1d5db'/><polygon points='74,68 74,92 98,80' fill='%236b7280'/></svg>";

export const MOCK_WORK_HISTORY_INTRO_ITEMS: WorkHistoryIntroItem[] = [
  {
    id: 'intro-1',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260917-001',
    visibility: '노출중',
    customerId: 'feelai_mj',
    customerName: '이민정',
    customerPhone: '010-1111-2222',
    category: '웨딩',
    style: '지브리',
    ratio: '16:9',
    imageProgress: { current: 10, total: 10 },
    videoProgress: { current: 10, total: 10 },
    status: '완료',
    failReason: null,
    usedTokens: 120,
    apiCost: 18600,
    hasFinalVideo: true,
    registeredAt: '2026-09-17 09:12:44',
  },
  {
    id: 'intro-2',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260917-002',
    visibility: '미노출',
    customerId: 'kimcs',
    customerName: '김철수',
    customerPhone: '010-1234-5678',
    category: '베이비',
    style: '픽사',
    ratio: '9:16',
    imageProgress: { current: 6, total: 10 },
    videoProgress: { current: 0, total: 10 },
    status: '생성중',
    failReason: null,
    usedTokens: 48,
    apiCost: 7200,
    hasFinalVideo: false,
    registeredAt: '2026-09-17 11:08:15',
  },
  {
    id: 'intro-3',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260916-014',
    visibility: '노출중',
    customerId: 'park_yh',
    customerName: '박영희',
    customerPhone: '010-2222-3333',
    category: '고희연',
    style: '디즈니',
    ratio: '1:1',
    imageProgress: { current: 10, total: 10 },
    videoProgress: { current: 4, total: 10 },
    status: '제작중',
    failReason: null,
    usedTokens: 86,
    apiCost: 12800,
    hasFinalVideo: false,
    registeredAt: '2026-09-16 16:41:02',
  },
  {
    id: 'intro-4',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260916-008',
    visibility: '미노출',
    customerId: 'lee_ds',
    customerName: '이동수',
    customerPhone: '010-3333-4444',
    category: '웨딩',
    style: '치비',
    ratio: '16:9',
    imageProgress: { current: 10, total: 10 },
    videoProgress: { current: 2, total: 10 },
    status: '오류',
    failReason: '영상 생성 실패',
    usedTokens: 74,
    apiCost: 9800,
    hasFinalVideo: false,
    registeredAt: '2026-09-16 13:22:51',
  },
  {
    id: 'intro-5',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260915-021',
    visibility: '노출중',
    customerId: 'choi_hn',
    customerName: '최하나',
    customerPhone: '010-5555-6666',
    category: '베이비',
    style: '지브리',
    ratio: '9:16',
    imageProgress: { current: 10, total: 10 },
    videoProgress: { current: 10, total: 10 },
    status: '완료',
    failReason: null,
    usedTokens: 132,
    apiCost: 21400,
    hasFinalVideo: true,
    registeredAt: '2026-09-15 18:03:27',
  },
  {
    id: 'intro-6',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260915-009',
    visibility: '노출중',
    customerId: 'jung_sw',
    customerName: '정수원',
    customerPhone: '010-7777-8888',
    category: '웨딩',
    style: '픽사',
    ratio: '16:9',
    imageProgress: { current: 3, total: 10 },
    videoProgress: { current: 0, total: 10 },
    status: '생성중',
    failReason: null,
    usedTokens: 24,
    apiCost: 3600,
    hasFinalVideo: false,
    registeredAt: '2026-09-15 10:46:09',
  },
  {
    id: 'intro-7',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260914-033',
    visibility: '미노출',
    customerId: 'han_jy',
    customerName: '한지윤',
    customerPhone: '010-8888-9999',
    category: '고희연',
    style: '치비',
    ratio: '1:1',
    imageProgress: { current: 10, total: 10 },
    videoProgress: { current: 7, total: 10 },
    status: '제작중',
    failReason: null,
    usedTokens: 98,
    apiCost: 15200,
    hasFinalVideo: false,
    registeredAt: '2026-09-14 20:11:33',
  },
  {
    id: 'intro-8',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260914-017',
    visibility: '노출중',
    customerId: 'oh_ms',
    customerName: '오민서',
    customerPhone: '010-1010-2020',
    category: '베이비',
    style: '디즈니',
    ratio: '9:16',
    imageProgress: { current: 8, total: 10 },
    videoProgress: { current: 0, total: 10 },
    status: '오류',
    failReason: '이미지 생성 한도 초과',
    usedTokens: 61,
    apiCost: 8400,
    hasFinalVideo: false,
    registeredAt: '2026-09-14 08:55:18',
  },
  {
    id: 'intro-9',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260913-004',
    visibility: '노출중',
    customerId: 'yoon_dh',
    customerName: '윤도현',
    customerPhone: '010-3030-4040',
    category: '웨딩',
    style: '지브리',
    ratio: '16:9',
    imageProgress: { current: 10, total: 10 },
    videoProgress: { current: 10, total: 10 },
    status: '완료',
    failReason: null,
    usedTokens: 140,
    apiCost: 22800,
    hasFinalVideo: true,
    registeredAt: '2026-09-13 15:29:47',
  },
  {
    id: 'intro-10',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260912-028',
    visibility: '미노출',
    customerId: 'kang_ej',
    customerName: '강은지',
    customerPhone: '010-4040-5050',
    category: '고희연',
    style: '픽사',
    ratio: '1:1',
    imageProgress: { current: 10, total: 10 },
    videoProgress: { current: 10, total: 10 },
    status: '완료',
    failReason: null,
    usedTokens: 110,
    apiCost: 17600,
    hasFinalVideo: true,
    registeredAt: '2026-09-12 12:04:02',
  },
  {
    id: 'intro-11',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260911-011',
    visibility: '노출중',
    customerId: 'seo_jw',
    customerName: '서지우',
    customerPhone: '010-6060-7070',
    category: '베이비',
    style: '치비',
    ratio: '9:16',
    imageProgress: { current: 10, total: 10 },
    videoProgress: { current: 5, total: 10 },
    status: '제작중',
    failReason: null,
    usedTokens: 79,
    apiCost: 11900,
    hasFinalVideo: false,
    registeredAt: '2026-09-11 19:38:26',
  },
  {
    id: 'intro-12',
    thumbnailUrl: WORK_HISTORY_INTRO_THUMBNAIL,
    workId: 'INTRO-260910-006',
    visibility: '미노출',
    customerId: 'baek_sh',
    customerName: '백서현',
    customerPhone: '010-8080-9090',
    category: '웨딩',
    style: '디즈니',
    ratio: '16:9',
    imageProgress: { current: 2, total: 10 },
    videoProgress: { current: 0, total: 10 },
    status: '생성중',
    failReason: null,
    usedTokens: 16,
    apiCost: 2400,
    hasFinalVideo: false,
    registeredAt: '2026-09-10 07:21:55',
  },
];

export function getWorkHistoryIntroItemById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_WORK_HISTORY_INTRO_ITEMS.find((item) => item.id === id || item.workId === id);
}

export const WORK_HISTORY_INTRO_TRANSITIONS = ['fade', 'slide', 'cut'] as const;
export type WorkHistoryIntroTransition = (typeof WORK_HISTORY_INTRO_TRANSITIONS)[number];

export type WorkHistoryIntroPipelineStep = {
  key: string;
  label: string;
  value: string;
  done: boolean;
};

export type WorkHistoryIntroDetail = WorkHistoryIntroItem & {
  sceneCount: number;
  personCount: number;
  ttsCount: number;
  transition: WorkHistoryIntroTransition;
  step: number;
  updatedAt: string;
  apiCostUsd: string;
  finalVideoUrl: string | null;
  finalVideoPosterUrl: string | null;
  pipelineSteps: WorkHistoryIntroPipelineStep[];
  cast: WorkHistoryIntroCast;
  styleConversions: WorkHistoryIntroStyleConversion[];
  scenes: WorkHistoryIntroScene[];
  bgm: WorkHistoryIntroBgmSection;
  narration: WorkHistoryIntroNarrationSection;
  timeline: WorkHistoryIntroTimelineClip[];
  tokenUsages: WorkHistoryIntroTokenUsage[];
  apiCostEntries: WorkHistoryIntroApiCostEntry[];
  failures: WorkHistoryIntroFailure[];
};

export type WorkHistoryIntroPersonBox = {
  id: string;
  label: string;
  /** percent of group image, 0–100 */
  top: number;
  left: number;
  width: number;
  height: number;
};

export type WorkHistoryIntroCastPerson = {
  id: string;
  label: string;
  imageUrl: string;
};

export type WorkHistoryIntroCast =
  | {
      mode: 'group';
      personCount: number;
      imageUrl: string;
      boxes: WorkHistoryIntroPersonBox[];
    }
  | {
      mode: 'separate';
      personCount: number;
      people: WorkHistoryIntroCastPerson[];
    };

export type WorkHistoryIntroStylePerson = {
  id: string;
  label: string;
  imageUrl: string;
};

export type WorkHistoryIntroStyleConversion = {
  style: WorkHistoryIntroStyle;
  selected: boolean;
  people: WorkHistoryIntroStylePerson[];
};

export type WorkHistoryIntroSceneAssetStatus = '완료' | '생성중' | '대기' | '실패';

export type WorkHistoryIntroScene = {
  id: string;
  index: number;
  imageStatus: WorkHistoryIntroSceneAssetStatus;
  videoStatus: WorkHistoryIntroSceneAssetStatus;
  imageUrl: string | null;
  videoUrl: string | null;
  story: string;
  subtitle: string | null;
};

export type WorkHistoryIntroAudioClip = {
  id: string;
  audioUrl: string;
  createdAt: string;
  label: string;
  isFinal?: boolean;
};

export type WorkHistoryIntroBgmSection = {
  mode: string;
  volume: number;
  mood: string;
  clips: WorkHistoryIntroAudioClip[];
};

export type WorkHistoryIntroNarrationSection = {
  speaker: string;
  volume: number;
  clips: WorkHistoryIntroAudioClip[];
};

export type WorkHistoryIntroTimelineTransition = 'fade' | 'slide' | 'cut' | 'dissolve' | 'wipe';

export type WorkHistoryIntroTimelineClip = {
  id: string;
  sceneIndex: number;
  thumbnailUrl: string | null;
  /** 원본 씬 영상 전체 길이(초) */
  totalDurationSec: number;
  /** 컷 편집 사용 구간 시작(초) */
  useStartSec: number;
  /** 컷 편집 사용 구간 끝(초) */
  useEndSec: number;
  speed: number;
  transitionIn: WorkHistoryIntroTimelineTransition;
  transitionOut: WorkHistoryIntroTimelineTransition;
  videoName: string;
  videoUrl: string;
};

export type WorkHistoryIntroTokenUsage = {
  id: string;
  occurredAt: string;
  step: string;
  tokens: number;
};

export type WorkHistoryIntroApiCostEntry = {
  id: string;
  occurredAt: string;
  feature: string;
  model: string;
  costKrw: number;
  costUsd: string;
};

export type WorkHistoryIntroFailure = {
  id: string;
  occurredAt: string;
  step: string;
  reason: string;
};

const SAMPLE_FINAL_VIDEO_URL = '/feelai/workHistory/intro/disney-couple-final.mp4';
const SAMPLE_FINAL_VIDEO_POSTER_URL = '/feelai/workHistory/intro/disney-couple-poster.jpg';
const SAMPLE_FINAL_VIDEO_POSTER_9X16_URL = '/feelai/workHistory/intro/disney-couple-poster-9x16.jpg';

const STYLE_SLUG: Record<WorkHistoryIntroStyle, string> = {
  픽사: 'pixar',
  지브리: 'ghibli',
  디즈니: 'disney',
  치비: 'chibi',
};

function pickConvertedStyles(item: WorkHistoryIntroItem): WorkHistoryIntroStyle[] {
  const seed = hashSeed(item.id);
  const others = WORK_HISTORY_INTRO_STYLES.filter((style) => style !== item.style);

  let extraCount = 0;
  if (item.hasFinalVideo || item.status === '완료') {
    extraCount = others.length;
  } else if (item.status === '제작중') {
    extraCount = 1 + (seed % 2); // 2~3개 총합
  } else if (item.status === '생성중') {
    extraCount = seed % 2; // 1~2개 총합
  } else {
    extraCount = 1 + (seed % Math.min(2, others.length));
  }

  const extras = others.filter((_, index) => index < extraCount);
  return WORK_HISTORY_INTRO_STYLES.filter((style) => style === item.style || extras.includes(style));
}

function buildWeddingStylePeople(
  itemId: string,
  style: WorkHistoryIntroStyle
): WorkHistoryIntroStylePerson[] {
  const slug = STYLE_SLUG[style];
  return [
    {
      id: `${itemId}-style-${slug}-groom`,
      label: '신랑',
      imageUrl: `/feelai/workHistory/intro/style/groom-${slug}.png`,
    },
    {
      id: `${itemId}-style-${slug}-bride`,
      label: '신부',
      imageUrl: `/feelai/workHistory/intro/style/bride-${slug}.png`,
    },
  ];
}

function buildGroupStylePeople(
  itemId: string,
  style: WorkHistoryIntroStyle
): WorkHistoryIntroStylePerson[] {
  const slug = STYLE_SLUG[style];
  // 가족 스타일 에셋은 픽사만 준비되어 있어, 그 외 스타일은 픽사 이미지를 목업으로 재사용
  return [
    {
      id: `${itemId}-style-${slug}-mom`,
      label: '엄마',
      imageUrl: '/feelai/workHistory/intro/style/mom-pixar.png',
    },
    {
      id: `${itemId}-style-${slug}-dad`,
      label: '아빠',
      imageUrl: '/feelai/workHistory/intro/style/dad-pixar.png',
    },
    {
      id: `${itemId}-style-${slug}-baby1`,
      label: '아기',
      imageUrl: '/feelai/workHistory/intro/style/baby1-pixar.png',
    },
    {
      id: `${itemId}-style-${slug}-baby2`,
      label: '아기',
      imageUrl: '/feelai/workHistory/intro/style/baby2-pixar.png',
    },
  ];
}

function buildCastAndStyles(item: WorkHistoryIntroItem): {
  cast: WorkHistoryIntroCast;
  styleConversions: WorkHistoryIntroStyleConversion[];
  personCount: number;
} {
  const convertedStyles = pickConvertedStyles(item);

  if (item.category === '웨딩') {
    const people: WorkHistoryIntroCastPerson[] = [
      { id: `${item.id}-groom`, label: '신랑', imageUrl: '/feelai/workHistory/intro/cast/groom.png' },
      { id: `${item.id}-bride`, label: '신부', imageUrl: '/feelai/workHistory/intro/cast/bride.png' },
    ];
    return {
      personCount: 2,
      cast: { mode: 'separate', personCount: 2, people },
      styleConversions: convertedStyles.map((style) => ({
        style,
        selected: style === item.style,
        people: buildWeddingStylePeople(item.id, style),
      })),
    };
  }

  // 베이비 · 고희연: 한 장 원본 + 영역 지정
  const boxes: WorkHistoryIntroPersonBox[] = [
    { id: `${item.id}-mom`, label: '엄마', top: 18, left: 8, width: 34, height: 52 },
    { id: `${item.id}-dad`, label: '아빠', top: 14, left: 52, width: 36, height: 56 },
    { id: `${item.id}-baby1`, label: '아기', top: 48, left: 22, width: 22, height: 28 },
    { id: `${item.id}-baby2`, label: '아기', top: 46, left: 58, width: 24, height: 30 },
  ];
  return {
    personCount: 4,
    cast: {
      mode: 'group',
      personCount: 4,
      imageUrl: '/feelai/workHistory/intro/cast/family.png',
      boxes,
    },
    styleConversions: convertedStyles.map((style) => ({
      style,
      selected: style === item.style,
      people: buildGroupStylePeople(item.id, style),
    })),
  };
}

function hashSeed(value: string) {
  return [...value].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function shiftMinutes(value: string, minutes: number) {
  const date = new Date(value.replace(' ', 'T'));
  date.setMinutes(date.getMinutes() + minutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function stepForStatus(status: WorkHistoryIntroStatus) {
  if (status === '완료') return 5;
  if (status === '제작중') return 4;
  if (status === '오류') return 3;
  return 2;
}

function buildPipeline(
  item: WorkHistoryIntroItem,
  personCount: number,
  ttsCount: number
): WorkHistoryIntroPipelineStep[] {
  const sceneTotal = item.imageProgress.total;
  const imageCurrent = item.imageProgress.current;
  const videoCurrent = item.videoProgress.current;
  const hasImages = imageCurrent > 0;
  const hasVideos = videoCurrent > 0;
  const imagesComplete = sceneTotal > 0 && imageCurrent >= sceneTotal;
  const videosComplete = sceneTotal > 0 && videoCurrent >= sceneTotal;

  return [
    { key: 'cast', label: '사진·인물 지정', value: `${personCount}명`, done: true },
    { key: 'style', label: '스타일 변환', value: hasImages ? '적용' : '대기', done: hasImages },
    { key: 'story', label: '스토리 · 씬 문구', value: `${sceneTotal}씬`, done: hasImages },
    { key: 'sceneImage', label: '씬 이미지', value: `${imageCurrent}/${sceneTotal}`, done: imagesComplete },
    { key: 'sceneVideo', label: '씬 영상', value: `${videoCurrent}/${sceneTotal}`, done: videosComplete },
    { key: 'narration', label: '배경음(BGM) · 나레이션(TTS)', value: String(ttsCount), done: hasVideos || item.hasFinalVideo },
    {
      key: 'edit',
      label: '편집 (자막·타임라인)',
      value: `${Math.min(videoCurrent, sceneTotal)}씬`,
      done: videosComplete,
    },
    { key: 'final', label: '최종 렌더', value: item.hasFinalVideo ? '완료' : '대기', done: item.hasFinalVideo },
  ];
}

const SCENE_IMAGE_URLS = [
  '/feelai/workHistory/intro/scenes/scene-01.png',
  '/feelai/workHistory/intro/scenes/scene-02.png',
  '/feelai/workHistory/intro/scenes/scene-03.png',
  '/feelai/workHistory/intro/scenes/scene-04.png',
] as const;

const SCENE_STORY_TEMPLATES = [
  (style: string, category: string) =>
    `${category} 인트로 · ${style} 스타일. 늦은 여름 소나기 속 오래된 정류장 앞. 볼륨 라이팅으로 푸른 빗줄기와 따뜻한 가로등이 대비되고, 두 인물이 서로를 바라보며 우산을 나눠 쓴다. 와이드 앵글로 분위기 있는 첫 만남을 담는다.`,
  (style: string, _category: string) =>
    `${style} 스타일 산책 씬. 벚꽃 잎이 흩날리는 골목길을 나란히 걸으며, 손에 든 작은 책을 함께 펼쳐 본다. 카메라가 천천히 따라가며 따뜻한 오후 빛을 강조한다.`,
  (style: string, _category: string) =>
    `${style} 스타일 클로즈업. 벤치에 앉아 마주 보고 웃는 두 인물. 눈빛과 손짓의 미세한 움직임을 미디엄 샷으로 포착하고, 배경 벚꽃은 얕은 심도로 처리한다.`,
  (style: string, category: string) =>
    `${category} 하이라이트 씬 · ${style}. 넓은 공원 전경에서 인물이 작아 보이게 잡고, 하늘과 나무 사이로 떨어지는 꽃잎을 메인 모션으로 연출한다.`,
  (_style: string, _category: string) =>
    `실내 창가에서 비가 흘러내리는 유리에 비친 실루엣. 부드러운 카메라 푸시인으로 감정선이 고조되고, 배경 음악은 잔잔한 피아노 톤을 유지한다.`,
  (style: string, _category: string) =>
    `${style} 스타일 전환 씬. 낮에서 황혼으로 시간이 바뀌며 색온도가 따뜻해진다. 두 인물이 손을 잡고 프레임 밖으로 걸어 나가는 엔딩 톤.`,
  (_style: string, _category: string) =>
    `버스가 도착하는 순간. 헤드라이트 플레어와 빗방울 파티클이 강조되고, 인물이 서로를 찾는 듯 고개를 돌리는 짧은 리액션 컷.`,
  (style: string, _category: string) =>
    `${style} 스타일 추억 플래시백. 살짝 과포화된 색감과 느린 모션으로 과거 장면을 암시하고, 다시 현재로 컷백한다.`,
  (_style: string, _category: string) =>
    `벤치 위 책을 함께 읽는 장면. 페이지가 넘어가는 디테일과 미소 교환을 클로즈업으로 연결하고, 주변 환경음은 낮춘다.`,
  (style: string, category: string) =>
    `${category} 피날레 · ${style}. 두 인물이 화면 중앙에서 포즈를 맞추고, 카메라가 천천히 뒤로 빠지며 타이틀 여백을 남긴다.`,
] as const;

const SCENE_SUBTITLES = [
  null,
  '이 비 냄새… 처음 만났던 날 같네.',
  null,
  '같이 걸을까?',
  '조금만 더 있어 줄래?',
  null,
  '정류장에서 기다릴게.',
  null,
  '이 페이지… 우리 이야기 같아.',
  '끝은 또 다른 시작이야.',
] as const;

function sceneAssetStatus(
  index: number,
  current: number,
  total: number,
  failed: boolean
): WorkHistoryIntroSceneAssetStatus {
  if (failed && index === Math.max(0, current)) return '실패';
  if (index < current) return '완료';
  if (index === current && current < total) return '생성중';
  return '대기';
}

function buildScenes(item: WorkHistoryIntroItem): WorkHistoryIntroScene[] {
  const total = item.imageProgress.total;
  const imageFailed = item.status === '오류' && Boolean(item.failReason?.includes('이미지'));
  const videoFailed = item.status === '오류' && Boolean(item.failReason) && !imageFailed;

  return Array.from({ length: total }, (_, index) => {
    const imageStatus = sceneAssetStatus(index, item.imageProgress.current, total, imageFailed);
    const videoStatus = sceneAssetStatus(index, item.videoProgress.current, total, videoFailed);
    const storyFn = SCENE_STORY_TEMPLATES[index % SCENE_STORY_TEMPLATES.length];
    const story = storyFn(item.style, item.category);

    return {
      id: `${item.id}-scene-${index + 1}`,
      index: index + 1,
      imageStatus,
      videoStatus,
      imageUrl: imageStatus === '완료' || imageStatus === '생성중' ? SCENE_IMAGE_URLS[index % SCENE_IMAGE_URLS.length] : null,
      videoUrl:
        videoStatus === '완료' || videoStatus === '생성중' ? SAMPLE_FINAL_VIDEO_URL : null,
      story,
      subtitle: SCENE_SUBTITLES[index % SCENE_SUBTITLES.length],
    };
  });
}

const SAMPLE_AUDIO_URLS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
] as const;

function audioStamp(registeredAt: string, offsetMinutes: number) {
  const date = new Date(registeredAt.replace(' ', 'T'));
  date.setMinutes(date.getMinutes() + offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildBgmAndNarration(item: WorkHistoryIntroItem): {
  bgm: WorkHistoryIntroBgmSection;
  narration: WorkHistoryIntroNarrationSection;
} {
  const hasAudioHistory = item.hasFinalVideo || item.videoProgress.current > 0 || item.status === '제작중';

  if (!hasAudioHistory) {
    return {
      bgm: { mode: 'ai', volume: 0.4, mood: 'cinematic', clips: [] },
      narration: { speaker: 'el_dohyeon', volume: 0.76, clips: [] },
    };
  }

  const moods = ['cinematic', 'pop', 'warm', 'soft'] as const;
  const bgmCount = item.hasFinalVideo ? 5 : 3;
  const narrationCount = item.hasFinalVideo ? 6 : item.status === '제작중' ? 4 : 2;

  const bgmClips: WorkHistoryIntroAudioClip[] = Array.from({ length: bgmCount }, (_, index) => {
    const mood = moods[index % moods.length];
    const isFinal = item.hasFinalVideo && index === 0;
    return {
      id: `${item.id}-bgm-${index + 1}`,
      audioUrl: SAMPLE_AUDIO_URLS[index % SAMPLE_AUDIO_URLS.length],
      createdAt: audioStamp(item.registeredAt, 40 + index * 12),
      label: mood,
      isFinal,
    };
  });

  const narrationClips: WorkHistoryIntroAudioClip[] = Array.from({ length: narrationCount }, (_, index) => ({
    id: `${item.id}-tts-${index + 1}`,
    audioUrl: SAMPLE_AUDIO_URLS[(index + 1) % SAMPLE_AUDIO_URLS.length],
    createdAt: audioStamp(item.registeredAt, 45 + index * 3),
    label: `#${index + 1}`,
  }));

  return {
    bgm: {
      mode: 'ai',
      volume: 0.4,
      mood: bgmClips.find((clip) => clip.isFinal)?.label ?? moods[0],
      clips: bgmClips,
    },
    narration: {
      speaker: 'el_dohyeon',
      volume: 0.76,
      clips: narrationClips,
    },
  };
}

const TIMELINE_TRANSITIONS: WorkHistoryIntroTimelineTransition[] = [
  'fade',
  'slide',
  'cut',
  'dissolve',
  'wipe',
];
const TIMELINE_SPEEDS = [0.8, 1, 1.2, 1.5] as const;

function buildTimeline(
  item: WorkHistoryIntroItem,
  scenes: WorkHistoryIntroScene[]
): WorkHistoryIntroTimelineClip[] {
  const rendered = scenes.filter((scene) => scene.videoStatus === '완료' && scene.videoUrl);
  if (rendered.length === 0) return [];

  const seed = hashSeed(item.id);

  return rendered.map((scene, index) => {
    const totalDurationSec = 8 + ((seed + scene.index) % 5) * 2; // 8~16초
    const useStartSec = (seed + index) % 3; // 0~2초
    const useLength = Math.max(3, Math.min(totalDurationSec - useStartSec, 4 + ((seed + index) % 4)));
    const useEndSec = Math.min(totalDurationSec, useStartSec + useLength);
    const speed = TIMELINE_SPEEDS[(seed + index) % TIMELINE_SPEEDS.length];
    const transitionIn = TIMELINE_TRANSITIONS[(seed + index) % TIMELINE_TRANSITIONS.length];
    const transitionOut = TIMELINE_TRANSITIONS[(seed + index + 2) % TIMELINE_TRANSITIONS.length];

    return {
      id: `${item.id}-timeline-${scene.index}`,
      sceneIndex: scene.index,
      thumbnailUrl: scene.imageUrl,
      totalDurationSec,
      useStartSec,
      useEndSec,
      speed,
      transitionIn,
      transitionOut,
      videoName: `scene-${String(scene.index).padStart(2, '0')}.mp4`,
      videoUrl: scene.videoUrl!,
    };
  });
}

const TOKEN_USAGE_STEPS = [
  '사진·인물 지정',
  '스타일 변환',
  '씬 이미지',
  '씬 영상',
  '나레이션(TTS)',
  '최종 렌더',
] as const;

const API_COST_MODELS = ['gemini-2.5-flash', 'veo-2', 'eleven_multilingual_v2', 'ffmpeg-local'] as const;

function buildTokenAndCost(
  item: WorkHistoryIntroItem
): {
  tokenUsages: WorkHistoryIntroTokenUsage[];
  apiCostEntries: WorkHistoryIntroApiCostEntry[];
} {
  const seed = hashSeed(item.id);
  const stepCount = Math.max(2, Math.min(TOKEN_USAGE_STEPS.length, 2 + (seed % 5)));
  const doneSteps = TOKEN_USAGE_STEPS.slice(0, stepCount);

  let remainingTokens = item.usedTokens;
  const tokenUsages: WorkHistoryIntroTokenUsage[] = doneSteps.map((step, index) => {
    const isLast = index === doneSteps.length - 1;
    const share = isLast ? remainingTokens : Math.max(1, Math.floor(item.usedTokens / doneSteps.length) + ((seed + index) % 5));
    const tokens = isLast ? Math.max(0, remainingTokens) : Math.min(remainingTokens, share);
    remainingTokens -= tokens;
    return {
      id: `${item.id}-token-${index + 1}`,
      occurredAt: shiftMinutes(item.registeredAt, 8 + index * 7),
      step,
      tokens,
    };
  });

  let remainingCost = item.apiCost;
  const apiCostEntries: WorkHistoryIntroApiCostEntry[] = doneSteps.map((step, index) => {
    const isLast = index === doneSteps.length - 1;
    const share = isLast
      ? remainingCost
      : Math.max(100, Math.floor(item.apiCost / doneSteps.length) + ((seed + index) % 7) * 50);
    const costKrw = isLast ? Math.max(0, remainingCost) : Math.min(remainingCost, share);
    remainingCost -= costKrw;
    return {
      id: `${item.id}-api-${index + 1}`,
      occurredAt: shiftMinutes(item.registeredAt, 9 + index * 7),
      feature: step,
      model: API_COST_MODELS[(seed + index) % API_COST_MODELS.length],
      costKrw,
      costUsd: (costKrw / 15750).toFixed(4),
    };
  });

  return { tokenUsages, apiCostEntries };
}

function buildFailures(item: WorkHistoryIntroItem): WorkHistoryIntroFailure[] {
  if (item.status !== '오류' || !item.failReason) return [];

  const seed = hashSeed(item.id);
  const isImage = item.failReason.includes('이미지');
  const primaryStep = isImage ? '씬 이미지' : '씬 영상';
  const failures: WorkHistoryIntroFailure[] = [
    {
      id: `${item.id}-fail-1`,
      occurredAt: shiftMinutes(item.registeredAt, 22),
      step: primaryStep,
      reason: item.failReason,
    },
  ];

  if (seed % 2 === 0) {
    failures.push({
      id: `${item.id}-fail-2`,
      occurredAt: shiftMinutes(item.registeredAt, 26),
      step: '최종 렌더',
      reason: '선행 단계 실패로 렌더 중단',
    });
  }

  return failures;
}

export function getWorkHistoryIntroDetailById(id: string | undefined): WorkHistoryIntroDetail | undefined {
  const item = getWorkHistoryIntroItemById(id);
  if (!item) return undefined;

  const seed = hashSeed(item.id);
  const { cast, styleConversions, personCount } = buildCastAndStyles(item);
  const { bgm, narration } = buildBgmAndNarration(item);
  const scenes = buildScenes(item);
  const timeline = buildTimeline(item, scenes);
  const { tokenUsages, apiCostEntries } = buildTokenAndCost(item);
  const failures = buildFailures(item);
  const ttsCount = Math.max(narration.clips.length, 2);
  const updatedMinutes = item.status === '완료' ? 28 : item.status === '제작중' ? 12 : 5;

  return {
    ...item,
    sceneCount: item.imageProgress.total,
    personCount,
    ttsCount,
    transition: WORK_HISTORY_INTRO_TRANSITIONS[seed % WORK_HISTORY_INTRO_TRANSITIONS.length],
    step: stepForStatus(item.status),
    updatedAt: shiftMinutes(item.registeredAt, updatedMinutes),
    apiCostUsd: (item.apiCost / 15750).toFixed(4),
    finalVideoUrl: item.hasFinalVideo ? SAMPLE_FINAL_VIDEO_URL : null,
    finalVideoPosterUrl: item.hasFinalVideo
      ? item.ratio === '9:16'
        ? SAMPLE_FINAL_VIDEO_POSTER_9X16_URL
        : SAMPLE_FINAL_VIDEO_POSTER_URL
      : null,
    pipelineSteps: buildPipeline(item, personCount, ttsCount),
    cast,
    styleConversions,
    scenes,
    bgm,
    narration,
    timeline,
    tokenUsages,
    apiCostEntries,
    failures,
  };
}
