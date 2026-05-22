/** 필프레임 · 리뷰관리 · 리뷰 목록 목업 */

export type FeelframeReviewStatus = '대기' | '처리중' | '답변완료';

export type FeelframeReviewThreadEntry = {
  id: string;
  role: 'user' | 'admin';
  authorName: string;
  createdAt: string;
  body: string;
};

export type FeelframeReviewAttachment = {
  id: string;
  fileName: string;
  url: string;
};

export type FeelframeReviewRow = {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  email: string;
  phone: string;
  isMember: boolean;
  category: string;
  status: FeelframeReviewStatus;
  createdAt: string;
  answeredAt: string | null;
  answeredBy: string | null;
  content: string;
  rating: 1 | 2 | 3 | 4 | 5;
  productId: string;
  productName: string;
  productCategory: string;
  productPrice: string;
  productImageUrl: string;
};

export const MOCK_FEELFRAME_REVIEWS: FeelframeReviewRow[] = [
  {
    id: 'REV-240315-001',
    title: '액자 퀄리티가 기대 이상이에요',
    authorId: 'rv_user01',
    authorName: '김하늘',
    email: 'haneul.kim@example.com',
    phone: '010-1234-5678',
    isMember: true,
    category: '액자',
    status: '답변완료',
    createdAt: '2024-03-15 10:22',
    answeredAt: '2024-03-15 15:30',
    answeredBy: '김민정',
    content: '인화 색감이 자연스럽고 프레임 마감도 깔끔해요. 거실에 걸었는데 분위기가 확 살아났습니다.',
    rating: 5,
    productId: 'PRD-FR-1001',
    productName: '메탈 프레임 12R',
    productCategory: '액자 · 메탈',
    productPrice: '₩49,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1001/960/540',
  },
  {
    id: 'REV-240314-002',
    title: '전체적으로 만족하지만 매트 여백이 아쉬워요',
    authorId: 'rv_user02',
    authorName: '이준호',
    email: 'junho.lee@example.com',
    phone: '010-2345-6789',
    isMember: true,
    category: '액자',
    status: '처리중',
    createdAt: '2024-03-14 16:05',
    answeredAt: null,
    answeredBy: null,
    content: '우드 프레임 질감은 마음에 드는데, 요청한 매트 폭보다 좁게 나와 사진이 조금 답답해 보였습니다.',
    rating: 3,
    productId: 'PRD-FR-1002',
    productName: '우드 프레임 클래식',
    productCategory: '액자 · 우드',
    productPrice: '₩58,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1002/960/540',
  },
  {
    id: 'REV-240313-003',
    title: '응대가 친절해서 좋았습니다',
    authorId: 'rv_user03',
    authorName: '박소영',
    email: 'soyoung.park@example.com',
    phone: '010-3456-7890',
    isMember: false,
    category: '고객응대',
    status: '대기',
    createdAt: '2024-03-13 09:18',
    answeredAt: null,
    answeredBy: null,
    content: '액자 사이즈 문의에 빠르게 답변해 주셨고, 인화 비율 맞춤 방법도 자세히 안내해 주셨어요.',
    rating: 4,
    productId: 'PRD-FR-1003',
    productName: '미니 포토액자 세트',
    productCategory: '액자 · 세트',
    productPrice: '₩39,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1003/960/540',
  },
  {
    id: 'REV-240312-004',
    title: '배송 포장이 정말 튼튼해요',
    authorId: 'rv_user04',
    authorName: '최현우',
    email: 'hyunwoo.choi@example.com',
    phone: '010-4567-8901',
    isMember: true,
    category: '배송',
    status: '답변완료',
    createdAt: '2024-03-12 11:40',
    answeredAt: '2024-03-12 14:10',
    answeredBy: '이서연',
    content: '대형 액자인데도 모서리 보호가 꼼꼼해서 파손 없이 도착했습니다. 포장 상태가 인상적이었어요.',
    rating: 5,
    productId: 'PRD-FR-1004',
    productName: '웨딩 액자 A3',
    productCategory: '액자 · 웨딩',
    productPrice: '₩89,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1004/960/540',
  },
  {
    id: 'REV-240311-005',
    title: '가격 대비 괜찮아요',
    authorId: 'rv_user05',
    authorName: '정미라',
    email: 'mira.jung@example.com',
    phone: '010-5678-9012',
    isMember: false,
    category: '가격',
    status: '대기',
    createdAt: '2024-03-11 08:55',
    answeredAt: null,
    answeredBy: null,
    content: '아크릴 액자 가성비는 좋은 편인데, 프레임 색상 옵션이 조금 더 다양했으면 좋겠습니다.',
    rating: 4,
    productId: 'PRD-FR-1005',
    productName: '아크릴 액자 미니',
    productCategory: '액자 · 아크릴',
    productPrice: '₩29,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1005/960/540',
  },
  {
    id: 'REV-240310-006',
    title: '수정 요청 반영이 빨랐어요',
    authorId: 'rv_user06',
    authorName: '강수진',
    email: 'sujin.kang@example.com',
    phone: '010-6789-0123',
    isMember: true,
    category: '수정',
    status: '답변완료',
    createdAt: '2024-03-10 14:22',
    answeredAt: '2024-03-10 18:12',
    answeredBy: '김민정',
    content: '인화 밝기 조정 요청을 당일에 반영해 주셔서 행사 전에 액자를 받을 수 있었습니다.',
    rating: 5,
    productId: 'PRD-FR-1001',
    productName: '메탈 프레임 12R',
    productCategory: '액자 · 메탈',
    productPrice: '₩49,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1001-rev6/960/540',
  },
  {
    id: 'REV-240309-007',
    title: '걸이 부속품이 조금 아쉬웠어요',
    authorId: 'rv_user07',
    authorName: '윤재민',
    email: 'jaemin.yoon@example.com',
    phone: '010-7890-1234',
    isMember: true,
    category: '액자',
    status: '처리중',
    createdAt: '2024-03-09 19:03',
    answeredAt: null,
    answeredBy: null,
    content: '액자 본체는 만족스러운데, 벽걸이용 고리가 약해 보여 대형 액자에는 걱정이 됩니다.',
    rating: 3,
    productId: 'PRD-FR-1006',
    productName: '캔버스 랩',
    productCategory: '액자 · 캔버스',
    productPrice: '₩72,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1006/960/540',
  },
  {
    id: 'REV-240308-008',
    title: '디자인이 세련돼요',
    authorId: 'rv_user08',
    authorName: '한루리',
    email: 'ruri.han@example.com',
    phone: '010-8901-2345',
    isMember: false,
    category: '액자',
    status: '답변완료',
    createdAt: '2024-03-08 09:15',
    answeredAt: '2024-03-08 13:10',
    answeredBy: '이서연',
    content: '원목 원형 액자가 인테리어와 잘 어울려요. 자연스러운 나무결 덕분에 선물용으로도 좋았습니다.',
    rating: 4,
    productId: 'PRD-FR-1007',
    productName: '원목 원형 액자',
    productCategory: '액자 · 우드',
    productPrice: '₩45,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1007/960/540',
  },
  {
    id: 'REV-240307-009',
    title: '제작·배송 속도는 빨랐습니다',
    authorId: 'rv_user09',
    authorName: '도원재',
    email: 'wonjae.do@example.com',
    phone: '010-9012-3456',
    isMember: true,
    category: '일정',
    status: '대기',
    createdAt: '2024-03-07 13:48',
    answeredAt: null,
    answeredBy: null,
    content: '주문 후 3일 만에 액자가 도착했고, 인화 상태도 안정적이었습니다.',
    rating: 4,
    productId: 'PRD-FR-1008',
    productName: '촬영+액자 패키지',
    productCategory: '액자 · 패키지',
    productPrice: '₩128,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1008/960/540',
  },
  {
    id: 'REV-240306-010',
    title: '재구매 의사 있습니다',
    authorId: 'rv_user10',
    authorName: '송하은',
    email: 'haeun.song@example.com',
    phone: '010-0123-4567',
    isMember: true,
    category: '종합',
    status: '답변완료',
    createdAt: '2024-03-06 10:05',
    answeredAt: '2024-03-06 16:22',
    answeredBy: '김민정',
    content: '액자 품질, 포장, 응대 모두 만족합니다. 돌잔치용으로 추가 주문 예정입니다.',
    rating: 5,
    productId: 'PRD-FR-1009',
    productName: '디자인액자 프리미엄',
    productCategory: '액자 · 디자인',
    productPrice: '₩65,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-FR-1009/960/540',
  },
];

