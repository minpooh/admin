export const TOKEN_PRICE_KINDS = ['차감', '지급'] as const;
export type TokenPriceKind = (typeof TOKEN_PRICE_KINDS)[number];

export type TokenPriceItem = {
  id: string;
  label: string;
  description: string;
  kind: TokenPriceKind;
  tokens: number;
  updatedBy: string;
  updatedAt: string;
};

export const MOCK_TOKEN_PRICE_ITEMS: TokenPriceItem[] = [
  {
    id: 'img_edit',
    label: '부분수정(인페인팅)',
    description: 'img_edit',
    kind: '차감',
    tokens: 10,
    updatedBy: 'choibs',
    updatedAt: '2026-07-30 16:56:11',
  },
  {
    id: 'scene_img',
    label: '씬 이미지 생성 (i2i)',
    description: 'scene_img',
    kind: '차감',
    tokens: 15,
    updatedBy: 'photoyoda',
    updatedAt: '2026-07-19 01:34:45',
  },
  {
    id: 'scene_vid',
    label: '씬 영상 생성 (i2v)',
    description: 'scene_vid',
    kind: '차감',
    tokens: 20,
    updatedBy: 'seed',
    updatedAt: '2026-07-13 22:21:59',
  },
  {
    id: 'preview',
    label: '캐릭터 변환·스타일 재생성',
    description: 'preview',
    kind: '차감',
    tokens: 10,
    updatedBy: 'choibs',
    updatedAt: '2026-07-14 00:12:01',
  },
  {
    id: 'prompt_conv',
    label: '영상 프롬프트 변환',
    description: 'prompt_conv',
    kind: '차감',
    tokens: 3,
    updatedBy: 'seed',
    updatedAt: '2026-07-13 22:21:59',
  },
  {
    id: 'tts',
    label: '나레이션(TTS) 생성',
    description: 'tts',
    kind: '차감',
    tokens: 0,
    updatedBy: 'seed',
    updatedAt: '2026-07-13 22:21:59',
  },
  {
    id: 'tts_premium',
    label: '프리미엄 음성 (일레븐랩스)',
    description: 'tts_premium',
    kind: '차감',
    tokens: 8,
    updatedBy: 'photoyoda',
    updatedAt: '2026-07-19 23:48:20',
  },
  {
    id: 'bgm',
    label: 'AI 배경음악 생성',
    description: 'bgm',
    kind: '차감',
    tokens: 8,
    updatedBy: 'photoyoda',
    updatedAt: '2026-07-19 23:48:20',
  },
  {
    id: 'render',
    label: '최종 렌더링',
    description: 'render',
    kind: '차감',
    tokens: 0,
    updatedBy: 'seed',
    updatedAt: '2026-07-13 22:21:59',
  },
  {
    id: 'signup',
    label: '가입 웰컴 지급',
    description: 'signup',
    kind: '지급',
    tokens: 0,
    updatedBy: 'choibs',
    updatedAt: '2026-07-20 10:56:02',
  },
];
