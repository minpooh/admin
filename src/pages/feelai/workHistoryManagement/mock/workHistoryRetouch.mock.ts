export type WorkHistoryRetouchItem = {
  id: string;
  accountId: string;
  photoCount: number;
  photoOpenCount: number;
  savedRetouchCount: number;
  usedTokens: number;
  deductedTokens: number;
  returnedTokens: number;
  apiCost: number;
  lastActivityAt: string;
};

export const MOCK_WORK_HISTORY_RETOUCH_ITEMS: WorkHistoryRetouchItem[] = [
  {
    id: 'retouch-1',
    accountId: 'feelai_mj',
    photoCount: 60,
    photoOpenCount: 48,
    savedRetouchCount: 48,
    usedTokens: 206,
    deductedTokens: 230,
    returnedTokens: 24,
    apiCost: 31400,
    lastActivityAt: '2026-09-18 09:12:44',
  },
  {
    id: 'retouch-2',
    accountId: 'kimcs',
    photoCount: 12,
    photoOpenCount: 9,
    savedRetouchCount: 8,
    usedTokens: 42,
    deductedTokens: 48,
    returnedTokens: 6,
    apiCost: 6400,
    lastActivityAt: '2026-09-18 11:08:15',
  },
  {
    id: 'retouch-3',
    accountId: 'park_yh',
    photoCount: 8,
    photoOpenCount: 6,
    savedRetouchCount: 6,
    usedTokens: 28,
    deductedTokens: 32,
    returnedTokens: 4,
    apiCost: 4200,
    lastActivityAt: '2026-09-16 13:22:51',
  },
  {
    id: 'retouch-4',
    accountId: 'choi_dn',
    photoCount: 20,
    photoOpenCount: 16,
    savedRetouchCount: 14,
    usedTokens: 64,
    deductedTokens: 72,
    returnedTokens: 8,
    apiCost: 9800,
    lastActivityAt: '2026-09-15 18:03:27',
  },
  {
    id: 'retouch-5',
    accountId: 'lee_hr',
    photoCount: 16,
    photoOpenCount: 12,
    savedRetouchCount: 12,
    usedTokens: 51,
    deductedTokens: 58,
    returnedTokens: 7,
    apiCost: 7600,
    lastActivityAt: '2026-09-14 10:46:09',
  },
  {
    id: 'retouch-6',
    accountId: 'kang_ej',
    photoCount: 10,
    photoOpenCount: 4,
    savedRetouchCount: 4,
    usedTokens: 22,
    deductedTokens: 28,
    returnedTokens: 6,
    apiCost: 3300,
    lastActivityAt: '2026-09-13 20:11:33',
  },
  {
    id: 'retouch-7',
    accountId: 'seo_jw',
    photoCount: 28,
    photoOpenCount: 24,
    savedRetouchCount: 22,
    usedTokens: 94,
    deductedTokens: 110,
    returnedTokens: 16,
    apiCost: 14200,
    lastActivityAt: '2026-09-12 08:55:18',
  },
  {
    id: 'retouch-8',
    accountId: 'baek_sh',
    photoCount: 6,
    photoOpenCount: 0,
    savedRetouchCount: 0,
    usedTokens: 8,
    deductedTokens: 12,
    returnedTokens: 4,
    apiCost: 1200,
    lastActivityAt: '2026-09-11 19:38:26',
  },
];

export function getWorkHistoryRetouchItemById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_WORK_HISTORY_RETOUCH_ITEMS.find((item) => item.id === id || item.accountId === id);
}

export type WorkHistoryRetouchHistoryStatus = '처리완료' | '실패';

export type WorkHistoryRetouchPhotoHistoryItem = {
  id: string;
  occurredAt: string;
  action: string;
  resultImageUrl: string;
  status: WorkHistoryRetouchHistoryStatus;
  saved: boolean;
  prompt?: string;
};