export type FeelframeReviewDetailData = FeelframeReviewRow & {
  thread: FeelframeReviewThreadEntry[];
  attachments: FeelframeReviewAttachment[];
};

const REVIEW_ATTACHMENTS_BY_ID: Record<string, FeelframeReviewAttachment[]> = {
  'REV-240315-001': [
    { id: 'att-315-1', fileName: '거실_액자_설치_사진.jpg', url: '#' },
    { id: 'att-315-2', fileName: '인화_색감_확인.png', url: '#' },
  ],
  'REV-240314-002': [{ id: 'att-314-1', fileName: '매트_여백_비교.jpg', url: '#' }],
  'REV-240312-004': [
    { id: 'att-312-1', fileName: '포장_상태_사진.jpg', url: '#' },
    { id: 'att-312-2', fileName: '배송_라벨_캡처.png', url: '#' },
  ],
  'REV-240309-007': [{ id: 'att-309-1', fileName: '걸이_부속_사진.jpg', url: '#' }],
  'REV-240306-010': [{ id: 'att-306-1', fileName: '돌잔치_액자_후기.jpg', url: '#' }],
};

const REVIEW_ADMIN_REPLY_BY_ID: Record<string, string> = {
  'REV-240315-001':
    '소중한 후기 감사합니다. 앞으로도 만족스러운 액자 품질로 보답하겠습니다.',
  'REV-240312-004': '포장 품질에 대한 피드백 감사합니다. 대형 액자 포장 기준을 지속적으로 개선하겠습니다.',
  'REV-240310-006': '빠른 수정 반영에 만족해 주셔서 감사합니다. 행사 일정에 맞춰 전달해 드릴 수 있어 기쁩니다.',
  'REV-240308-008': '원목 원형 액자 후기 남겨 주셔서 감사합니다. 선물용으로도 좋은 선택이셨네요.',
  'REV-240306-010': '재구매 의사 말씀 감사합니다. 돌잔치용 추가 주문도 꼼꼼히 준비해 드리겠습니다.',
};

