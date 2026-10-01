/** FeelAI · 문의관리 · 1:1 문의 목업 */

export type FeelaiInquiryCategory = '토큰' | '인트로' | '사진보정' | '모션포토' | '계정' | '기타';

/** 문의 상세 타임라인 (관리자=답변) */
export type FeelaiInquiryThreadEntry = {
  id: string;
  role: 'admin';
  authorName: string;
  createdAt: string;
  body: string;
};

export type FeelaiInquiryAttachment = {
  id: string;
  fileName: string;
  url: string;
};

export type FeelaiInquiryRow = {
  id: string;
  no: number;
  title: string;
  memberId: string;
  phone: string;
  authorName: string;
  email: string;
  category: FeelaiInquiryCategory;
  createdAt: string;
  answeredAt: string | null;
  answeredBy: string | null;
  content: string;
};

export type FeelaiInquiryDetailData = FeelaiInquiryRow & {
  thread: FeelaiInquiryThreadEntry[];
  attachments: FeelaiInquiryAttachment[];
};

function adminReplyToThreadEntry(row: FeelaiInquiryRow): FeelaiInquiryThreadEntry[] {
  if (!row.answeredAt || !row.answeredBy) return [];
  const body = INQUIRY_ADMIN_REPLY_BY_ID[row.id];
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

const INQUIRY_ADMIN_REPLY_BY_ID: Record<string, string> = {
  'AIQ-260918-113': '저장된 보정본은 작업 상세 > 저장된 보정에서 다운로드할 수 있습니다. 가이드를 메일로 보내드렸습니다.',
  'AIQ-260915-111': '충전 내역이 반영되도록 잔액을 보정했습니다. 앱을 새로고침한 뒤 확인해 주세요.',
  'AIQ-260912-109': '세션 만료 이슈로 확인되어 조치했습니다. 재로그인 후 이용해 주세요.',
  'AIQ-260908-107': '모션포토는 원본 비율을 유지합니다. 9:16이 필요하면 업로드 전 크롭을 권장드립니다.',
  'AIQ-260904-105': '인트로 리스트의 노출 뱃지를 누르면 즉시 미노출로 변경됩니다.',
};

const INQUIRY_ATTACHMENTS_BY_ID: Record<string, FeelaiInquiryAttachment[]> = {
  'AIQ-260930-115': [
    { id: 'att-115-1', fileName: '인트로_오류화면.png', url: '#' },
    { id: 'att-115-2', fileName: '작업번호_캡처.jpg', url: '#' },
  ],
  'AIQ-260921-114': [{ id: 'att-114-1', fileName: '토큰잔액_스크린샷.png', url: '#' }],
  'AIQ-260918-113': [{ id: 'att-113-1', fileName: '보정결과_미리보기.jpg', url: '#' }],
  'AIQ-260912-109': [{ id: 'att-109-1', fileName: '로그인오류_캡처.png', url: '#' }],
  'AIQ-260906-106': [{ id: 'att-106-1', fileName: '토큰사용내역.pdf', url: '#' }],
};

const INQUIRY_EXTRA_THREADS_BY_ID: Record<string, FeelaiInquiryThreadEntry[]> = {
  'AIQ-260915-111': [
    {
      id: 'th-111-2',
      role: 'admin',
      authorName: '김민정',
      createdAt: '2026-09-15 16:40',
      body: '추가로 동일 증상이 있으면 충전 주문번호와 함께 남겨 주세요.',
    },
  ],
};

export function getFeelaiInquiryById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_FEELAI_INQUIRIES.find((row) => row.id === id);
}

export function getFeelaiInquiryDetailById(id: string | undefined): FeelaiInquiryDetailData | undefined {
  const row = getFeelaiInquiryById(id);
  if (!row) return undefined;
  const base = adminReplyToThreadEntry(row);
  const extra = INQUIRY_EXTRA_THREADS_BY_ID[row.id] ?? [];
  return {
    ...row,
    thread: [...base, ...extra],
    attachments: INQUIRY_ATTACHMENTS_BY_ID[row.id] ?? [],
  };
}

