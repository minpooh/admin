/** FeelAI · 문의관리 · AI 오류확인 목업 */

export type FeelaiAiErrorCategory = '인트로' | '사진보정' | '모션포토' | '토큰' | '계정' | '기타';

export type FeelaiAiErrorStatus = '대기중' | '처리완료';

export type FeelaiAiErrorRow = {
  id: string;
  no: number;
  title: string;
  memberId: string;
  phone: string;
  authorName: string;
  email: string;
  category: FeelaiAiErrorCategory;
  createdAt: string;
  processedAt: string | null;
  processedBy: string | null;
  urgent: boolean;
  content: string;
};

export function getFeelaiAiErrorStatus(row: FeelaiAiErrorRow): FeelaiAiErrorStatus {
  return row.processedAt ? '처리완료' : '대기중';
}

export const MOCK_FEELAI_AI_ERRORS: FeelaiAiErrorRow[] = [
  {
    id: 'AIE-260930-048',
    no: 48,
    title: '인트로 영상 생성 단계에서 실패합니다',
    memberId: 'feelai_mj',
    phone: '010-1111-2222',
    authorName: '이민정',
    email: 'minjeong.lee@example.com',
    category: '인트로',
    createdAt: '2026-09-30 09:18',
    processedAt: null,
    processedBy: null,
    urgent: true,
    content: 'INTRO-260917-001 작업이 영상 단계에서 반복 실패합니다. 즉시 확인이 필요합니다.',
  },
  {
    id: 'AIE-260928-047',
    no: 47,
    title: '모션포토 미리보기가 재생되지 않습니다',
    memberId: 'kimcs',
    phone: '010-1234-5678',
    authorName: '김철수',
    email: 'chulsoo.kim@example.com',
    category: '모션포토',
    createdAt: '2026-09-28 14:02',
    processedAt: null,
    processedBy: null,
    urgent: false,
    content: 'MP-260917-001 미리보기 클릭 시 검은 화면만 표시됩니다.',
  },
  {
    id: 'AIE-260926-046',
    no: 46,
    title: '사진보정 저장 후 결과가 비어 있습니다',
    memberId: 'park_yh',
    phone: '010-2222-3333',
    authorName: '박영희',
    email: 'younghee.park@example.com',
    category: '사진보정',
    createdAt: '2026-09-26 11:41',
    processedAt: '2026-09-26 16:20',
    processedBy: '김민정',
    urgent: false,
    content: '보정 저장은 성공으로 뜨지만 저장된 보정 목록이 비어 있습니다.',
  },
  {
    id: 'AIE-260924-045',
    no: 45,
    title: '스타일 변환이 중단되고 오류가 납니다',
    memberId: 'lee_ds',
    phone: '010-3333-4444',
    authorName: '이동수',
    email: 'dongsu.lee@example.com',
    category: '인트로',
    createdAt: '2026-09-24 18:33',
    processedAt: null,
    processedBy: null,
    urgent: true,
    content: '지브리 스타일 변환 중 서버 오류가 발생합니다. 동일 원본으로 재시도해도 실패합니다.',
  },
  {
    id: 'AIE-260922-044',
    no: 44,
    title: '토큰 차감이 두 번 반영되었습니다',
    memberId: 'choi_hn',
    phone: '010-5555-6666',
    authorName: '최하나',
    email: 'hana.choi@example.com',
    category: '토큰',
    createdAt: '2026-09-22 10:09',
    processedAt: '2026-09-22 13:44',
    processedBy: '이서연',
    urgent: false,
    content: '모션포토 1건 생성인데 토큰이 두 번 차감되었습니다. 잔액 보정 부탁드립니다.',
  },
  {
    id: 'AIE-260920-043',
    no: 43,
    title: '나레이션 생성이 대기 상태에서 멈춥니다',
    memberId: 'jung_sw',
    phone: '010-7777-8888',
    authorName: '정수원',
    email: 'suwon.jung@example.com',
    category: '인트로',
    createdAt: '2026-09-20 16:55',
    processedAt: null,
    processedBy: null,
    urgent: false,
    content: 'TTS 생성이 20분 이상 대기중입니다. INTRO-260915-009 확인 부탁드립니다.',
  },
  {
    id: 'AIE-260918-042',
    no: 42,
    title: '최종 렌더 파일이 다운로드되지 않습니다',
    memberId: 'han_jy',
    phone: '010-8888-9999',
    authorName: '한지윤',
    email: 'jiyoon.han@example.com',
    category: '인트로',
    createdAt: '2026-09-18 09:27',
    processedAt: '2026-09-18 12:11',
    processedBy: '김민정',
    urgent: false,
    content: '완료 상태인데 최종영상 다운로드 버튼이 동작하지 않습니다.',
  },
  {
    id: 'AIE-260916-041',
    no: 41,
    title: '모션포토 서버가 응답하지 않습니다',
    memberId: 'oh_ms',
    phone: '010-1010-2020',
    authorName: '오민서',
    email: 'minseo.oh@example.com',
    category: '모션포토',
    createdAt: '2026-09-16 08:14',
    processedAt: '2026-09-16 09:02',
    processedBy: '이서연',
    urgent: true,
    content: '생성 요청 시 서버 타임아웃이 반복됩니다. 긴급 점검이 필요했습니다.',
  },
  {
    id: 'AIE-260914-040',
    no: 40,
    title: '로그인 후 작업내역이 일부만 보입니다',
    memberId: 'yoon_dh',
    phone: '010-3030-4040',
    authorName: '윤도현',
    email: 'dohyun.yoon@example.com',
    category: '계정',
    createdAt: '2026-09-14 19:48',
    processedAt: null,
    processedBy: null,
    urgent: false,
    content: '같은 계정인데 최근 인트로 작업 3건이 목록에 없습니다.',
  },
  {
    id: 'AIE-260912-039',
    no: 39,
    title: '사진보정 AI 요청이 실패로 끝납니다',
    memberId: 'kang_ej',
    phone: '010-4040-5050',
    authorName: '강은지',
    email: 'eunji.kang@example.com',
    category: '사진보정',
    createdAt: '2026-09-12 13:06',
    processedAt: '2026-09-12 15:30',
    processedBy: '김민정',
    urgent: false,
    content: '원본 8장 중 3장만 보정되고 나머지는 실패합니다.',
  },
  {
    id: 'AIE-260910-038',
    no: 38,
    title: '인트로 씬 이미지가 깨져 보입니다',
    memberId: 'seo_jw',
    phone: '010-6060-7070',
    authorName: '서지우',
    email: 'jiwoo.seo@example.com',
    category: '인트로',
    createdAt: '2026-09-10 21:19',
    processedAt: null,
    processedBy: null,
    urgent: true,
    content: '씬 3 이미지가 노이즈만 출력됩니다. 고객 전달 전이라 긴급 재생성 요청입니다.',
  },
  {
    id: 'AIE-260908-037',
    no: 37,
    title: '사용 토큰 집계가 작업 수와 다릅니다',
    memberId: 'baek_sh',
    phone: '010-8080-9090',
    authorName: '백서현',
    email: 'seohyun.baek@example.com',
    category: '토큰',
    createdAt: '2026-09-08 07:42',
    processedAt: null,
    processedBy: null,
    urgent: false,
    content: '모션포토 2건인데 사용 토큰이 비정상적으로 높게 표시됩니다.',
  },
];