export type WorkHistoryRetouchPhoto = {
  id: string;
  accountId: string;
  fileName: string;
  sizeLabel: string;
  widthPx: number;
  heightPx: number;
  saveCount: number;
  aiRequestCount: number;
  thumbnailUrl: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  history: WorkHistoryRetouchPhotoHistoryItem[];
};

export type WorkHistoryRetouchApiUsage = {
  id: string;
  accountId: string;
  occurredAt: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  apiCost: number;
  basis: string;
};

type RetouchChangeKind = '피부보정' | '헤어스타일 변경' | '의상 변경';

const RETOUCH_IMAGE_PAIRS: Array<{
  before: string;
  after: string;
  thumb: string;
  change: RetouchChangeKind;
  prompt: string;
}> = [
  {
    before: '/feelai/workHistory/retouch/kr-retouch-01-before.png',
    after: '/feelai/workHistory/retouch/kr-retouch-01-after.png',
    thumb: '/feelai/workHistory/retouch/kr-retouch-01-before.png',
    change: '피부보정',
    prompt: '피부 톤을 고르게 맞추고 잡티와 홍조를 줄여 주세요.',
  },
  {
    before: '/feelai/workHistory/retouch/kr-retouch-02-before.png',
    after: '/feelai/workHistory/retouch/kr-retouch-02-after.png',
    thumb: '/feelai/workHistory/retouch/kr-retouch-02-before.png',
    change: '피부보정',
    prompt: '얼굴 잡티를 정리하고 피부결을 매끈하게 보정해 주세요.',
  },
  {
    before: '/feelai/workHistory/retouch/kr-retouch-03-before.png',
    after: '/feelai/workHistory/retouch/kr-retouch-03-after.png',
    thumb: '/feelai/workHistory/retouch/kr-retouch-03-before.png',
    change: '헤어스타일 변경',
    prompt: '긴 웨이브 머리를 단정한 단발 보브컷으로 바꿔 주세요.',
  },
  {
    before: '/feelai/workHistory/retouch/kr-retouch-04-before.png',
    after: '/feelai/workHistory/retouch/kr-retouch-04-after.png',
    thumb: '/feelai/workHistory/retouch/kr-retouch-04-before.png',
    change: '의상 변경',
    prompt: '흰 티셔츠를 아이보리 실크 블라우스로 바꿔 주세요.',
  },
  {
    before: '/feelai/workHistory/retouch/kr-retouch-05-before.png',
    after: '/feelai/workHistory/retouch/kr-retouch-05-after.png',
    thumb: '/feelai/workHistory/retouch/kr-retouch-05-before.png',
    change: '헤어스타일 변경',
    prompt: '귀를 덮은 머리를 짧은 페이드 컷으로 다듬어 주세요.',
  },
  {
    before: '/feelai/workHistory/retouch/kr-retouch-06-before.png',
    after: '/feelai/workHistory/retouch/kr-retouch-06-after.png',
    thumb: '/feelai/workHistory/retouch/kr-retouch-06-before.png',
    change: '의상 변경',
    prompt: '검은 후드티를 버건디 블레이저와 흰 블라우스로 바꿔 주세요.',
  },
];

function retouchImagePairFor(accountId: string, index: number) {
  let hash = 0;
  for (const char of `${accountId}:${index}`) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return RETOUCH_IMAGE_PAIRS[hash % RETOUCH_IMAGE_PAIRS.length];
}

const RETOUCH_FEATURE_MODELS: Record<RetouchChangeKind, { feature: string; model: string }> = {
  피부보정: { feature: '피부보정', model: 'gemini-2.5-flash-image' },
  '헤어스타일 변경': { feature: '헤어스타일 변경', model: 'gemini-2.5-pro' },
  '의상 변경': { feature: '의상 변경', model: 'gpt-image-1' },
};

