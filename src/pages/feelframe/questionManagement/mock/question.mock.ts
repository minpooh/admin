export type FeelframeQuestionCategory =
  | '회원문의'
  | '주문/결제'
  | '취소/환불'
  | '시안/수정'
  | '배송/제작'
  | '공동구매'
  | '기타';

/** 문의 상세 타임라인 (관리자=답변) */
export type FeelframeQuestionThreadEntry = {
  id: string;
  role: 'admin';
  authorName: string;
  createdAt: string;
  body: string;
};

export type FeelframeQuestionAttachment = {
  id: string;
  fileName: string;
  /** 실제 API 연동 시 파일 다운로드 URL */
  url: string;
};

export type FeelframeQuestionRow = {
  id: string;
  category: FeelframeQuestionCategory;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  memberId: string;
  authorPhone: string;
  answeredBy: string | null;
  answeredAt: string | null;
};

export type FeelframeQuestionDetailData = FeelframeQuestionRow & {
  thread: FeelframeQuestionThreadEntry[];
  attachments: FeelframeQuestionAttachment[];
};

function adminReplyToThreadEntry(row: FeelframeQuestionRow): FeelframeQuestionThreadEntry[] {
  if (!row.answeredAt || !row.answeredBy) return [];
  const body = QUESTION_ADMIN_REPLY_BY_ID[row.id];
  if (!body) return [];
  return [
    {
      id: `th-${row.id}-admin-1`,
      role: 'admin',
      authorName: row.answeredBy,
      createdAt: row.answeredAt,
      body,
    },
  ];
}

/** 목록·상세 공통: 답변 완료 건 관리자 답변 본문 */
const QUESTION_ADMIN_REPLY_BY_ID: Record<string, string> = {
  'FQ-260418-001':
    '안녕하세요. 현재 시안 수정 요청이 접수되어 디자이너 검토 중입니다. 오늘 오후 중 안내드리겠습니다.',
  'FQ-260417-002': '앨범 사진만으로도 제작 가능합니다. 업로드 가이드 메일로 발송해 드렸습니다.',
  'FQ-260417-003': '예식일 기준 5일 전 수령을 권장드리며, 현재 주문 건은 4월 14일 출고 예정입니다.',
  'FQ-260416-004': '후기 포인트는 검수 완료 후 익일 오전 일괄 지급됩니다.',
  'FQ-260415-007': '취소 승인 후 카드 결제는 3~5영업일, 무통장은 1~2영업일 내 환불됩니다.',
  'FQ-260414-009': '재설정 메일을 재발송했습니다. 수신함을 다시 확인해 주세요.',
  'FQ-260412-011': '이중 완충 포장으로 발송하며, 파손 시 무료 재제작해 드립니다.',
};

/** 상세 전용: 문의 시 고객이 첨부한 파일 */
const QUESTION_ATTACHMENTS_BY_ID: Record<string, FeelframeQuestionAttachment[]> = {
  'FQ-260418-001': [
    { id: 'att-418-1', fileName: '시안_수정요청_캡처.png', url: '#' },
    { id: 'att-418-2', fileName: '주문내역_20260418.pdf', url: '#' },
  ],
  'FQ-260417-002': [{ id: 'att-417-1', fileName: '웨딩앨범_샘플.zip', url: '#' }],
  'FQ-260416-005': [{ id: 'att-416-1', fileName: '업로드화면_스크린샷.jpg', url: '#' }],
  'FQ-260414-009': [
    { id: 'att-414-1', fileName: '메일수신함_캡처.png', url: '#' },
    { id: 'att-414-2', fileName: '회원정보_확인.png', url: '#' },
  ],
  'FQ-260412-011': [{ id: 'att-412-1', fileName: '포장상태_사진.jpg', url: '#' }],
};

/** 상세 전용 추가 답변 스레드 (목록 데이터와 분리) */
const QUESTION_EXTRA_THREADS_BY_ID: Record<string, FeelframeQuestionThreadEntry[]> = {
  'FQ-260412-011': [
    {
      id: 'th-412-2',
      role: 'admin',
      authorName: '정유진',
      createdAt: '2026-04-12 17:30',
      body: '추가 문의 주시면 배송 추적 번호도 함께 안내드리겠습니다.',
    },
  ],
};

export function getFeelframeQuestionById(id: string): FeelframeQuestionRow | undefined {
  return MOCK_FEELFRAME_QUESTIONS.find((row) => row.id === id);
}

export function getFeelframeQuestionDetailById(id: string): FeelframeQuestionDetailData | undefined {
  const row = getFeelframeQuestionById(id);
  if (!row) return undefined;
  const base = adminReplyToThreadEntry(row);
  const extra = QUESTION_EXTRA_THREADS_BY_ID[id] ?? [];
  return {
    ...row,
    thread: [...base, ...extra],
    attachments: QUESTION_ATTACHMENTS_BY_ID[id] ?? [],
  };
}