export type FeelaiAiErrorThreadEntry = {
  id: string;
  role: 'admin';
  authorName: string;
  createdAt: string;
  body: string;
};

export type FeelaiAiErrorAttachment = {
  id: string;
  fileName: string;
  url: string;
};

export type FeelaiAiErrorDetailData = FeelaiAiErrorRow & {
  thread: FeelaiAiErrorThreadEntry[];
  attachments: FeelaiAiErrorAttachment[];
};

const AI_ERROR_ADMIN_REPLY_BY_ID: Record<string, string> = {
  'AIE-260926-046': '저장된 보정 목록 동기화 오류를 수정했습니다. 앱을 새로고침한 뒤 다시 확인해 주세요.',
  'AIE-260922-044': '중복 차감된 토큰을 복구했습니다. 현재 잔액을 확인해 주세요.',
  'AIE-260918-042': '최종영상 다운로드 경로를 복구했습니다. 작업 상세에서 다시 받아 주세요.',
  'AIE-260916-041': '모션포토 서버를 재기동했고, 타임아웃 재시도 로직을 적용했습니다.',
  'AIE-260912-039': '실패한 3장에 대해 재처리를 완료했습니다. 보정 목록에서 결과를 확인해 주세요.',
};

const AI_ERROR_ATTACHMENTS_BY_ID: Record<string, FeelaiAiErrorAttachment[]> = {
  'AIE-260930-048': [
    { id: 'att-048-1', fileName: '인트로_오류화면.png', url: '#' },
    { id: 'att-048-2', fileName: '작업번호_캡처.jpg', url: '#' },
  ],
  'AIE-260924-045': [{ id: 'att-045-1', fileName: '스타일변환_실패로그.txt', url: '#' }],
  'AIE-260922-044': [{ id: 'att-044-1', fileName: '토큰잔액_스크린샷.png', url: '#' }],
  'AIE-260916-041': [{ id: 'att-041-1', fileName: '서버타임아웃_캡처.png', url: '#' }],
  'AIE-260910-038': [{ id: 'att-038-1', fileName: '씬3_깨진이미지.jpg', url: '#' }],
};

function adminReplyToThreadEntry(row: FeelaiAiErrorRow): FeelaiAiErrorThreadEntry[] {
  if (!row.processedAt || !row.processedBy) return [];
  const body = AI_ERROR_ADMIN_REPLY_BY_ID[row.id];
  if (!body) return [];
  return [
    {
      id: `th-${row.id}-admin-1`,
      role: 'admin',
      authorName: row.processedBy,
      createdAt: row.processedAt,
      body,
    },
  ];
}

export function getFeelaiAiErrorById(id: string | undefined) {
  if (!id) return undefined;
  return MOCK_FEELAI_AI_ERRORS.find((row) => row.id === id);
}

export function getFeelaiAiErrorDetailById(id: string | undefined): FeelaiAiErrorDetailData | undefined {
  const row = getFeelaiAiErrorById(id);
  if (!row) return undefined;
  return {
    ...row,
    thread: adminReplyToThreadEntry(row),
    attachments: AI_ERROR_ATTACHMENTS_BY_ID[row.id] ?? [],
  };
}
