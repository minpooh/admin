export const WORK_HISTORY_PHOTO_STATUSES = ['생성중', '실패', '생성완료'] as const;
export type WorkHistoryPhotoStatus = (typeof WORK_HISTORY_PHOTO_STATUSES)[number];

export const WORK_HISTORY_PHOTO_STYLES = ['원본', '지브리', '픽사', '디즈니', '치비'] as const;
export type WorkHistoryPhotoStyle = (typeof WORK_HISTORY_PHOTO_STYLES)[number];

export const WORK_HISTORY_PHOTO_CHANNELS = ['필카드', '필메이커'] as const;
export type WorkHistoryPhotoChannel = (typeof WORK_HISTORY_PHOTO_CHANNELS)[number];

export const WORK_HISTORY_PHOTO_PAYMENT_STATUSES = ['결제완료', '결제전', '실패', '취소'] as const;
export type WorkHistoryPhotoPaymentStatus = (typeof WORK_HISTORY_PHOTO_PAYMENT_STATUSES)[number];

export type WorkHistoryPhotoItem = {
  id: string;
  orderNo: string;
  status: WorkHistoryPhotoStatus;
  createdAt: string;
  style: WorkHistoryPhotoStyle;
  channel: WorkHistoryPhotoChannel;
  customerId: string;
  customerName: string;
  customerPhone: string;
  /** 해당 고객의 모션포토 누적 사용 횟수 */
  cumulativeUsage: number;
  /** 이번 주문 사용 금액(원) — 요약 카드용 */
  amount: number;
  /** 이번 작업 사용 토큰 */
  usedTokens: number;
  /** API 비용 추정(원) */
  apiCost: number;
  paymentStatus: WorkHistoryPhotoPaymentStatus;
  previewUrl: string | null;
  downloadUrl: string | null;
};

const PREVIEW_THUMB =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><rect width='160' height='160' fill='%23f3f4f6'/><rect x='18' y='24' width='124' height='112' rx='12' fill='%23e5e7eb'/><circle cx='80' cy='80' r='22' fill='%23d1d5db'/><polygon points='74,68 74,92 98,80' fill='%236b7280'/></svg>";

