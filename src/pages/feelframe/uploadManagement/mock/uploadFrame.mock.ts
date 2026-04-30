/** 필프레임 · 업로드관리 · 액자 업로드 목록 더미 데이터 */
export type FeelframeUploadFrameProgress =
  | '고객업로드'
  | '관리자업로드'
  | '수정요청'
  | '시안확정'
  | '상품준비중';

export type FeelframeUploadFrameMemoEntry = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

/** 관리자 업로드 미리보기 이미지(목록·모달·툴팁) */
export type FeelframeUploadFrameAdminPreviewImage = {
  id: string;
  url: string;
  uploadedAt: string;
};

export type FeelframeUploadFrameRow = {
  id: string;
  orderedAt: string;
  orderNo: string;
  productInfo: string;
  /** 배송업체명 (상품정보 컬럼 하단에 표시) */
  shippingCarrierName: string;
  customerName: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  correctionRequest: string;
  correctionIntensity: string;
  progressStatus: FeelframeUploadFrameProgress;
  /** 시안확정 상태일 때 확정일자 */
  confirmedAt: string;
  firstImageLabel: string;
  memo: FeelframeUploadFrameMemoEntry[];
  /** 관리자가 업로드한 시안 등 미리보기 이미지 */
  adminPreviewImages: FeelframeUploadFrameAdminPreviewImage[];
  manager: string;
};

type FeelframeUploadFrameRowDraft = Omit<
  FeelframeUploadFrameRow,
  'shippingCarrierName' | 'adminPreviewImages' | 'progressStatus' | 'confirmedAt'
> & {
  progressStatus: FeelframeUploadFrameLegacyProgress;
};

const MOCK_FEELFRAME_ORDER_SHIPPING_CARRIERS = [
  '방문수령',
  'CJ대한통운',
  '한진택배',
  '롯데택배',
  '우체국택배',
  '경동택배',
  '대신택배',
] as const;

type FeelframeUploadFrameLegacyProgress = '작업전' | '작업중' | '시안전달' | '수정요청' | '시안확정' | '발주완료';

function feelframeMapLegacyUploadFrameProgress(legacy: FeelframeUploadFrameLegacyProgress): FeelframeUploadFrameProgress {
  if (legacy === '작업전') return '고객업로드';
  if (legacy === '작업중' || legacy === '시안전달') return '관리자업로드';
  if (legacy === '발주완료') return '상품준비중';
  return legacy;
}

