export type InquiryStatus = '대기' | '처리중' | '답변완료';

/** 문의 본문 아래 타임라인 (작성자=댓글, 관리자=답변) */
export type InquiryThreadEntry = {
  id: string;
  role: 'user' | 'admin';
  authorName: string;
  createdAt: string;
  body: string;
};

export type InquiryRow = {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  email: string;
  category: string;
  status: InquiryStatus;
  createdAt: string;
  answeredAt: string | null;
  /** 답변 완료 시 담당자 표시, 미답변은 null */
  answeredBy: string | null;
  /** 문의 본문(상세 페이지용) */
  content: string;
};

export const MOCK_INQUIRIES: InquiryRow[] = [
  {
    id: 'INQ-240315-001',
    title: '영상 제작 일정 문의드립니다',
    authorId: 'user_mhk12',
    authorName: '김민희',
    email: 'minhee.kim@example.com',
    category: '주문',
    status: '대기',
    createdAt: '2024-03-15 10:22',
    answeredAt: null,
    answeredBy: null,
    content:
      '안녕하세요. 주문한 영상의 예상 제작 일정을 알 수 있을까요? 다음 주까지 받아보고 싶어서 문의드립니다.',
  },
  {
    id: 'INQ-240314-018',
    title: '결제 취소 요청',
    authorId: 'user_jh88',
    authorName: '이준호',
    email: 'junho.lee@example.com',
    category: '결제',
    status: '처리중',
    createdAt: '2024-03-14 16:05',
    answeredAt: null,
    answeredBy: null,
    content: '실수로 중복 결제가 되었습니다. 한 건만 취소 부탁드립니다. 주문번호는 본문과 동일합니다.',
  },
  {
    id: 'INQ-240313-004',
    title: '체험영상 다운로드가 안 됩니다',
    authorId: 'user_sy41',
    authorName: '박소영',
    email: 'soyoung.park@example.com',
    category: '기술',
    status: '답변완료',
    createdAt: '2024-03-13 09:18',
    answeredAt: '2024-03-13 14:32',
    answeredBy: '김민정',
    content:
      '마이페이지에서 체험영상 다운로드 버튼을 눌러도 오류가 납니다. Chrome 최신 버전 사용 중입니다.',
  },
  {
    id: 'INQ-240312-011',
    title: '배송지 변경 가능한가요?',
    authorId: 'user_ch07',
    authorName: '최현우',
    email: 'hyunwoo.choi@example.com',
    category: '주문',
    status: '답변완료',
    createdAt: '2024-03-12 11:40',
    answeredAt: '2024-03-12 15:10',
    answeredBy: '이서연',
    content: '어제 주문했는데 배송지를 잘못 입력했습니다. 출고 전이면 변경 가능한지 알려주세요.',
  },
  {
    id: 'INQ-240311-022',
    title: '회원 탈퇴 후 재가입 문의',
    authorId: 'user_jm33',
    authorName: '정미라',
    email: 'mira.jung@example.com',
    category: '계정',
    status: '대기',
    createdAt: '2024-03-11 08:55',
    answeredAt: null,
    answeredBy: null,
    content: '탈퇴 후 같은 이메일로 재가입이 가능한지, 유예 기간이 있는지 궁금합니다.',
  },
  {
    id: 'INQ-240310-009',
    title: '세금계산서 발행 요청',
    authorId: 'user_ks19',
    authorName: '강수진',
    email: 'sujin.kang@example.com',
    category: '결제',
    status: '처리중',
    createdAt: '2024-03-10 14:22',
    answeredAt: null,
    answeredBy: null,
    content: '지난달 결제 건에 대해 세금계산서 발행이 필요합니다. 사업자등록번호는 회원정보에 등록해 두었습니다.',
  },
  {
    id: 'INQ-240309-016',
    title: '앱 로그인 오류 (iOS)',
    authorId: 'user_yj64',
    authorName: '윤재민',
    email: 'jaemin.yoon@example.com',
    category: '기술',
    status: '답변완료',
    createdAt: '2024-03-09 19:03',
    answeredAt: '2024-03-10 10:00',
    answeredBy: '김민정',
    content: 'iOS 17에서 앱 실행 후 로그인 화면에서 무한 로딩만 됩니다. 재설치해도 동일합니다.',
  },
  {
    id: 'INQ-240308-003',
    title: '파트너 입점 절차 알려주세요',
    authorId: 'user_hr51',
    authorName: '한루리',
    email: 'ruri.han@example.com',
    category: '기타',
    status: '대기',
    createdAt: '2024-03-08 09:15',
    answeredAt: null,
    answeredBy: null,
    content: '크리에이터로 입점하고 싶습니다. 필요 서류와 심사 기간을 안내 부탁드립니다.',
  },
  {
    id: 'INQ-240307-028',
    title: '쿠폰 적용이 안 됩니다',
    authorId: 'user_dw92',
    authorName: '도원재',
    email: 'wonjae.do@example.com',
    category: '결제',
    status: '답변완료',
    createdAt: '2024-03-07 13:48',
    answeredAt: '2024-03-07 17:20',
    answeredBy: '이서연',
    content: '이벤트 쿠폰 코드를 입력했는데 "사용 불가"라고 뜹니다. 유효기간 안인데 확인 부탁드립니다.',
  },
  {
    id: 'INQ-240306-014',
    title: '샘플 영상 퀄리티 문의',
    authorId: 'user_sh26',
    authorName: '송하은',
    email: 'haeun.song@example.com',
    category: '주문',
    status: '처리중',
    createdAt: '2024-03-06 10:05',
    answeredAt: null,
    answeredBy: null,
    content: '샘플 보정본 해상도와 최종본과의 차이가 있는지, 업스케일 옵션이 있는지 문의드립니다.',
  },
  {
    id: 'INQ-240305-007',
    title: '고객센터 운영 시간',
    authorId: 'user_bj44',
    authorName: '배지훈',
    email: 'jihoon.bae@example.com',
    category: '기타',
    status: '답변완료',
    createdAt: '2024-03-05 16:30',
    answeredAt: '2024-03-05 18:00',
    answeredBy: '김민정',
    content: '주말에도 채팅 상담이 가능한가요? 급한 일이 있어 연락 가능 시간을 알고 싶습니다.',
  },
  {
    id: 'INQ-240304-021',
    title: '영상 수정 요청 건 follow-up',
    authorId: 'user_ny15',
    authorName: '남유진',
    email: 'yujin.nam@example.com',
    category: '주문',
    status: '답변완료',
    createdAt: '2024-03-04 12:11',
    answeredAt: '2024-03-05 09:45',
    answeredBy: '이서연',
    content: '지난주 요청드린 색보정 수정 반영 여부만 확인 부탁드립니다. 추가 비용이 있으면 알려주세요.',
  },
  {
    id: 'INQ-240303-002',
    title: '환불 기간 문의',
    authorId: 'user_oh58',
    authorName: '오승기',
    email: 'seunggi.oh@example.com',
    category: '결제',
    status: '대기',
    createdAt: '2024-03-03 08:20',
    answeredAt: null,
    answeredBy: null,
    content: '제작 시작 전 취소 시 환불까지 며칠 정도 걸리는지 알려주세요.',
  },
  {
    id: 'INQ-240302-019',
    title: '프로필 이미지 변경 문의',
    authorId: 'user_lw39',
    authorName: '임우진',
    email: 'woojin.lim@example.com',
    category: '계정',
    status: '처리중',
    createdAt: '2024-03-02 15:44',
    answeredAt: null,
    answeredBy: null,
    content: '프로필 사진을 바꿨는데 목록에는 예전 사진이 보입니다. 반영에 시간이 걸리나요?',
  },
];

