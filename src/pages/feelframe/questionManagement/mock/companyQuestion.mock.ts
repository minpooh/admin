/** 필프레임 · 문의관리 · 기업문의 목업 */

export type CompanyQuestionThreadEntry = {
  id: string;
  role: 'admin';
  authorName: string;
  createdAt: string;
  body: string;
};

export type CompanyQuestionRow = {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  title: string;
  content: string;
  /** 요청일 (목록·상세·검색, YYYY-MM-DD HH:mm:ss) */
  requestedAt: string;
  answeredAt: string | null;
  answeredBy: string | null;
};

export type CompanyQuestionDetailData = CompanyQuestionRow & {
  thread: CompanyQuestionThreadEntry[];
};

const COMPANY_ADMIN_REPLY_BY_ID: Record<string, string> = {
  'CQ-260418-001':
    '안녕하세요. 기업 제휴 문의 감사합니다. 담당 부서 검토 후 2영업일 내 연락드리겠습니다.',
  'CQ-260417-002': '대량 구매 견적서를 등록 이메일로 발송해 드렸습니다.',
  'CQ-260415-004': '브랜드 로고 가이드에 맞춰 시안 작업이 가능합니다. 첨부 가이드를 확인해 주세요.',
  'CQ-260412-006': '세금계산서 발행 요청 접수되었으며, 발행 완료 시 메일로 안내드립니다.',
};

const COMPANY_EXTRA_THREADS_BY_ID: Record<string, CompanyQuestionThreadEntry[]> = {
  'CQ-260412-006': [
    {
      id: 'cq-th-412-2',
      role: 'admin',
      authorName: '김민서',
      createdAt: '2026-04-12 16:45:22',
      body: '추가 서류가 필요하시면 회신 부탁드립니다.',
    },
  ],
};

function adminReplyToThread(row: CompanyQuestionRow): CompanyQuestionThreadEntry[] {
  if (!row.answeredAt || !row.answeredBy) return [];
  const body = COMPANY_ADMIN_REPLY_BY_ID[row.id];
  if (!body) return [];
  return [
    {
      id: `cq-th-${row.id}-1`,
      role: 'admin',
      authorName: row.answeredBy,
      createdAt: row.answeredAt,
      body,
    },
  ];
}

export function getCompanyQuestionById(id: string): CompanyQuestionRow | undefined {
  return MOCK_COMPANY_QUESTIONS.find((row) => row.id === id);
}

export function getCompanyQuestionDetailById(id: string): CompanyQuestionDetailData | undefined {
  const row = getCompanyQuestionById(id);
  if (!row) return undefined;
  const base = adminReplyToThread(row);
  const extra = COMPANY_EXTRA_THREADS_BY_ID[id] ?? [];
  return { ...row, thread: [...base, ...extra] };
}

