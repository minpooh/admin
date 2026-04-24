/** 필프레임 · 업로드관리 · 재수정요청 관리 더미 데이터 */
export type FeelframeReuploadStatus = '답변전' | '답변완료';

export type FeelframeReuploadRow = {
  id: string;
  orderNo: string;
  manager: string;
  title: string;
  customerName: string;
  customerId: string;
  requestedAt: string;
  status: FeelframeReuploadStatus;
  answeredAt: string;
};

export type FeelframeReuploadAttachment = {
  id: string;
  fileName: string;
};

export type FeelframeReuploadDetail = FeelframeReuploadRow & {
  customerInfoText: string;
  productName: string;
  orderOptionSummary: string;
  requestContent: string;
  answererName: string;
  answerContent: string;
  attachments: FeelframeReuploadAttachment[];
};

const REUPLOAD_DETAIL_PRODUCT_NAMES = [
  '필프레임 클래식 웨딩 액자 보정',
  '필프레임 프리미엄 메탈 프레임 보정',
  '필프레임 미니 액자 세트 보정',
  '필프레임 원목 프레임 보정',
  '필프레임 매트 프레임 보정',
] as const;

const REUPLOAD_DETAIL_ORDER_OPTIONS = [
  '사이즈 대형 · 프레임 우드 무광 · 배송 일반',
  '사이즈 중형 · 프레임 블랙 유광 · 배송 당일',
  '사이즈 소형 · 프레임 화이트 · 배송 일반',
  '사이즈 대형 · 프레임 실버 메탈 · 배송 일반',
  '사이즈 중형 · 프레임 원목 엣지 · 배송 예약',
] as const;

function reuploadRowIndex(row: FeelframeReuploadRow): number {
  const m = /^rr-(\d+)$/.exec(row.id);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n - 1 : 0;
}