export const MOCK_FEELAI_INQUIRIES: FeelaiInquiryRow[] = [
  {
    id: 'AIQ-260930-115',
    no: 115,
    title: '인트로 영상 생성 중 오류가 납니다',
    memberId: 'feelai_mj',
    phone: '010-1111-2222',
    authorName: '이민정',
    email: 'minjeong.lee@example.com',
    category: '인트로',
    createdAt: '2026-09-30 09:12',
    answeredAt: null,
    answeredBy: null,
    content: '지브리 스타일 인트로 작업이 영상 단계에서 실패합니다. 작업번호 INTRO-260917-001 확인 부탁드립니다.',
  },
  {
    id: 'AIQ-260921-114',
    no: 114,
    title: '토큰 잔액이 맞지 않습니다',
    memberId: 'kimcs',
    phone: '010-1234-5678',
    authorName: '김철수',
    email: 'chulsoo.kim@example.com',
    category: '토큰',
    createdAt: '2026-09-21 11:08',
    answeredAt: null,
    answeredBy: null,
    content: '모션포토 작업 후 잔액이 차감되지 않은 것처럼 보입니다. 현재 잔액 확인 부탁드립니다.',
  },
  {
    id: 'AIQ-260918-113',
    no: 113,
    title: '사진보정 결과 다운로드는 어디서 하나요?',
    memberId: 'park_yh',
    phone: '010-2222-3333',
    authorName: '박영희',
    email: 'younghee.park@example.com',
    category: '사진보정',
    createdAt: '2026-09-18 14:22',
    answeredAt: '2026-09-18 16:05',
    answeredBy: '김민정',
    content: '저장된 보정본을 내려받고 싶은데 메뉴를 찾지 못했습니다. 경로 안내 부탁드립니다.',
  },
  {
    id: 'AIQ-260917-112',
    no: 112,
    title: '모션포토 생성이 계속 실패합니다',
    memberId: 'lee_ds',
    phone: '010-3333-4444',
    authorName: '이동수',
    email: 'dongsu.lee@example.com',
    category: '모션포토',
    createdAt: '2026-09-17 13:22',
    answeredAt: null,
    answeredBy: null,
    content: '치비 스타일 모션포토가 두 번 연속 실패했습니다. 원본 사진은 문제없이 열립니다.',
  },
  {
    id: 'AIQ-260915-111',
    no: 111,
    title: '토큰 충전 후 잔액이 안 보입니다',
    memberId: 'choi_hn',
    phone: '010-5555-6666',
    authorName: '최하나',
    email: 'hana.choi@example.com',
    category: '토큰',
    createdAt: '2026-09-15 10:46',
    answeredAt: '2026-09-15 15:10',
    answeredBy: '김민정',
    content: '스토어 토큰을 충전했는데 잔액이 0으로 남아 있습니다. 주문번호 확인 부탁드립니다.',
  },
  {
    id: 'AIQ-260914-110',
    no: 110,
    title: '인트로 스타일을 변경할 수 있나요?',
    memberId: 'jung_sw',
    phone: '010-7777-8888',
    authorName: '정수원',
    email: 'suwon.jung@example.com',
    category: '인트로',
    createdAt: '2026-09-14 20:11',
    answeredAt: null,
    answeredBy: null,
    content: '픽사로 만든 인트로를 디즈니 스타일로 바꾸고 싶습니다. 토큰이 추가로 차감되는지 궁금합니다.',
  },
  {
    id: 'AIQ-260912-109',
    no: 109,
    title: '로그인 후 작업내역이 비어 있습니다',
    memberId: 'han_jy',
    phone: '010-8888-9999',
    authorName: '한지윤',
    email: 'jiyoon.han@example.com',
    category: '계정',
    createdAt: '2026-09-12 08:55',
    answeredAt: '2026-09-12 11:20',
    answeredBy: '이서연',
    content: '같은 아이디로 로그인했는데 이전 인트로 작업이 보이지 않습니다.',
  },
  {
    id: 'AIQ-260910-108',
    no: 108,
    title: '사진보정 저장이 되지 않습니다',
    memberId: 'oh_ms',
    phone: '010-1010-2020',
    authorName: '오민서',
    email: 'minseo.oh@example.com',
    category: '사진보정',
    createdAt: '2026-09-10 16:41',
    answeredAt: null,
    answeredBy: null,
    content: '보정 결과를 저장하면 로딩만 반복됩니다. 사진 수는 8장입니다.',
  },
  {
    id: 'AIQ-260908-107',
    no: 107,
    title: '모션포토 비율을 9:16으로 만들 수 있나요?',
    memberId: 'yoon_dh',
    phone: '010-3030-4040',
    authorName: '윤도현',
    email: 'dohyun.yoon@example.com',
    category: '모션포토',
    createdAt: '2026-09-08 15:29',
    answeredAt: '2026-09-08 17:02',
    answeredBy: '이서연',
    content: '릴스용 세로 비율로 만들고 싶습니다. 원본은 1:1입니다.',
  },
  {
    id: 'AIQ-260906-106',
    no: 106,
    title: '사용하지 않은 토큰 환불이 가능한가요?',
    memberId: 'kang_ej',
    phone: '010-4040-5050',
    authorName: '강은지',
    email: 'eunji.kang@example.com',
    category: '토큰',
    createdAt: '2026-09-06 12:04',
    answeredAt: null,
    answeredBy: null,
    content: '이벤트 충전 토큰이 남아 있는데 환불 규정이 궁금합니다.',
  },
  {
    id: 'AIQ-260904-105',
    no: 105,
    title: '인트로를 미노출로 바꾸고 싶습니다',
    memberId: 'seo_jw',
    phone: '010-6060-7070',
    authorName: '서지우',
    email: 'jiwoo.seo@example.com',
    category: '인트로',
    createdAt: '2026-09-04 19:38',
    answeredAt: '2026-09-05 09:15',
    answeredBy: '김민정',
    content: '완성된 인트로를 고객에게 보여주기 전에 숨기고 싶습니다. 설정 위치를 알려주세요.',
  },
  {
    id: 'AIQ-260902-104',
    no: 104,
    title: 'AI 작업 대기 시간이 너무 깁니다',
    memberId: 'baek_sh',
    phone: '010-8080-9090',
    authorName: '백서현',
    email: 'seohyun.baek@example.com',
    category: '기타',
    createdAt: '2026-09-02 07:21',
    answeredAt: null,
    answeredBy: null,
    content: '인트로와 모션포토 모두 생성중 상태가 30분 이상 유지됩니다. 서버 상태를 확인 부탁드립니다.',
  },
];