export const MOCK_COMPANY_QUESTIONS: CompanyQuestionRow[] = [
  {
    id: 'CQ-260418-001',
    companyName: '(주)필커뮤니케이션',
    contactName: '이준호',
    phone: '02-1234-5678',
    email: 'junho.lee@feelcomm.co.kr',
    title: '기업 제휴 및 대량 구매 문의',
    content: '웨딩 액자 대량 구매 및 제휴 조건에 대해 문의드립니다.',
    requestedAt: '2026-04-18 09:15:42',
    answeredAt: '2026-04-18 11:30:18',
    answeredBy: '박찬서',
  },
  {
    id: 'CQ-260417-002',
    companyName: '스튜디오 라움',
    contactName: '한소희',
    phone: '010-3344-7788',
    email: 'contact@studio-raum.com',
    title: '스튜디오 단체 견적 요청',
    content: '월 50건 이상 촬영 후 제작 견적을 받고 싶습니다.',
    requestedAt: '2026-04-17 14:22:05',
    answeredAt: '2026-04-17 16:08:33',
    answeredBy: '허예진',
  },
  {
    id: 'CQ-260416-003',
    companyName: '웨딩홀 그랜드베일',
    contactName: '정다은',
    phone: '031-882-1200',
    email: 'partners@grandveil.co.kr',
    title: '웨딩홀 제휴 패키지 문의',
    content: '신규 제휴 패키지 구성 및 수수료 구조를 알고 싶습니다.',
    requestedAt: '2026-04-16 10:41:19',
    answeredAt: null,
    answeredBy: null,
  },
  {
    id: 'CQ-260415-004',
    companyName: '브랜드메이커',
    contactName: '오민재',
    phone: '010-5566-9900',
    email: 'biz@brandmaker.kr',
    title: '로고 시안 제작 가능 여부',
    content: '기업 로고가 포함된 액자 제작이 가능한지 확인 부탁드립니다.',
    requestedAt: '2026-04-15 16:03:51',
    answeredAt: '2026-04-15 17:22:09',
    answeredBy: '장성주',
  },
  {
    id: 'CQ-260414-005',
    companyName: '(주)이벤트플래닛',
    contactName: '윤서연',
    phone: '02-9876-5432',
    email: 'event@eventplanet.co.kr',
    title: '행사 부스 운영 협력',
    content: '전국 웨딩박람회 부스 공동 운영 제안드립니다.',
    requestedAt: '2026-04-14 11:18:27',
    answeredAt: null,
    answeredBy: null,
  },
  {
    id: 'CQ-260413-006',
    companyName: '포토하우스 제이',
    contactName: '강태윤',
    phone: '010-2211-4455',
    email: 'admin@photohouse-j.com',
    title: '세금계산서 발행 요청',
    content: '3월 거래분 세금계산서 재발행이 필요합니다.',
    requestedAt: '2026-04-13 08:55:03',
    answeredAt: '2026-04-13 10:12:44',
    answeredBy: '김민서',
  },
  {
    id: 'CQ-260412-007',
    companyName: '메모리웨딩',
    contactName: '배수진',
    phone: '010-7788-1122',
    email: 'partner@memorywedding.kr',
    title: 'API 연동 문의',
    content: '주문 연동 API 문서와 테스트 계정 발급을 요청합니다.',
    requestedAt: '2026-04-12 15:30:16',
    answeredAt: null,
    answeredBy: null,
  },
  {
    id: 'CQ-260411-008',
    companyName: '플라워가든',
    contactName: '임채원',
    phone: '02-4455-6677',
    email: 'sales@flowergarden.co.kr',
    title: '꽃집 연계 프로모션',
    content: '꽃집 고객 대상 할인 쿠폰 연계가 가능한지 문의합니다.',
    requestedAt: '2026-04-11 13:07:58',
    answeredAt: '2026-04-11 14:55:01',
    answeredBy: '손하준',
  },
  {
    id: 'CQ-260410-009',
    companyName: '(주)디지털프레임',
    contactName: '최현우',
    phone: '010-9933-2211',
    email: 'hello@digitalframe.io',
    title: 'B2B 샘플 키트 요청',
    content: '신규 입점 검토를 위해 샘플 키트 2세트를 요청드립니다.',
    requestedAt: '2026-04-10 09:22:41',
    answeredAt: null,
    answeredBy: null,
  },
  {
    id: 'CQ-260409-010',
    companyName: '하우스오브웨딩',
    contactName: '서지훈',
    phone: '031-220-8899',
    email: 'bizdev@houseofwedding.com',
    title: '전용 랜딩 페이지 제작',
    content: '기업 전용 랜딩 페이지 제작 비용과 기간을 알려주세요.',
    requestedAt: '2026-04-09 17:48:12',
    answeredAt: '2026-04-09 18:33:27',
    answeredBy: '문희수',
  },
  {
    id: 'CQ-260408-011',
    companyName: '스냅스튜디오 24',
    contactName: '노예린',
    phone: '010-6644-3300',
    email: 'noreply@snap24.kr',
    title: '야간 배송 가능 여부',
    content: '수도권 야간 배송 옵션 제공 여부를 확인하고 싶습니다.',
    requestedAt: '2026-04-08 20:11:05',
    answeredAt: null,
    answeredBy: null,
  },
  {
    id: 'CQ-260407-012',
    companyName: '클래식웨딩몰',
    contactName: '유다인',
    phone: '02-1100-2200',
    email: 'b2b@classicweddingmall.com',
    title: '정산 주기 변경 요청',
    content: '월 2회 정산에서 월 1회 정산으로 변경 가능한지 문의합니다.',
    requestedAt: '2026-04-07 11:05:39',
    answeredAt: '2026-04-07 12:18:56',
    answeredBy: '박채은',
  },
];