function adminReplyToThreadEntry(row: FeelframeReviewRow): FeelframeReviewThreadEntry[] {
  if (!row.answeredAt || !row.answeredBy) return [];
  const body = REVIEW_ADMIN_REPLY_BY_ID[row.id];
  if (!body) return [];
  return [
    {
      id: `fr-th-${row.id}-admin-1`,
      role: 'admin',
      authorName: row.answeredBy,
      createdAt: row.answeredAt,
      body,
    },
  ];
}

export function getFeelframeReviewById(id: string): FeelframeReviewRow | undefined {
  return MOCK_FEELFRAME_REVIEWS.find((row) => row.id === id);
}

export function getFeelframeReviewDetailById(id: string): FeelframeReviewDetailData | undefined {
  const row = getFeelframeReviewById(id);
  if (!row) return undefined;
  return {
    ...row,
    thread: adminReplyToThreadEntry(row),
    attachments: REVIEW_ATTACHMENTS_BY_ID[id] ?? [],
  };
}

export function getProductReviewStats(productId: string): { average: number; count: number } {
  const rows = MOCK_FEELFRAME_REVIEWS.filter((r) => r.productId === productId);
  if (rows.length === 0) return { average: 0, count: 0 };
  const sum = rows.reduce((s, r) => s + r.rating, 0);
  return { average: sum / rows.length, count: rows.length };
}