export const MOCK_WORK_HISTORY_PHOTO_ITEMS: WorkHistoryPhotoItem[] = [
  {
    id: 'photo-1',
    orderNo: 'MP-260917-001',
    status: '생성완료',
    createdAt: '2026-09-17 09:12:44',
    style: '지브리',
    channel: '필메이커',
    customerId: 'feelai_mj',
    customerName: '이민정',
    customerPhone: '010-1111-2222',
    cumulativeUsage: 8,
    amount: 9900,
    usedTokens: 123,
    apiCost: 2080,
    paymentStatus: '결제완료',
    previewUrl: PREVIEW_THUMB,
    downloadUrl: '/feelai/workHistory/intro/disney-couple-final.mp4',
  },
  {
    id: 'photo-2',
    orderNo: 'MP-260917-002',
    status: '생성중',
    createdAt: '2026-09-16 11:08:15',
    style: '픽사',
    channel: '필카드',
    customerId: 'kimcs',
    customerName: '김철수',
    customerPhone: '010-1234-5678',
    cumulativeUsage: 3,
    amount: 4900,
    usedTokens: 61,
    apiCost: 980,
    paymentStatus: '결제전',
    previewUrl: null,
    downloadUrl: null,
  },
  {
    id: 'photo-3',
    orderNo: 'MP-260916-014',
    status: '생성완료',
    createdAt: '2026-09-10 16:41:02',
    style: '디즈니',
    channel: '필메이커',
    customerId: 'park_yh',
    customerName: '박영희',
    customerPhone: '010-2222-3333',
    cumulativeUsage: 12,
    amount: 12900,
    usedTokens: 161,
    apiCost: 2880,
    paymentStatus: '결제완료',
    previewUrl: PREVIEW_THUMB,
    downloadUrl: '/feelai/workHistory/intro/disney-couple-final.mp4',
  },
  {
    id: 'photo-4',
    orderNo: 'MP-260916-008',
    status: '실패',
    createdAt: '2026-09-09 13:22:51',
    style: '치비',
    channel: '필카드',
    customerId: 'lee_ds',
    customerName: '이동수',
    customerPhone: '010-3333-4444',
    cumulativeUsage: 2,
    amount: 4900,
    usedTokens: 61,
    apiCost: 980,
    paymentStatus: '실패',
    previewUrl: null,
    downloadUrl: null,
  },
  {
    id: 'photo-5',
    orderNo: 'MP-260915-021',
    status: '생성완료',
    createdAt: '2026-09-03 18:03:27',
    style: '원본',
    channel: '필메이커',
    customerId: 'choi_hn',
    customerName: '최하나',
    customerPhone: '010-5555-6666',
    cumulativeUsage: 5,
    amount: 3900,
    usedTokens: 48,
    apiCost: 1180,
    paymentStatus: '결제완료',
    previewUrl: PREVIEW_THUMB,
    downloadUrl: '/feelai/workHistory/intro/disney-couple-final.mp4',
  },
  {
    id: 'photo-6',
    orderNo: 'MP-260915-009',
    status: '생성중',
    createdAt: '2026-09-02 10:46:09',
    style: '지브리',
    channel: '필카드',
    customerId: 'jung_sw',
    customerName: '정수원',
    customerPhone: '010-7777-8888',
    cumulativeUsage: 1,
    amount: 9900,
    usedTokens: 123,
    apiCost: 2080,
    paymentStatus: '결제전',
    previewUrl: null,
    downloadUrl: null,
  },
  {
    id: 'photo-7',
    orderNo: 'MP-260914-033',
    status: '생성완료',
    createdAt: '2026-08-27 20:11:38',
    style: '픽사',
    channel: '필메이커',
    customerId: 'han_jy',
    customerName: '한지윤',
    customerPhone: '010-8888-9999',
    cumulativeUsage: 15,
    amount: 14900,
    usedTokens: 186,
    apiCost: 3180,
    paymentStatus: '결제완료',
    previewUrl: PREVIEW_THUMB,
    downloadUrl: '/feelai/workHistory/intro/disney-couple-final.mp4',
  },
  {
    id: 'photo-8',
    orderNo: 'MP-260914-012',
    status: '실패',
    createdAt: '2026-08-26 09:05:17',
    style: '디즈니',
    channel: '필카드',
    customerId: 'oh_mr',
    customerName: '오미라',
    customerPhone: '010-1010-2020',
    cumulativeUsage: 4,
    amount: 9900,
    usedTokens: 123,
    apiCost: 2080,
    paymentStatus: '취소',
    previewUrl: null,
    downloadUrl: null,
  },
  {
    id: 'photo-9',
    orderNo: 'MP-260913-027',
    status: '생성완료',
    createdAt: '2026-08-20 15:33:50',
    style: '치비',
    channel: '필메이커',
    customerId: 'yoon_kj',
    customerName: '윤기준',
    customerPhone: '010-3030-4040',
    cumulativeUsage: 7,
    amount: 7900,
    usedTokens: 98,
    apiCost: 1780,
    paymentStatus: '결제완료',
    previewUrl: PREVIEW_THUMB,
    downloadUrl: '/feelai/workHistory/intro/disney-couple-final.mp4',
  },
  {
    id: 'photo-10',
    orderNo: 'MP-260913-004',
    status: '생성완료',
    createdAt: '2026-08-19 08:19:02',
    style: '원본',
    channel: '필카드',
    customerId: 'seo_hj',
    customerName: '서현주',
    customerPhone: '010-5050-6060',
    cumulativeUsage: 9,
    amount: 3900,
    usedTokens: 48,
    apiCost: 1180,
    paymentStatus: '결제완료',
    previewUrl: PREVIEW_THUMB,
    downloadUrl: '/feelai/workHistory/intro/disney-couple-final.mp4',
  },
  {
    id: 'photo-11',
    orderNo: 'MP-260912-019',
    status: '생성중',
    createdAt: '2026-09-18 17:44:28',
    style: '지브리',
    channel: '필메이커',
    customerId: 'baek_sj',
    customerName: '백소진',
    customerPhone: '010-7070-8080',
    cumulativeUsage: 2,
    amount: 9900,
    usedTokens: 123,
    apiCost: 2080,
    paymentStatus: '결제전',
    previewUrl: null,
    downloadUrl: null,
  },
  {
    id: 'photo-12',
    orderNo: 'MP-260911-006',
    status: '생성완료',
    createdAt: '2026-09-19 12:01:55',
    style: '픽사',
    channel: '필카드',
    customerId: 'kwon_th',
    customerName: '권태호',
    customerPhone: '010-9090-1010',
    cumulativeUsage: 6,
    amount: 12900,
    usedTokens: 161,
    apiCost: 2880,
    paymentStatus: '결제완료',
    previewUrl: PREVIEW_THUMB,
    downloadUrl: '/feelai/workHistory/intro/disney-couple-final.mp4',
  },
];