export const MOCK_FEELFRAME_REUPLOAD_LIST: FeelframeReuploadRow[] = [
  {
    id: 'rr-1',
    orderNo: '20260417-00060101',
    manager: '박채은',
    title: '색감 재보정 요청',
    customerName: '민수정',
    customerId: 'minsujung91',
    requestedAt: '2026-04-17 11:02:18',
    status: '답변전',
    answeredAt: '',
  },
  {
    id: 'rr-2',
    orderNo: '20260417-00060102',
    manager: '손하준',
    title: '밝기 조정 재요청',
    customerName: '김태희',
    customerId: 'taehee_k',
    requestedAt: '2026-04-17 10:45:30',
    status: '답변완료',
    answeredAt: '2026-04-17 14:22:10',
  },
  {
    id: 'rr-3',
    orderNo: '20260417-00060103',
    manager: '문희수',
    title: '피부톤 수정 요청',
    customerName: '이정민',
    customerId: 'jungmin_lee',
    requestedAt: '2026-04-17 09:33:41',
    status: '답변전',
    answeredAt: '',
  },
  {
    id: 'rr-4',
    orderNo: '20260417-00060104',
    manager: '허예진',
    title: '배경 재보정 요청',
    customerName: '박서현',
    customerId: 'seohyun_p',
    requestedAt: '2026-04-16 17:21:05',
    status: '답변완료',
    answeredAt: '2026-04-17 09:15:42',
  },
  {
    id: 'rr-5',
    orderNo: '20260417-00060105',
    manager: '정유진',
    title: '크롭 수정 요청',
    customerName: '최윤서',
    customerId: 'yunseo_choi',
    requestedAt: '2026-04-16 16:10:22',
    status: '답변전',
    answeredAt: '',
  },
  {
    id: 'rr-6',
    orderNo: '20260417-00060106',
    manager: '박채은',
    title: '전체적인 톤 재조정 요청',
    customerName: '장하은',
    customerId: 'haeun_j',
    requestedAt: '2026-04-16 15:48:33',
    status: '답변완료',
    answeredAt: '2026-04-16 18:30:11',
  },
  {
    id: 'rr-7',
    orderNo: '20260417-00060107',
    manager: '손하준',
    title: '얼굴 밝기 추가 보정 요청',
    customerName: '송예린',
    customerId: 'yerin_song',
    requestedAt: '2026-04-16 14:25:17',
    status: '답변전',
    answeredAt: '',
  },
  {
    id: 'rr-8',
    orderNo: '20260417-00060108',
    manager: '문희수',
    title: '그림자 제거 재요청',
    customerName: '윤지호',
    customerId: 'jiho_yoon',
    requestedAt: '2026-04-16 13:55:09',
    status: '답변완료',
    answeredAt: '2026-04-16 16:44:28',
  },
  {
    id: 'rr-9',
    orderNo: '20260417-00060109',
    manager: '허예진',
    title: '색온도 조정 재요청',
    customerName: '한소율',
    customerId: 'soyul_han',
    requestedAt: '2026-04-16 12:30:44',
    status: '답변전',
    answeredAt: '',
  },
  {
    id: 'rr-10',
    orderNo: '20260417-00060110',
    manager: '정유진',
    title: '선명도 재보정 요청',
    customerName: '오채원',
    customerId: 'chaewon_oh',
    requestedAt: '2026-04-16 11:18:56',
    status: '답변완료',
    answeredAt: '2026-04-16 15:05:33',
  },
  {
    id: 'rr-11',
    orderNo: '20260417-00060111',
    manager: '박채은',
    title: '화이트밸런스 수정 요청',
    customerName: '강민재',
    customerId: 'minjae_kang',
    requestedAt: '2026-04-15 18:42:31',
    status: '답변전',
    answeredAt: '',
  },
  {
    id: 'rr-12',
    orderNo: '20260417-00060112',
    manager: '손하준',
    title: '노출 재조정 요청',
    customerName: '임서영',
    customerId: 'seoyoung_im',
    requestedAt: '2026-04-15 17:05:19',
    status: '답변완료',
    answeredAt: '2026-04-15 20:11:47',
  },
  {
    id: 'rr-13',
    orderNo: '20260417-00060113',
    manager: '문희수',
    title: '콘트라스트 재보정 요청',
    customerName: '류하린',
    customerId: 'harin_ryu',
    requestedAt: '2026-04-15 15:33:28',
    status: '답변전',
    answeredAt: '',
  },
  {
    id: 'rr-14',
    orderNo: '20260417-00060114',
    manager: '허예진',
    title: '레드아이 제거 재요청',
    customerName: '정다은',
    customerId: 'daeun_jung',
    requestedAt: '2026-04-15 14:12:45',
    status: '답변완료',
    answeredAt: '2026-04-15 17:48:02',
  },
  {
    id: 'rr-15',
    orderNo: '20260417-00060115',
    manager: '정유진',
    title: '채도 재조정 요청',
    customerName: '백준호',
    customerId: 'junho_baek',
    requestedAt: '2026-04-15 11:50:03',
    status: '답변전',
    answeredAt: '',
  },
];

export function getFeelframeReuploadDetailById(id: string): FeelframeReuploadDetail | undefined {
  const row = MOCK_FEELFRAME_REUPLOAD_LIST.find((item) => item.id === id);
  if (!row) return undefined;

  const idx = reuploadRowIndex(row);
  const productName = REUPLOAD_DETAIL_PRODUCT_NAMES[idx % REUPLOAD_DETAIL_PRODUCT_NAMES.length];
  const orderOptionSummary = REUPLOAD_DETAIL_ORDER_OPTIONS[idx % REUPLOAD_DETAIL_ORDER_OPTIONS.length];

  return {
    ...row,
    customerInfoText: `${row.customerName} (${row.customerId})`,
    productName,
    orderOptionSummary,
    requestContent: `${row.title}\n보정 결과물에서 요청사항이 충분히 반영되지 않아 재수정 요청드립니다.`,
    answererName: row.manager,
    answerContent:
      row.status === '답변완료'
        ? '<p>요청하신 내용을 반영하여 재수정 진행 후 재업로드 완료했습니다.</p>'
        : '',
    attachments: [
      { id: `${row.id}-att-1`, fileName: `${row.orderNo}-요청원본.jpg` },
      { id: `${row.id}-att-2`, fileName: `${row.orderNo}-요청메모.txt` },
    ],
  };
}