function feelframeBuildFrameConfirmedAt(orderedAt: string, progressStatus: FeelframeUploadFrameProgress): string {
  if (progressStatus !== '시안확정') return '';
  const base = orderedAt.replace(' ', 'T');
  const d = new Date(base);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + 1);
  d.setHours(11, 20, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function feelframeMockAdminPreviewImages(rowId: string, idx: number): FeelframeUploadFrameAdminPreviewImage[] {
  if (idx % 4 === 0) return [];
  const n = 1 + (idx % 3);
  return Array.from({ length: n }, (_, i) => ({
    id: `${rowId}-ad-prev-${i}`,
    url: `https://picsum.photos/seed/ffupload-${encodeURIComponent(rowId)}-${i}/480/360`,
    uploadedAt: `2026-04-${String(Math.max(1, 16 - (i % 5))).padStart(2, '0')} ${String(9 + i).padStart(2, '0')}:18:00`,
  }));
}

const MOCK_FEELFRAME_UPLOAD_FRAME_LIST_RAW: FeelframeUploadFrameRowDraft[] = [
  {
    id: 'uf-1',
    orderedAt: '2026-04-16 11:02:18',
    orderNo: '20260416-00031001',
    productInfo: '아크릴 액자 20x30 + 보정 1건',
    customerName: '민수정',
    customerId: 'minsujung91',
    customerEmail: 'minsujung91@email.com',
    customerPhone: '010-2234-8899',
    correctionRequest: '밝기 보정',
    correctionIntensity: '디자이너 임의',
    progressStatus: '작업중',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '박채은',
  },
  {
    id: 'uf-2',
    orderedAt: '2026-04-16 10:48:33',
    orderNo: '20260416-00031002',
    productInfo: '실버 프레임 액자 단품',
    customerName: '유나',
    customerId: 'yuna_wed',
    customerEmail: 'yuna.wed@example.com',
    customerPhone: '010-5123-9012',
    correctionRequest: '없음',
    correctionIntensity: '디자이너 임의',
    progressStatus: '작업전',
    firstImageLabel: 'IMG',
    memo: [{ id: 'uf-2-memo-1', author: '손하준', content: '고객 요청 확인', createdAt: '2026-04-16 10:48:33' }],
    manager: '손하준',
  },
  {
    id: 'uf-3',
    orderedAt: '2026-04-16 10:21:05',
    orderNo: '20260416-00031003',
    productInfo: '포토테이블 세트 + 액자',
    customerName: '이혜연',
    customerId: 'hyeyeon.lee',
    customerEmail: 'hyeyeon.lee@sample.co.kr',
    customerPhone: '010-9934-2210',
    correctionRequest: '색감 보정',
    correctionIntensity: '강함',
    progressStatus: '시안전달',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '문희수',
  },
  {
    id: 'uf-4',
    orderedAt: '2026-04-16 09:55:41',
    orderNo: '20260416-00031004',
    productInfo: '프리미엄 액자 + 보정 2건',
    customerName: '김소연',
    customerId: 'soyeon_k',
    customerEmail: 'soyeon.k@example.com',
    customerPhone: '010-4412-7788',
    correctionRequest: '피부 보정',
    correctionIntensity: '보통',
    progressStatus: '수정요청',
    firstImageLabel: 'IMG',
    memo: [{ id: 'uf-4-memo-1', author: '허예진', content: '문구 위치 수정', createdAt: '2026-04-16 09:55:41' }],
    manager: '허예진',
  },
  {
    id: 'uf-5',
    orderedAt: '2026-04-16 09:12:27',
    orderNo: '20260416-00031005',
    productInfo: '원목 액자 30x40 + 보정 1건',
    customerName: '정예린',
    customerId: 'jane_wedday',
    customerEmail: 'jane.wedday@mail.com',
    customerPhone: '010-7721-9934',
    correctionRequest: '없음',
    correctionIntensity: '약함',
    progressStatus: '시안확정',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '정유진',
  },
  {
    id: 'uf-6',
    orderedAt: '2026-04-15 18:40:09',
    orderNo: '20260415-00030990',
    productInfo: '심플 프레임 액자 단품',
    customerName: '김민하',
    customerId: 'minha_story',
    customerEmail: 'minha.story@sample.com',
    customerPhone: '010-3412-4509',
    correctionRequest: '밝기 보정',
    correctionIntensity: '보통',
    progressStatus: '발주완료',
    firstImageLabel: 'IMG',
    memo: [{ id: 'uf-6-memo-1', author: '박채은', content: '발주 완료', createdAt: '2026-04-15 18:40:09' }],
    manager: '박채은',
  },
  {
    id: 'uf-7',
    orderedAt: '2026-04-15 17:22:51',
    orderNo: '20260415-00030989',
    productInfo: '프리미엄 액자 + 보정 3건',
    customerName: '아리',
    customerId: 'wedding_ari',
    customerEmail: 'wedding.ari@example.com',
    customerPhone: '010-6622-8810',
    correctionRequest: '색감 보정',
    correctionIntensity: '강함',
    progressStatus: '작업중',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '손하준',
  },
  {
    id: 'uf-8',
    orderedAt: '2026-04-15 16:08:14',
    orderNo: '20260415-00030988',
    productInfo: '아크릴 액자 20x30',
    customerName: '정하은',
    customerId: 'haeun_01',
    customerEmail: 'haeun_01@naver.com',
    customerPhone: '010-8891-2214',
    correctionRequest: '없음',
    correctionIntensity: '약함',
    progressStatus: '작업전',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '문희수',
  },
  {
    id: 'uf-9',
    orderedAt: '2026-04-15 15:33:46',
    orderNo: '20260415-00030987',
    productInfo: '포토테이블 세트',
    customerName: '이수빈',
    customerId: 'flora_wedding',
    customerEmail: 'flora.wedding@mail.com',
    customerPhone: '010-7342-1200',
    correctionRequest: '피부 보정',
    correctionIntensity: '보통',
    progressStatus: '시안전달',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '허예진',
  },
  {
    id: 'uf-10',
    orderedAt: '2026-04-15 14:19:02',
    orderNo: '20260415-00030986',
    productInfo: '원목 액자 20x30 + 보정 2건',
    customerName: '강하늘',
    customerId: 'dear_haneul',
    customerEmail: 'dear.haneul@example.com',
    customerPhone: '010-2911-6007',
    correctionRequest: '밝기 보정',
    correctionIntensity: '강함',
    progressStatus: '수정요청',
    firstImageLabel: 'IMG',
    memo: [{ id: 'uf-10-memo-1', author: '정유진', content: '여백 조정 요청', createdAt: '2026-04-15 14:19:02' }],
    manager: '정유진',
  },
  {
    id: 'uf-11',
    orderedAt: '2026-04-15 13:44:28',
    orderNo: '20260415-00030985',
    productInfo: '프레임 액자 + 감사보드',
    customerName: '송지우',
    customerId: 'song_for_u',
    customerEmail: 'song.for.u@sample.co.kr',
    customerPhone: '010-9983-1450',
    correctionRequest: '없음',
    correctionIntensity: '약함',
    progressStatus: '시안확정',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '박채은',
  },
  {
    id: 'uf-12',
    orderedAt: '2026-04-15 12:11:55',
    orderNo: '20260415-00030984',
    productInfo: '프리미엄 액자 + 보정 1건',
    customerName: '최다은',
    customerId: 'dayfilm_choi',
    customerEmail: 'dayfilm.choi@mail.com',
    customerPhone: '010-4482-3109',
    correctionRequest: '색감 보정',
    correctionIntensity: '보통',
    progressStatus: '작업중',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '손하준',
  },
  {
    id: 'uf-13',
    orderedAt: '2026-04-15 11:05:37',
    orderNo: '20260415-00030983',
    productInfo: '아크릴 액자 30x40',
    customerName: '박서윤',
    customerId: 'wedding_note',
    customerEmail: 'wedding.note@naver.com',
    customerPhone: '010-8322-7744',
    correctionRequest: '피부 보정',
    correctionIntensity: '강함',
    progressStatus: '발주완료',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '문희수',
  },
  {
    id: 'uf-14',
    orderedAt: '2026-04-15 10:22:19',
    orderNo: '20260415-00030982',
    productInfo: '포토테이블 세트 + 액자 1건',
    customerName: '윤가은',
    customerId: 'mylove_frame',
    customerEmail: 'mylove.frame@example.com',
    customerPhone: '010-5711-0089',
    correctionRequest: '없음',
    correctionIntensity: '약함',
    progressStatus: '작업전',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '허예진',
  },
  {
    id: 'uf-15',
    orderedAt: '2026-04-15 09:41:02',
    orderNo: '20260415-00030981',
    productInfo: '우드 프레임 20x30 + 보정 1건',
    customerName: '김소라',
    customerId: 'wedding_sora',
    customerEmail: 'wedding.sora@example.com',
    customerPhone: '010-2011-7933',
    correctionRequest: '밝기 보정',
    correctionIntensity: '보통',
    progressStatus: '시안전달',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '정유진',
  },
  {
    id: 'uf-16',
    orderedAt: '2026-04-15 09:05:44',
    orderNo: '20260415-00030980',
    productInfo: '미니 액자 2개 세트',
    customerName: '김하나',
    customerId: 'hana_memory',
    customerEmail: 'hana.memory@mail.com',
    customerPhone: '010-3384-7751',
    correctionRequest: '없음',
    correctionIntensity: '약함',
    progressStatus: '수정요청',
    firstImageLabel: 'IMG',
    memo: [{ id: 'uf-16-memo-1', author: '박채은', content: '문구 수정', createdAt: '2026-04-15 09:05:44' }],
    manager: '박채은',
  },
  {
    id: 'uf-17',
    orderedAt: '2026-04-14 17:33:11',
    orderNo: '20260414-00030955',
    productInfo: '감사보드 + 액자 1건',
    customerName: '채다은',
    customerId: 'newly_chae',
    customerEmail: 'newly.chae@example.com',
    customerPhone: '010-7712-2240',
    correctionRequest: '색감 보정',
    correctionIntensity: '강함',
    progressStatus: '시안확정',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '손하준',
  },
  {
    id: 'uf-18',
    orderedAt: '2026-04-14 16:12:08',
    orderNo: '20260414-00030954',
    productInfo: '원목 액자 단품',
    customerName: '고미오',
    customerId: 'mio_story',
    customerEmail: 'mio.story@sample.com',
    customerPhone: '010-1222-3411',
    correctionRequest: '피부 보정',
    correctionIntensity: '보통',
    progressStatus: '작업중',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '문희수',
  },
  {
    id: 'uf-19',
    orderedAt: '2026-04-14 15:28:56',
    orderNo: '20260414-00030953',
    productInfo: '아크릴 액자 20x30',
    customerName: '이설아',
    customerId: 'seol_archive',
    customerEmail: 'seol.archive@sample.co.kr',
    customerPhone: '010-8770-2135',
    correctionRequest: '없음',
    correctionIntensity: '약함',
    progressStatus: '발주완료',
    firstImageLabel: 'IMG',
    memo: [{ id: 'uf-19-memo-1', author: '허예진', content: '출고 대기', createdAt: '2026-04-14 15:28:56' }],
    manager: '허예진',
  },
  {
    id: 'uf-20',
    orderedAt: '2026-04-14 14:01:33',
    orderNo: '20260414-00030952',
    productInfo: '우드 프레임 + 보정 1건',
    customerName: '서마리',
    customerId: 'mari_wedbook',
    customerEmail: 'mari.wedbook@mail.com',
    customerPhone: '010-9112-6641',
    correctionRequest: '밝기 보정',
    correctionIntensity: '보통',
    progressStatus: '작업전',
    firstImageLabel: 'IMG',
    memo: [],
    manager: '정유진',
  },
];

export const MOCK_FEELFRAME_UPLOAD_FRAME_LIST: FeelframeUploadFrameRow[] = MOCK_FEELFRAME_UPLOAD_FRAME_LIST_RAW.map((row, idx) => ({
  ...row,
  progressStatus: feelframeMapLegacyUploadFrameProgress(row.progressStatus as FeelframeUploadFrameLegacyProgress),
  confirmedAt: feelframeBuildFrameConfirmedAt(
    row.orderedAt,
    feelframeMapLegacyUploadFrameProgress(row.progressStatus as FeelframeUploadFrameLegacyProgress)
  ),
  shippingCarrierName: MOCK_FEELFRAME_ORDER_SHIPPING_CARRIERS[idx % MOCK_FEELFRAME_ORDER_SHIPPING_CARRIERS.length],
  adminPreviewImages: feelframeMockAdminPreviewImages(row.id, idx),
}));
