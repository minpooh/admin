export type ReviewStatus = '대기' | '처리중' | '답변완료';

export type ReviewThreadEntry = {
  id: string;
  role: 'user' | 'admin';
  authorName: string;
  createdAt: string;
  body: string;
};

export type ReviewRow = {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  email: string;
  category: string;
  status: ReviewStatus;
  createdAt: string;
  answeredAt: string | null;
  answeredBy: string | null;
  content: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** 리뷰 대상 상품 (목업) */
  productId: string;
  productName: string;
  productCategory: string;
  productPrice: string;
  /** 16:9 썸네일용 URL (목업) */
  productImageUrl: string;
};

export const MOCK_REVIEWS: ReviewRow[] = [
  {
    id: 'REV-240315-001',
    title: '영상 퀄리티가 기대 이상이에요',
    authorId: 'rv_user01',
    authorName: '김하늘',
    email: 'haneul.kim@example.com',
    category: '영상',
    status: '답변완료',
    createdAt: '2024-03-15 10:22',
    answeredAt: '2024-03-15 15:30',
    answeredBy: '김민정',
    content: '색감 보정이 정말 자연스럽고 결과물 전달도 빨랐어요. 다음에도 이용할 예정입니다.',
    rating: 5,
    productId: 'PRD-VM-1001',
    productName: '웨딩 필름 패키지 (풀옵션)',
    productCategory: '영상 · 패키지',
    productPrice: '₩890,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-VM-1001/960/540',
  },
  {
    id: 'REV-240314-002',
    title: '전체적으로 만족하지만 자막 위치가 아쉬웠어요',
    authorId: 'rv_user02',
    authorName: '이준호',
    email: 'junho.lee@example.com',
    category: '영상',
    status: '처리중',
    createdAt: '2024-03-14 16:05',
    answeredAt: null,
    answeredBy: null,
    content: '편집은 마음에 들었는데 일부 구간에서 자막이 인물 얼굴과 겹쳐 조금 아쉬웠습니다.',
    rating: 3,
    productId: 'PRD-VM-1002',
    productName: '하이라이트 영상 3분',
    productCategory: '영상 · 싱글',
    productPrice: '₩320,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-VM-1002/960/540',
  },
  {
    id: 'REV-240313-003',
    title: '응대가 친절해서 좋았습니다',
    authorId: 'rv_user03',
    authorName: '박소영',
    email: 'soyoung.park@example.com',
    category: '고객응대',
    status: '대기',
    createdAt: '2024-03-13 09:18',
    answeredAt: null,
    answeredBy: null,
    content: '문의 답변 속도가 빠르고 설명이 자세했어요. 초보자도 이해하기 쉬웠습니다.',
    rating: 4,
    productId: 'PRD-SV-2001',
    productName: '스토어팜 샘플 보정',
    productCategory: '보정',
    productPrice: '₩150,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-SV-2001/960/540',
  },
  {
    id: 'REV-240312-004',
    title: '모바일에서도 재생이 잘 됩니다',
    authorId: 'rv_user04',
    authorName: '최현우',
    email: 'hyunwoo.choi@example.com',
    category: '기술',
    status: '답변완료',
    createdAt: '2024-03-12 11:40',
    answeredAt: '2024-03-12 14:10',
    answeredBy: '이서연',
    content: '아이폰/안드로이드 모두 테스트했는데 끊김 없이 재생돼서 만족합니다.',
    rating: 5,
    productId: 'PRD-MX-3001',
    productName: '비디오믹스 프리미엄',
    productCategory: '영상 · 믹스',
    productPrice: '₩450,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-MX-3001/960/540',
  },
  {
    id: 'REV-240311-005',
    title: '가격 대비 괜찮아요',
    authorId: 'rv_user05',
    authorName: '정미라',
    email: 'mira.jung@example.com',
    category: '가격',
    status: '대기',
    createdAt: '2024-03-11 08:55',
    answeredAt: null,
    answeredBy: null,
    content: '가성비는 좋지만 템플릿 선택 폭이 조금 더 넓었으면 좋겠습니다.',
    rating: 4,
    productId: 'PRD-TP-4001',
    productName: '웨딩 템플릿 세트 A',
    productCategory: '템플릿',
    productPrice: '₩99,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-TP-4001/960/540',
  },
  {
    id: 'REV-240310-006',
    title: '수정 요청 반영이 빨랐어요',
    authorId: 'rv_user06',
    authorName: '강수진',
    email: 'sujin.kang@example.com',
    category: '수정',
    status: '답변완료',
    createdAt: '2024-03-10 14:22',
    answeredAt: '2024-03-10 18:12',
    answeredBy: '김민정',
    content: '1차 결과에서 요청드린 부분을 당일에 바로 반영해 주셔서 일정 맞추기 좋았습니다.',
    rating: 5,
    productId: 'PRD-VM-1001',
    productName: '웨딩 필름 패키지 (풀옵션)',
    productCategory: '영상 · 패키지',
    productPrice: '₩890,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-VM-1001-rev6/960/540',
  },
  {
    id: 'REV-240309-007',
    title: '배경음 볼륨이 조금 컸어요',
    authorId: 'rv_user07',
    authorName: '윤재민',
    email: 'jaemin.yoon@example.com',
    category: '영상',
    status: '처리중',
    createdAt: '2024-03-09 19:03',
    answeredAt: null,
    answeredBy: null,
    content: '전체 완성도는 좋았지만 내레이션 대비 배경음이 커서 전달력이 조금 떨어졌습니다.',
    rating: 3,
    productId: 'PRD-VM-1003',
    productName: '인터뷰 + 하이라이트 세트',
    productCategory: '영상 · 패키지',
    productPrice: '₩620,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-VM-1003/960/540',
  },
  {
    id: 'REV-240308-008',
    title: '템플릿이 세련돼요',
    authorId: 'rv_user08',
    authorName: '한루리',
    email: 'ruri.han@example.com',
    category: '템플릿',
    status: '답변완료',
    createdAt: '2024-03-08 09:15',
    answeredAt: '2024-03-08 13:10',
    answeredBy: '이서연',
    content: '브랜드 톤과 잘 맞는 템플릿이 많아서 선택하기 쉬웠습니다.',
    rating: 4,
    productId: 'PRD-TP-4002',
    productName: '돌잔치 모바일 초대장',
    productCategory: '모바일 초대장',
    productPrice: '₩45,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-TP-4002/960/540',
  },
  {
    id: 'REV-240307-009',
    title: '초안 전달 속도는 빨랐습니다',
    authorId: 'rv_user09',
    authorName: '도원재',
    email: 'wonjae.do@example.com',
    category: '일정',
    status: '대기',
    createdAt: '2024-03-07 13:48',
    answeredAt: null,
    answeredBy: null,
    content: '초안은 빠르게 받았고 최종본도 안정적으로 전달되었습니다.',
    rating: 4,
    productId: 'PRD-SV-2002',
    productName: '필보정 10컷',
    productCategory: '보정',
    productPrice: '₩80,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-SV-2002/960/540',
  },
  {
    id: 'REV-240306-010',
    title: '재구매 의사 있습니다',
    authorId: 'rv_user10',
    authorName: '송하은',
    email: 'haeun.song@example.com',
    category: '종합',
    status: '답변완료',
    createdAt: '2024-03-06 10:05',
    answeredAt: '2024-03-06 16:22',
    answeredBy: '김민정',
    content: '결과물, 응대, 속도 모두 만족합니다. 다음 시즌 콘텐츠도 의뢰하려고 합니다.',
    rating: 5,
    productId: 'PRD-MX-3002',
    productName: '시즌 프로모션 믹스',
    productCategory: '영상 · 믹스',
    productPrice: '₩380,000',
    productImageUrl: 'https://picsum.photos/seed/PRD-MX-3002/960/540',
  },
];

