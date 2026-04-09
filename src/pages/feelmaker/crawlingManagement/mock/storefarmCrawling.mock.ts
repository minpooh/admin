/** 스팜 보정 — 스팜/회원 3줄 정보 + 이슈 */
export type MotionPersonLines = {
  userId: string;
  name: string;
  phone: string;
};

export type StorefarmMotionRow = {
  id: string;
  orderDate: string;
  orderNumber: string;
  storefarm: MotionPersonLines;
  memberById: MotionPersonLines;
  /** 스팜 vs 회원(아이디 매칭) 불일치 시 표시, 일치 시 빈 문자열 */
  issueIdMatch: string;
  memberByContact: MotionPersonLines;
  /** 스팜 vs 회원(연락처 매칭) 불일치 시 표시 */
  issueContactMatch: string;
  /** 업로드 시점 아이디 · 이름 · 연락처 */
  uploadInfo: MotionPersonLines;
  /** 업로드 관련 이슈 */
  issueUpload: string;
};

/** 스팜 영상 */
export type StorefarmVideoRow = {
  id: string;
  orderDate: string;
  name: string;
  userId: string;
  phone: string;
  paymentStatus: '결제완료' | '미결제';
  orderProduct: string;
  /** 메이커서비스 적용 여부 */
  makerService: '추가' | '미추가';
};

/** 스팜 모청 */
export type StorefarmCardRow = {
  id: string;
  orderDate: string;
  name: string;
  userId: string;
  phone: string;
  category: '웨딩' | '돌잔치';
  paymentStatus: '결제완료' | '미결제';
  signupStatus: string;
  /** 사용중 청첩장 미리보기 URL (없으면 '—') */
  activeInvitation: string;
  option: '선택' | '미선택';
};

export const MOTION_SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'name', label: '이름' },
  { value: 'userId', label: '아이디' },
  { value: 'phone', label: '전화번호' },
  { value: 'orderNumber', label: '주문번호' },
];

export const VIDEO_SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'name', label: '이름' },
  { value: 'userId', label: '아이디' },
  { value: 'phone', label: '전화번호' },
];

export const CARD_SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'name', label: '이름' },
  { value: 'userId', label: '아이디' },
  { value: 'phone', label: '전화번호' },
];

export const MOCK_STOREFARM_VIDEO_ROWS: StorefarmVideoRow[] = [
  {
    id: 'cv-1',
    orderDate: '2026-04-05 14:22',
    name: '김민정',
    userId: 'minjung_k',
    phone: '010-1234-5678',
    paymentStatus: '결제완료',
    orderProduct: '웨딩 하이라이트 영상 패키지',
    makerService: '추가',
  },
  {
    id: 'cv-2',
    orderDate: '2026-04-05 11:08',
    name: '이서준',
    userId: 'seojun_lee',
    phone: '010-9876-5432',
    paymentStatus: '미결제',
    orderProduct: '돌잔치 풀영상',
    makerService: '미추가',
  },
  {
    id: 'cv-3',
    orderDate: '2026-04-04 18:45',
    name: '박하은',
    userId: 'haeun_p',
    phone: '010-5555-1212',
    paymentStatus: '미결제',
    orderProduct: '시네마틱 인터뷰 클립',
    makerService: '추가',
  },
];