/** 문의별 댓글·답변 타임라인 (상세 전용; 목록 데이터와 분리) */
const INQUIRY_THREADS_BY_ID: Record<string, InquiryThreadEntry[]> = {
  'INQ-240315-001': [
    {
      id: 'th-315-1',
      role: 'user',
      authorName: '김민희',
      createdAt: '2024-03-15 14:00',
      body: '추가로 주문번호는 OM-2024-0315 로 확인 부탁드립니다.',
    },
    {
      id: 'th-315-2',
      role: 'user',
      authorName: '김민희',
      createdAt: '2024-03-15 16:20',
      body: '혹시 평일 기준으로 안내 가능할까요?',
    },
  ],
  'INQ-240314-018': [
    {
      id: 'th-314-1',
      role: 'user',
      authorName: '이준호',
      createdAt: '2024-03-14 18:30',
      body: '카드 승인 문자는 두 번 왔습니다. 둘 다 취소 부탁드립니다.',
    },
  ],
  'INQ-240313-004': [
    {
      id: 'th-313-1',
      role: 'user',
      authorName: '박소영',
      createdAt: '2024-03-13 11:05',
      body: '캡처 화면 첨부했는데 확인 가능하실까요? 네트워크 탭에 403이 뜹니다.',
    },
    {
      id: 'th-313-2',
      role: 'admin',
      authorName: '김민정',
      createdAt: '2024-03-13 14:32',
      body:
        '안녕하세요. 해당 증상은 일시적인 CDN 지연으로 확인되어 조치 완료되었습니다. 다시 시도해 보시고 동일하면 말씀 부탁드립니다.',
    },
  ],
  'INQ-240312-011': [
    {
      id: 'th-312-1',
      role: 'admin',
      authorName: '이서연',
      createdAt: '2024-03-12 15:10',
      body: '출고 전이라 배송지 변경 가능합니다. 변경하실 주소를 회신 부탁드립니다.',
    },
  ],
  'INQ-240309-016': [
    {
      id: 'th-309-1',
      role: 'user',
      authorName: '윤재민',
      createdAt: '2024-03-09 21:15',
      body: '앱 버전 2.3.1 입니다. 기기는 아이폰 15 프로요.',
    },
    {
      id: 'th-309-2',
      role: 'user',
      authorName: '윤재민',
      createdAt: '2024-03-10 09:12',
      body: 'VPN 끄고 해봤는데도 같아요.',
    },
    {
      id: 'th-309-3',
      role: 'admin',
      authorName: '김민정',
      createdAt: '2024-03-10 10:00',
      body: '서버 측 세션 만료 이슈로 확인되어 패치 배포했습니다. 최신 앱으로 업데이트 후 로그인 부탁드립니다.',
    },
  ],
  'INQ-240307-028': [
    {
      id: 'th-307-1',
      role: 'admin',
      authorName: '이서연',
      createdAt: '2024-03-07 17:20',
      body: '쿠폰은 해당 상품 카테고리에만 적용 가능합니다. 장바구니에서 상품 구분을 한 번 확인해 주세요.',
    },
  ],
  'INQ-240304-021': [
    {
      id: 'th-304-1',
      role: 'user',
      authorName: '남유진',
      createdAt: '2024-03-04 15:00',
      body: '수정본 링크만 확인하면 됩니다. 급하지 않아요.',
    },
    {
      id: 'th-304-2',
      role: 'admin',
      authorName: '이서연',
      createdAt: '2024-03-05 09:45',
      body: '요청하신 색보정 반영해 두었습니다. 추가 수정 없으시면 이대로 확정하겠습니다.',
    },
    {
      id: 'th-304-3',
      role: 'admin',
      authorName: '이서연',
      createdAt: '2024-03-05 11:10',
      body: '추가 비용은 없습니다.',
    },
  ],
};

export type InquiryDetailData = InquiryRow & { thread: InquiryThreadEntry[] };

export function getInquiryById(id: string): InquiryDetailData | undefined {
  const row = MOCK_INQUIRIES.find((r) => r.id === id);
  if (!row) return undefined;
  return { ...row, thread: INQUIRY_THREADS_BY_ID[id] ?? [] };
}