export const MOCK_FEELFRAME_QUESTIONS: FeelframeQuestionRow[] = [
  {
    id: 'FQ-260418-001',
    category: '시안/수정',
    title: '제작은 요청상태인가요?',
    content: '시안 확인 후 수정 요청을 드렸는데 현재 진행 단계가 궁금합니다.',
    createdAt: '2026-04-18 09:12',
    authorName: '문지수',
    memberId: 'moon_js',
    authorPhone: '010-2847-1193',
    answeredBy: '박찬서',
    answeredAt: '2026-04-18 11:40',
  },
  {
    id: 'FQ-260417-002',
    category: '배송/제작',
    title: '결혼 사진만 가능할까요?',
    content: '앨범에 있는 사진만 업로드해도 제작이 가능한지 문의드립니다.',
    createdAt: '2026-04-17 14:22',
    authorName: '박시영',
    memberId: 'park_sy',
    authorPhone: '010-5521-8834',
    answeredBy: '허예진',
    answeredAt: '2026-04-17 16:05',
  },
  {
    id: 'FQ-260417-003',
    category: '배송/제작',
    title: '배송일 문의드립니다',
    content: '예식일 전 수령이 가능한지 배송 예정일을 알고 싶습니다.',
    createdAt: '2026-04-17 10:05',
    authorName: '김서연',
    memberId: 'kim_seoyeon',
    authorPhone: '010-3392-7710',
    answeredBy: '장성주',
    answeredAt: '2026-04-17 12:18',
  },
  {
    id: 'FQ-260416-004',
    category: '기타',
    title: '상품 후기 일정',
    content: '후기 작성 시 포인트 지급 일정이 어떻게 되는지 궁금합니다.',
    createdAt: '2026-04-16 18:33',
    authorName: '이도윤',
    memberId: 'lee_dy',
    authorPhone: '010-9012-4456',
    answeredBy: '손하준',
    answeredAt: '2026-04-16 19:50',
  },
  {
    id: 'FQ-260416-005',
    category: '시안/수정',
    title: '파일 업로드는 어디서 하나요?',
    content: '마이페이지에서 업로드 메뉴를 찾지 못했습니다. 경로 안내 부탁드립니다.',
    createdAt: '2026-04-16 11:20',
    authorName: '정하은',
    memberId: 'jung_haeun',
    authorPhone: '010-7743-2201',
    answeredBy: null,
    answeredAt: null,
  },
  {
    id: 'FQ-260415-006',
    category: '주문/결제',
    title: '무통장 입금 확인 요청',
    content: '어제 입금 완료했는데 주문 상태가 아직 결제전으로 표시됩니다.',
    createdAt: '2026-04-15 16:41',
    authorName: '최민재',
    memberId: 'choi_mj',
    authorPhone: '010-6618-9023',
    answeredBy: null,
    answeredAt: null,
  },
  {
    id: 'FQ-260415-007',
    category: '취소/환불',
    title: '주문 취소 후 환불 기간',
    content: '취소 승인 이후 환불까지 며칠 정도 소요되나요?',
    createdAt: '2026-04-15 09:08',
    authorName: '한지우',
    memberId: 'han_jw',
    authorPhone: '010-2289-5567',
    answeredBy: '문희수',
    answeredAt: '2026-04-15 10:22',
  },
  {
    id: 'FQ-260414-008',
    category: '공동구매',
    title: '공구 참여 인원 추가 가능 여부',
    content: '마감 전에 인원을 한 명 더 추가할 수 있는지 문의드립니다.',
    createdAt: '2026-04-14 13:55',
    authorName: '오수빈',
    memberId: 'oh_sb',
    authorPhone: '010-4156-3380',
    answeredBy: null,
    answeredAt: null,
  },
  {
    id: 'FQ-260414-009',
    category: '회원문의',
    title: '비밀번호 재설정 메일이 오지 않아요',
    content: '스팸함도 확인했는데 재설정 메일을 받지 못했습니다.',
    createdAt: '2026-04-14 08:17',
    authorName: '강예린',
    memberId: 'kang_yr',
    authorPhone: '010-8874-1029',
    answeredBy: '박채은',
    answeredAt: '2026-04-14 09:02',
  },
  {
    id: 'FQ-260413-010',
    category: '주문/결제',
    title: '쿠폰 중복 적용 문의',
    content: '공동구매 쿠폰과 CRM 쿠폰을 함께 사용할 수 있나요?',
    createdAt: '2026-04-13 20:44',
    authorName: '윤서준',
    memberId: 'yoon_sj',
    authorPhone: '010-5033-6741',
    answeredBy: null,
    answeredAt: null,
  },
  {
    id: 'FQ-260412-011',
    category: '배송/제작',
    title: '택배 수령 시 파손 우려',
    content: '액자 포장이 안전한지, 파손 시 재제작 절차가 궁금합니다.',
    createdAt: '2026-04-12 15:30',
    authorName: '임채원',
    memberId: 'lim_cw',
    authorPhone: '010-1928-4490',
    answeredBy: '정유진',
    answeredAt: '2026-04-12 17:11',
  },
  {
    id: 'FQ-260411-012',
    category: '기타',
    title: '영업시간 문의',
    content: '주말에도 고객센터 운영을 하는지 알려주세요.',
    createdAt: '2026-04-11 12:02',
    authorName: '배현우',
    memberId: 'bae_hw',
    authorPhone: '010-7461-2855',
    answeredBy: null,
    answeredAt: null,
  },
];