export const MOCK_STOREFARM_CARD_ROWS: StorefarmCardRow[] = [
  {
    id: 'cc-1',
    orderDate: '2026-04-05 09:15',
    name: '최유진',
    userId: 'yujin_choi',
    phone: '010-2222-3333',
    category: '웨딩',
    paymentStatus: '결제완료',
    signupStatus: '이용중',
    activeInvitation: 'https://preview.feelmaker.com/invitation/wedding-classic-a',
    option: '선택',
  },
  {
    id: 'cc-2',
    orderDate: '2026-04-04 16:30',
    name: '정우석',
    userId: 'wooseok_j',
    phone: '010-4444-8888',
    category: '돌잔치',
    paymentStatus: '미결제',
    signupStatus: '무료체험',
    activeInvitation: '—',
    option: '미선택',
  },
  {
    id: 'cc-3',
    orderDate: '2026-04-04 10:12',
    name: '박하린',
    userId: 'harin_park',
    phone: '010-1010-1111',
    category: '웨딩',
    paymentStatus: '결제완료',
    signupStatus: '이용중',
    activeInvitation: 'https://preview.feelmaker.com/invitation/harin-wedding',
    option: '선택',
  },
  {
    id: 'cc-4',
    orderDate: '2026-04-03 18:40',
    name: '김도윤',
    userId: 'doyoon_kim',
    phone: '010-1212-1313',
    category: '돌잔치',
    paymentStatus: '미결제',
    signupStatus: '무료체험',
    activeInvitation: '—',
    option: '미선택',
  },
  {
    id: 'cc-5',
    orderDate: '2026-04-03 14:05',
    name: '장유나',
    userId: 'yuna_jang',
    phone: '010-1414-1515',
    category: '웨딩',
    paymentStatus: '결제완료',
    signupStatus: '이용중',
    activeInvitation: 'https://preview.feelmaker.com/invitation/yuna2026',
    option: '선택',
  },
  {
    id: 'cc-6',
    orderDate: '2026-04-03 09:27',
    name: '오민재',
    userId: 'minjae_o',
    phone: '010-1616-1717',
    category: '돌잔치',
    paymentStatus: '결제완료',
    signupStatus: '이용중',
    activeInvitation: 'https://preview.feelmaker.com/invitation/01016161717',
    option: '미선택',
  },
  {
    id: 'cc-7',
    orderDate: '2026-04-02 20:33',
    name: '서지안',
    userId: 'jian_seo',
    phone: '010-1818-1919',
    category: '웨딩',
    paymentStatus: '미결제',
    signupStatus: '무료체험',
    activeInvitation: '—',
    option: '미선택',
  },
  {
    id: 'cc-8',
    orderDate: '2026-04-02 15:18',
    name: '문수아',
    userId: 'sua_moon',
    phone: '010-2020-2121',
    category: '돌잔치',
    paymentStatus: '결제완료',
    signupStatus: '이용중',
    activeInvitation: 'https://preview.feelmaker.com/invitation/sua-party',
    option: '선택',
  },
  {
    id: 'cc-9',
    orderDate: '2026-04-01 17:52',
    name: '한지훈',
    userId: 'jihoon_han',
    phone: '010-2222-2323',
    category: '웨딩',
    paymentStatus: '결제완료',
    signupStatus: '이용중',
    activeInvitation: 'https://preview.feelmaker.com/invitation/wedding',
    option: '선택',
  },
  {
    id: 'cc-10',
    orderDate: '2026-04-01 12:09',
    name: '임예은',
    userId: 'yeeun_lim',
    phone: '010-2424-2525',
    category: '돌잔치',
    paymentStatus: '미결제',
    signupStatus: '무료체험',
    activeInvitation: '—',
    option: '미선택',
  },
  {
    id: 'cc-11',
    orderDate: '2026-03-31 16:24',
    name: '배성민',
    userId: 'sungmin_bae',
    phone: '010-2626-2727',
    category: '웨딩',
    paymentStatus: '결제완료',
    signupStatus: '이용중',
    activeInvitation: 'https://preview.feelmaker.com/invitation/sungmin-wed',
    option: '선택',
  },
  {
    id: 'cc-12',
    orderDate: '2026-03-31 09:31',
    name: '노가은',
    userId: 'gaeun_no',
    phone: '010-2828-2929',
    category: '돌잔치',
    paymentStatus: '결제완료',
    signupStatus: '이용중',
    activeInvitation: 'https://preview.feelmaker.com/invitation/gaeun-party',
    option: '미선택',
  },
];

export const MOCK_STOREFARM_MOTION_ROWS: StorefarmMotionRow[] = [
  {
    id: 'cm-1',
    orderDate: '2026-04-06 13:02',
    orderNumber: '2026040675862211',
    storefarm: { userId: 'minjung_k', name: '김민정', phone: '010-1234-5678' },
    memberById: { userId: 'minjung_k', name: '김민정', phone: '010-1234-5678' },
    issueIdMatch: '',
    memberByContact: { userId: 'minjung_k', name: '김민정', phone: '010-1234-5678' },
    issueContactMatch: '',
    uploadInfo: { userId: 'minjung_k', name: '김민정', phone: '010-1234-5678' },
    issueUpload: '',
  },
  {
    id: 'cm-2',
    orderDate: '2026-04-04 16:40',
    orderNumber: '2026040475862210',
    storefarm: { userId: 'storefarm_guest', name: '이서준', phone: '010-9876-5432' },
    memberById: { userId: 'seojun_lee', name: '이서준', phone: '010-9876-5432' },
    issueIdMatch: '아이디매칭 실패',
    memberByContact: { userId: 'seojun_lee', name: '이서준', phone: '010-9876-5432' },
    issueContactMatch: '',
    uploadInfo: { userId: 'seojun_lee', name: '이서준', phone: '010-9876-5432' },
    issueUpload: '',
  },
  {
    id: 'cm-3',
    orderDate: '2026-04-03 10:20',
    orderNumber: '2026040375862299',
    storefarm: { userId: 'haeun_p', name: '박하은', phone: '010-1111-2222' },
    memberById: { userId: 'haeun_p', name: '박하은', phone: '010-1111-2222' },
    issueIdMatch: '',
    memberByContact: { userId: 'haeun_p', name: '박하은', phone: '010-5555-1212' },
    issueContactMatch: '연락처매칭 실패',
    uploadInfo: { userId: 'haeun_p', name: '박하은', phone: '010-1111-2222' },
    issueUpload: '',
  },
  {
    id: 'cm-4',
    orderDate: '2026-04-02 09:10',
    orderNumber: '2026040275862100',
    storefarm: { userId: 'yujin_choi', name: '최유진', phone: '010-2222-3333' },
    memberById: { userId: 'yujin_choi', name: '최유진', phone: '010-2222-3333' },
    issueIdMatch: '',
    memberByContact: { userId: 'yujin_choi', name: '최유진', phone: '010-2222-3333' },
    issueContactMatch: '',
    uploadInfo: { userId: '—', name: '—', phone: '—' },
    issueUpload: '원본 미업로드',
  },
];