const REVIEW_THREADS_BY_ID: Record<string, ReviewThreadEntry[]> = {
  'REV-240314-002': [
    {
      id: 'rth-314-1',
      role: 'user',
      authorName: '이준호',
      createdAt: '2024-03-14 19:10',
      body: '다음에는 자막 안전영역 옵션이 있으면 좋겠습니다.',
    },
  ],
  'REV-240313-003': [
    {
      id: 'rth-313-1',
      role: 'user',
      authorName: '박소영',
      createdAt: '2024-03-13 12:00',
      body: '주말 문의도 빠르게 응답해 주셔서 감사합니다.',
    },
  ],
  'REV-240312-004': [
    {
      id: 'rth-312-1',
      role: 'admin',
      authorName: '이서연',
      createdAt: '2024-03-12 14:10',
      body: '소중한 후기 감사합니다. 다양한 기기 호환성은 계속 점검하겠습니다.',
    },
  ],
  'REV-240310-006': [
    {
      id: 'rth-310-1',
      role: 'admin',
      authorName: '김민정',
      createdAt: '2024-03-10 18:12',
      body: '빠른 피드백 감사합니다. 다음 작업도 일정에 맞춰 지원드리겠습니다.',
    },
  ],
  'REV-240309-007': [
    {
      id: 'rth-309-1',
      role: 'user',
      authorName: '윤재민',
      createdAt: '2024-03-09 20:20',
      body: '다음 버전에는 음량 프리셋을 선택할 수 있으면 좋겠어요.',
    },
    {
      id: 'rth-309-2',
      role: 'admin',
      authorName: '김민정',
      createdAt: '2024-03-10 09:40',
      body: '의견 감사합니다. 템플릿별 음량 기본값을 재조정하겠습니다.',
    },
  ],
};

export type ReviewDetailData = ReviewRow & { thread: ReviewThreadEntry[] };

/** 동일 상품 ID에 달린 리뷰들의 평균 별점 (목록 데이터 기준) */
export function getProductReviewStats(productId: string): { average: number; count: number } {
  const rows = MOCK_REVIEWS.filter((r) => r.productId === productId);
  if (rows.length === 0) return { average: 0, count: 0 };
  const sum = rows.reduce((s, r) => s + r.rating, 0);
  return { average: sum / rows.length, count: rows.length };
}

export function getReviewById(id: string): ReviewDetailData | undefined {
  const row = MOCK_REVIEWS.find((r) => r.id === id);
  if (!row) return undefined;
  return { ...row, thread: REVIEW_THREADS_BY_ID[id] ?? [] };
}