function formatDateTime(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function parseDateTime(value: string) {
  return new Date(value.replace(' ', 'T'));
}

function shiftDateTime(value: string, offsetSeconds: number) {
  const date = parseDateTime(value);
  date.setSeconds(date.getSeconds() + offsetSeconds);
  return formatDateTime(date);
}

type PhotoSeed = {
  fileName: string;
  sizeLabel: string;
  widthPx?: number;
  heightPx?: number;
  aiActions: string[];
  saveCount: number;
};

const PHOTO_PX_VARIANTS = [
  [4032, 3024],
  [5472, 3648],
  [4000, 3000],
  [5184, 3456],
] as const;

function photoPixelSize(fileName: string, index: number, seed: PhotoSeed) {
  if (seed.widthPx && seed.heightPx) return { widthPx: seed.widthPx, heightPx: seed.heightPx };
  if (/portrait|id_photo|poster/.test(fileName)) return { widthPx: 3000, heightPx: 4000 };
  if (/group|ceremony|family|stage/.test(fileName)) return { widthPx: 6000, heightPx: 4000 };
  if (/\.webp$/i.test(fileName)) return { widthPx: 1920, heightPx: 1080 };
  if (/\.png$/i.test(fileName)) return { widthPx: 3840, heightPx: 2160 };
  const [widthPx, heightPx] = PHOTO_PX_VARIANTS[index % PHOTO_PX_VARIANTS.length];
  return { widthPx, heightPx };
}

function buildPhoto(accountId: string, index: number, lastActivityAt: string, seed: PhotoSeed): WorkHistoryRetouchPhoto {
  const baseOffset = -index * 3600 - 240;
  const registeredAt = shiftDateTime(lastActivityAt, baseOffset);
  const images = retouchImagePairFor(accountId, index);
  const history: WorkHistoryRetouchPhotoHistoryItem[] = [
    {
      id: `${accountId}-photo-${index + 1}-h1`,
      occurredAt: registeredAt,
      action: '원본 등록',
      resultImageUrl: images.before,
      status: '처리완료',
      saved: false,
    },
  ];

  const hasAiRequest = seed.aiActions.length > 0;
  const aiFailed = hasAiRequest && (index + accountId.length) % 7 === 3;
  let lastResultImageUrl = images.before;

  if (hasAiRequest) {
    const succeeded = !aiFailed;
    lastResultImageUrl = succeeded ? images.after : images.before;
    history.push({
      id: `${accountId}-photo-${index + 1}-h${history.length + 1}`,
      occurredAt: shiftDateTime(registeredAt, 42),
      action: `AI ${images.change} 요청`,
      resultImageUrl: lastResultImageUrl,
      status: succeeded ? '처리완료' : '실패',
      saved: false,
      prompt: images.prompt,
    });
  }

  if (seed.saveCount > 0 && lastResultImageUrl === images.after) {
    history.push({
      id: `${accountId}-photo-${index + 1}-h${history.length + 1}`,
      occurredAt: shiftDateTime(registeredAt, 90),
      action: '보정 저장',
      resultImageUrl: images.after,
      status: '처리완료',
      saved: true,
    });
  }

  const { widthPx, heightPx } = photoPixelSize(seed.fileName, index, seed);
  const aiRequestCount = history.filter((item) => item.action.startsWith('AI ')).length;
  const saveCount = history.filter((item) => item.saved).length;

  return {
    id: `${accountId}-photo-${index + 1}`,
    accountId,
    fileName: seed.fileName,
    sizeLabel: seed.sizeLabel,
    widthPx,
    heightPx,
    saveCount,
    aiRequestCount,
    thumbnailUrl: images.thumb,
    beforeImageUrl: images.before,
    afterImageUrl: lastResultImageUrl === images.after ? images.after : images.before,
    history,
  };
}

function buildApiUsages(photos: WorkHistoryRetouchPhoto[]): WorkHistoryRetouchApiUsage[] {
  const rows: WorkHistoryRetouchApiUsage[] = [];

  photos.forEach((photo) => {
    photo.history
      .filter((item) => item.action.startsWith('AI '))
      .forEach((item, index) => {
        const featureName = item.action.replace(/^AI /, '').replace(/ 요청$/, '') as RetouchChangeKind;
        const mapped = RETOUCH_FEATURE_MODELS[featureName] ?? RETOUCH_FEATURE_MODELS.피부보정;
        const inputTokens = 980 + index * 120 + photo.fileName.length * 8;
        const outputTokens = 420 + index * 80 + photo.saveCount * 16;
        rows.push({
          id: `${photo.id}-api-${index + 1}`,
          accountId: photo.accountId,
          occurredAt: item.occurredAt,
          feature: mapped.feature,
          model: mapped.model,
          inputTokens,
          outputTokens,
          apiCost: 180 + index * 90 + photo.aiRequestCount * 40,
          basis: `${photo.fileName} · ${mapped.feature} 요청`,
        });
      });
  });

  return rows.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
}

const PHOTO_SEEDS_BY_ACCOUNT: Record<string, PhotoSeed[]> = {
  feelai_mj: [
    { fileName: 'wedding_001.jpg', sizeLabel: '3.2MB', aiActions: ['피부보정', '컬러보정'], saveCount: 2 },
    { fileName: 'wedding_002.jpg', sizeLabel: '2.8MB', aiActions: ['배경정리'], saveCount: 1 },
    { fileName: 'wedding_group.png', sizeLabel: '5.1MB', aiActions: ['얼굴보정', '리터칭', '컬러보정'], saveCount: 3 },
    { fileName: 'studio_main.jpg', sizeLabel: '4.0MB', aiActions: ['피부보정'], saveCount: 1 },
    { fileName: 'studio_sub.jpg', sizeLabel: '1.9MB', aiActions: ['배경정리', '컬러보정'], saveCount: 2 },
    { fileName: 'snap_01.jpeg', sizeLabel: '2.2MB', aiActions: ['리터칭'], saveCount: 1 },
    { fileName: 'snap_02.jpeg', sizeLabel: '2.4MB', aiActions: ['피부보정', '얼굴보정'], saveCount: 2 },
    { fileName: 'closing.webp', sizeLabel: '1.1MB', aiActions: ['컬러보정'], saveCount: 1 },
  ],
  kimcs: [
    { fileName: 'baby_01.jpg', sizeLabel: '2.6MB', aiActions: ['피부보정'], saveCount: 1 },
    { fileName: 'baby_02.jpg', sizeLabel: '2.1MB', aiActions: ['배경정리', '컬러보정'], saveCount: 2 },
    { fileName: 'family.png', sizeLabel: '3.8MB', aiActions: ['얼굴보정'], saveCount: 1 },
    { fileName: 'studio_cut.jpg', sizeLabel: '1.7MB', aiActions: ['리터칭'], saveCount: 1 },
    { fileName: 'profile.jpg', sizeLabel: '1.4MB', aiActions: ['피부보정'], saveCount: 1 },
    { fileName: 'cover.webp', sizeLabel: '0.9MB', aiActions: ['컬러보정'], saveCount: 1 },
  ],
  park_yh: [
    { fileName: 'portrait_01.jpg', sizeLabel: '2.0MB', aiActions: ['피부보정'], saveCount: 1 },
    { fileName: 'portrait_02.jpg', sizeLabel: '2.3MB', aiActions: ['컬러보정'], saveCount: 1 },
    { fileName: 'outdoor.png', sizeLabel: '3.4MB', aiActions: ['배경정리'], saveCount: 1 },
    { fileName: 'id_photo.jpg', sizeLabel: '1.2MB', aiActions: ['얼굴보정'], saveCount: 1 },
  ],
  choi_dn: [
    { fileName: 'event_01.jpg', sizeLabel: '3.6MB', aiActions: ['피부보정', '리터칭'], saveCount: 2 },
    { fileName: 'event_02.jpg', sizeLabel: '2.9MB', aiActions: ['배경정리'], saveCount: 1 },
    { fileName: 'event_03.jpg', sizeLabel: '3.1MB', aiActions: ['컬러보정'], saveCount: 1 },
    { fileName: 'speaker.png', sizeLabel: '2.5MB', aiActions: ['얼굴보정'], saveCount: 1 },
    { fileName: 'stage.jpeg', sizeLabel: '4.4MB', aiActions: ['리터칭', '컬러보정'], saveCount: 2 },
    { fileName: 'banner.webp', sizeLabel: '1.3MB', aiActions: ['배경정리'], saveCount: 1 },
  ],
  lee_hr: [
    { fileName: 'lookbook_01.jpg', sizeLabel: '2.7MB', aiActions: ['피부보정'], saveCount: 1 },
    { fileName: 'lookbook_02.jpg', sizeLabel: '2.5MB', aiActions: ['컬러보정', '리터칭'], saveCount: 2 },
    { fileName: 'lookbook_03.jpg', sizeLabel: '2.8MB', aiActions: ['얼굴보정'], saveCount: 1 },
    { fileName: 'campaign.png', sizeLabel: '3.9MB', aiActions: ['배경정리'], saveCount: 1 },
    { fileName: 'detail.webp', sizeLabel: '1.0MB', aiActions: ['컬러보정'], saveCount: 1 },
  ],
  kang_ej: [
    { fileName: 'class_01.jpg', sizeLabel: '1.8MB', aiActions: ['피부보정'], saveCount: 1 },
    { fileName: 'class_02.jpg', sizeLabel: '2.0MB', aiActions: ['배경정리'], saveCount: 1 },
    { fileName: 'group.png', sizeLabel: '3.3MB', aiActions: ['얼굴보정'], saveCount: 1 },
    { fileName: 'poster.jpg', sizeLabel: '1.6MB', aiActions: ['컬러보정'], saveCount: 1 },
  ],
  seo_jw: [
    { fileName: 'bridal_01.jpg', sizeLabel: '3.0MB', aiActions: ['피부보정', '컬러보정'], saveCount: 2 },
    { fileName: 'bridal_02.jpg', sizeLabel: '2.9MB', aiActions: ['얼굴보정'], saveCount: 1 },
    { fileName: 'ceremony.png', sizeLabel: '4.7MB', aiActions: ['배경정리', '리터칭'], saveCount: 2 },
    { fileName: 'ring.jpg', sizeLabel: '1.5MB', aiActions: ['컬러보정'], saveCount: 1 },
    { fileName: 'dress.jpeg', sizeLabel: '3.5MB', aiActions: ['피부보정'], saveCount: 1 },
    { fileName: 'thanks.webp', sizeLabel: '0.8MB', aiActions: ['리터칭'], saveCount: 1 },
  ],
  baek_sh: [
    { fileName: 'sample_01.jpg', sizeLabel: '1.9MB', aiActions: [], saveCount: 0 },
    { fileName: 'sample_02.jpg', sizeLabel: '2.1MB', aiActions: [], saveCount: 0 },
    { fileName: 'sample_03.png', sizeLabel: '2.4MB', aiActions: [], saveCount: 0 },
  ],
};

export const MOCK_WORK_HISTORY_RETOUCH_PHOTOS: WorkHistoryRetouchPhoto[] = MOCK_WORK_HISTORY_RETOUCH_ITEMS.flatMap((item) => {
  const seeds = PHOTO_SEEDS_BY_ACCOUNT[item.accountId] ?? [];
  return seeds.map((seed, index) => buildPhoto(item.accountId, index, item.lastActivityAt, seed));
});

export const MOCK_WORK_HISTORY_RETOUCH_API_USAGES: WorkHistoryRetouchApiUsage[] = buildApiUsages(MOCK_WORK_HISTORY_RETOUCH_PHOTOS);

export function getWorkHistoryRetouchPhotosByAccountId(accountId: string | undefined) {
  if (!accountId) return [];
  return MOCK_WORK_HISTORY_RETOUCH_PHOTOS.filter((photo) => photo.accountId === accountId);
}

export function getWorkHistoryRetouchApiUsagesByAccountId(accountId: string | undefined) {
  if (!accountId) return [];
  return MOCK_WORK_HISTORY_RETOUCH_API_USAGES.filter((row) => row.accountId === accountId);
}
