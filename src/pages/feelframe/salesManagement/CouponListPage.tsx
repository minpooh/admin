import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import Modal, { ModalDatePicker, ModalInput } from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import { pagePath } from '../../../routes';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import CouponDetailPage from './CouponDetailPage.tsx';

const COUPON_TABS = [
  { id: 'general' as const, label: '일반쿠폰' },
  { id: 'point' as const, label: '적립금쿠폰' },
];

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '쿠폰이름', label: '쿠폰이름' },
  { value: '쿠폰번호', label: '쿠폰번호' },
  { value: '그룹코드', label: '그룹코드' },
] as const;

const GENERAL_COUPON_KIND_OPTIONS = ['퍼센트할인', '금액할인', '무료'] as const;
const COUPON_TYPE_OPTIONS = ['중복쿠폰', '개별쿠폰'] as const;
const ORDER_COUPON_OPTIONS = ['사용가능', '사용불가능'] as const;
const COUPON_SCOPE_OPTIONS = ['특정상품', '전체상품'] as const;
const PAYMENT_METHOD_OPTIONS = ['카드', '무통장', '상관없음'] as const;

const PRODUCT_THUMBNAIL_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='10' fill='%23f3f4f6'/><rect x='14' y='18' width='52' height='44' rx='6' fill='%23d1d5db'/><circle cx='30' cy='34' r='6' fill='%239ca3af'/><path d='M20 56l17-17 10 10 7-7 12 14z' fill='%239ca3af'/></svg>";

type CouponTabId = (typeof COUPON_TABS)[number]['id'];
type SearchType = (typeof SEARCH_OPTIONS)[number]['value'];

type CouponSearch = {
  issueDateRange: string;
  issueStartDate: Date | null;
  issueEndDate: Date | null;
  searchType: SearchType;
  keyword: string;
};

type AppliedChipKey = 'issueDate' | 'keyword';

type GeneralCouponDraft = {
  couponKind: (typeof GENERAL_COUPON_KIND_OPTIONS)[number];
  discountAmount: string;
  couponType: (typeof COUPON_TYPE_OPTIONS)[number];
  orderCouponAvailability: (typeof ORDER_COUPON_OPTIONS)[number];
  scope: (typeof COUPON_SCOPE_OPTIONS)[number];
  couponIssueType: '자동발급' | '직접발급';
  couponNo: string;
  issueCount: string;
  couponName: string;
  expiresAt: Date | null;
  minOrderAmount: string;
  paymentMethod: (typeof PAYMENT_METHOD_OPTIONS)[number];
};

type PointCouponDraft = {
  conversionAmount: string;
  issueCount: string;
  couponName: string;
  expiresAt: Date | null;
};

type EditTarget =
  | { tab: 'general'; id: string; draft: GeneralCouponDraft }
  | { tab: 'point'; id: string; draft: PointCouponDraft };

type GeneralCouponRow = {
  id: string;
  groupNo: string;
  participationCode: string;
  groupName: string;
  couponName: string;
  couponNo: string;
  discountRate: number;
  expiresAt: string;
  scope: '특정상품' | '전체상품';
  products: CouponProduct[];
  issuedAt: string;
};

type CouponProduct = {
  productNo: string;
  productType: string;
  imageUrl: string;
  productName: string;
};

type ScopeProductRow = CouponProduct & {
  type: string;
  productPrice: number;
  salePrice: number;
};

type PointCouponRow = {
  id: string;
  groupNo: string;
  couponName: string;
  couponNo: string;
  conversionAmount: number;
  expiresAt: string;
  issuedAt: string;
};

const GENERAL_COUPONS: GeneralCouponRow[] = [
  {
    id: 'general-001',
    groupNo: '10001',
    participationCode: '1745941',
    groupName: '봄맞이 액자 공동구매',
    couponName: '공동구매 10% 할인쿠폰',
    couponNo: 'GN-1745941-001',
    discountRate: 10,
    expiresAt: '2026-06-10',
    scope: '특정상품',
    products: [
      {
        productNo: 'FF-PD-10001',
        productType: '액자',
        imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
        productName: '메탈 프레임 12R',
      },
      {
        productNo: 'FF-PD-10002',
        productType: '액자',
        imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
        productName: '우드 프레임 클래식',
      },
    ],
    issuedAt: '2026-05-01',
  },
  {
    id: 'general-002',
    groupNo: '10002',
    participationCode: '2837065',
    groupName: '가정의 달 가족사진 공구',
    couponName: '가족사진 공구 15% 쿠폰',
    couponNo: 'GN-2837065-002',
    discountRate: 15,
    expiresAt: '2026-05-30',
    scope: '전체상품',
    products: [
      {
        productNo: 'FF-PD-10001',
        productType: '액자',
        imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
        productName: '메탈 프레임 12R',
      },
      {
        productNo: 'FF-PD-10003',
        productType: '인화',
        imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
        productName: '대형 인화 패키지',
      },
      {
        productNo: 'FF-PD-10004',
        productType: '액자',
        imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
        productName: '미니 포토액자 세트',
      },
    ],
    issuedAt: '2026-04-18',
  },
  {
    id: 'general-003',
    groupNo: '10003',
    participationCode: '3951842',
    groupName: '스튜디오 웨딩 액자 공동구매',
    couponName: '웨딩 액자 할인쿠폰',
    couponNo: 'GN-3951842-003',
    discountRate: 12,
    expiresAt: '2026-07-01',
    scope: '특정상품',
    products: [
      {
        productNo: 'FF-PD-10003',
        productType: '인화',
        imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
        productName: '대형 인화 패키지',
      },
    ],
    issuedAt: '2026-05-08',
  },
];

const POINT_COUPONS: PointCouponRow[] = [
  {
    id: 'point-001',
    groupNo: '20001',
    couponName: '공구 참여 적립금 3,000원',
    couponNo: 'PT-1745941-001',
    conversionAmount: 3000,
    expiresAt: '2026-06-10',
    issuedAt: '2026-05-01',
  },
  {
    id: 'point-002',
    groupNo: '20002',
    couponName: '가족사진 적립금 5,000원',
    couponNo: 'PT-2837065-002',
    conversionAmount: 5000,
    expiresAt: '2026-05-30',
    issuedAt: '2026-04-18',
  },
  {
    id: 'point-003',
    groupNo: '20003',
    couponName: '웨딩 액자 적립금 7,000원',
    couponNo: 'PT-3951842-003',
    conversionAmount: 7000,
    expiresAt: '2026-07-01',
    issuedAt: '2026-05-08',
  },
];

const ITEMS_PER_PAGE = 10;

const ALL_SCOPE_PRODUCTS: ScopeProductRow[] = [
  {
    productNo: 'FF-PD-10001',
    type: '필프레임',
    productType: '액자',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '메탈 프레임 12R',
    productPrice: 89000,
    salePrice: 79000,
  },
  {
    productNo: 'FF-PD-10002',
    type: '필프레임',
    productType: '액자',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '우드 프레임 클래식',
    productPrice: 76000,
    salePrice: 69000,
  },
  {
    productNo: 'FF-PD-10003',
    type: '필프레임',
    productType: '인화',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '대형 인화 패키지',
    productPrice: 59000,
    salePrice: 52000,
  },
  {
    productNo: 'FF-PD-10004',
    type: '필프레임',
    productType: '액자',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '미니 포토액자 세트',
    productPrice: 42000,
    salePrice: 36000,
  },
  {
    productNo: 'FF-PD-10005',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10006',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10007',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10008',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10009',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10010',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
];

const LIST_PATH = pagePath({
  navId: 'feelframe',
  sectionId: 'salesManagement',
  itemId: 'couponList',
});

function couponDetailPath(id: string) {
  return pagePath({
    navId: 'feelframe',
    sectionId: 'salesManagement',
    itemId: 'couponList',
    subId: id,
  });
}

function parseYmd(value: string) {
  const [yyyy, mm, dd] = value.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function parseYmdToDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = parseYmd(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateRangeByPreset(preset: string): { start: Date; end: Date } {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);

  if (preset === '3일') start.setDate(start.getDate() - 2);
  if (preset === '1주') start.setDate(start.getDate() - 6);
  if (preset === '2주') start.setDate(start.getDate() - 13);
  if (preset === '1개월') start.setDate(start.getDate() - 29);
  if (preset === '3개월') start.setDate(start.getDate() - 89);
  if (preset === '6개월') start.setDate(start.getDate() - 179);

  return { start, end };
}

function getRemainingDays(expiresAt: string) {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expiry = parseYmd(expiresAt);
  return Math.ceil((expiry.getTime() - todayMidnight.getTime()) / 86400000);
}

function formatYmd(date: Date | null) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isDateInRange(value: string, start: Date | null, end: Date | null) {
  const target = parseYmd(value);
  const startBoundary = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()) : null;
  const endBoundary = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999) : null;
  if (startBoundary && target < startBoundary) return false;
  if (endBoundary && target > endBoundary) return false;
  return true;
}

function matchesSearch(row: GeneralCouponRow | PointCouponRow, search: CouponSearch | null) {
  if (!search) return true;
  if (!isDateInRange(row.issuedAt, search.issueStartDate, search.issueEndDate)) return false;

  const keyword = search.keyword.trim().toLowerCase();
  if (!keyword) return true;

  const hay =
    search.searchType === '쿠폰이름'
      ? row.couponName
      : search.searchType === '쿠폰번호'
        ? row.couponNo
        : search.searchType === '그룹코드'
          ? row.groupNo
          : `${row.couponName} ${row.couponNo} ${row.groupNo}`;
  return hay.toLowerCase().includes(keyword);
}

function isSearchEmpty(search: CouponSearch) {
  return !search.issueDateRange && !search.issueStartDate && !search.issueEndDate && !search.keyword.trim();
}

function createEmptyGeneralDraft(): GeneralCouponDraft {
  return {
    couponKind: '퍼센트할인',
    discountAmount: '',
    couponType: '중복쿠폰',
    orderCouponAvailability: '사용가능',
    scope: '특정상품',
    couponIssueType: '자동발급',
    couponNo: '',
    issueCount: '',
    couponName: '',
    expiresAt: null,
    minOrderAmount: '',
    paymentMethod: '상관없음',
  };
}

function createEmptyPointDraft(): PointCouponDraft {
  return {
    conversionAmount: '',
    issueCount: '',
    couponName: '',
    expiresAt: null,
  };
}

export default function CouponListPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [activeTab, setActiveTab] = useState<CouponTabId>('general');
  const [generalRows, setGeneralRows] = useState<GeneralCouponRow[]>(() => [...GENERAL_COUPONS]);
  const [pointRows, setPointRows] = useState<PointCouponRow[]>(() => [...POINT_COUPONS]);
  const [issueDateRange, setIssueDateRange] = useState('');
  const [issueStartDate, setIssueStartDate] = useState<Date | null>(null);
  const [issueEndDate, setIssueEndDate] = useState<Date | null>(null);
  const [searchType, setSearchType] = useState<SearchType>('전체');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<CouponSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productModalCouponId, setProductModalCouponId] = useState<string | null>(null);
  const [scopeModalCouponId, setScopeModalCouponId] = useState<string | null>(null);
  const [scopeSelectedProductNos, setScopeSelectedProductNos] = useState<Set<string>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ tab: CouponTabId; id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const activeGeneralRows = useMemo(
    () => generalRows.filter((row) => matchesSearch(row, appliedSearch)),
    [generalRows, appliedSearch]
  );
  const activePointRows = useMemo(
    () => pointRows.filter((row) => matchesSearch(row, appliedSearch)),
    [pointRows, appliedSearch]
  );
  const productModalCoupon = useMemo(
    () => generalRows.find((row) => row.id === productModalCouponId) ?? null,
    [generalRows, productModalCouponId]
  );
  const scopeModalCoupon = useMemo(
    () => generalRows.find((row) => row.id === scopeModalCouponId) ?? null,
    [generalRows, scopeModalCouponId]
  );
  const activeRows = activeTab === 'general' ? activeGeneralRows : activePointRows;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedGeneralRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return activeGeneralRows.slice(start, start + ITEMS_PER_PAGE);
  }, [activeGeneralRows, displayPage]);
  const paginatedPointRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return activePointRows.slice(start, start + ITEMS_PER_PAGE);
  }, [activePointRows, displayPage]);
  const detailName = useMemo(() => {
    if (!subId) return null;
    return (
      generalRows.find((row) => row.id === subId)?.couponName ??
      pointRows.find((row) => row.id === subId)?.couponName ??
      null
    );
  }, [subId, generalRows, pointRows]);

  const handleSearch = () => {
    const next: CouponSearch = {
      issueDateRange,
      issueStartDate,
      issueEndDate,
      searchType,
      keyword,
    };
    setAppliedSearch(isSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const handleIssueDatePresetChange = (next: string) => {
    if (!next) {
      setIssueDateRange('');
      setIssueStartDate(null);
      setIssueEndDate(null);
      return;
    }

    setIssueDateRange(next);
    const { start, end } = getDateRangeByPreset(next);
    setIssueStartDate(start);
    setIssueEndDate(end);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    switch (key) {
      case 'issueDate':
        setIssueDateRange('');
        setIssueStartDate(null);
        setIssueEndDate(null);
        next.issueDateRange = '';
        next.issueStartDate = null;
        next.issueEndDate = null;
        break;
      case 'keyword':
        setSearchType('전체');
        setKeyword('');
        next.searchType = '전체';
        next.keyword = '';
        break;
      default:
        break;
    }
    setAppliedSearch(isSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.issueDateRange || appliedSearch.issueStartDate || appliedSearch.issueEndDate) {
      chips.push({
        key: 'issueDate',
        label: `발급일: ${
          appliedSearch.issueDateRange ||
          `${formatYmd(appliedSearch.issueStartDate) || '시작'} ~ ${formatYmd(appliedSearch.issueEndDate) || '종료'}`
        }`,
      });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({ key: 'keyword', label: `검색: ${appliedSearch.searchType} ${appliedSearch.keyword}` });
    }
    return chips;
  }, [appliedSearch]);

  const handleCopy = (tab: CouponTabId, id: string) => {
    if (tab === 'general') {
      setGeneralRows((prev) => {
        const target = prev.find((row) => row.id === id);
        if (!target) return prev;
        return [{ ...target, id: `general-copy-${Date.now()}`, couponName: `${target.couponName} (복사)` }, ...prev];
      });
      setCurrentPage(1);
      return;
    }
    setPointRows((prev) => {
      const target = prev.find((row) => row.id === id);
      if (!target) return prev;
      return [{ ...target, id: `point-copy-${Date.now()}`, couponName: `${target.couponName} (복사)` }, ...prev];
    });
    setCurrentPage(1);
  };

  const openGeneralEditModal = (row: GeneralCouponRow) => {
    setEditTarget({
      tab: 'general',
      id: row.id,
      draft: {
        couponKind: '퍼센트할인',
        discountAmount: String(row.discountRate),
        couponType: '중복쿠폰',
        orderCouponAvailability: '사용가능',
        scope: row.scope,
        couponIssueType: '자동발급',
        couponNo: row.couponNo,
        issueCount: '100',
        couponName: row.couponName,
        expiresAt: parseYmdToDate(row.expiresAt),
        minOrderAmount: '0',
        paymentMethod: '상관없음',
      },
    });
  };

  const openPointEditModal = (row: PointCouponRow) => {
    setEditTarget({
      tab: 'point',
      id: row.id,
      draft: {
        conversionAmount: String(row.conversionAmount),
        issueCount: '100',
        couponName: row.couponName,
        expiresAt: parseYmdToDate(row.expiresAt),
      },
    });
  };

  const openCreateModal = () => {
    setEditTarget(
      activeTab === 'general'
        ? { tab: 'general', id: '', draft: createEmptyGeneralDraft() }
        : { tab: 'point', id: '', draft: createEmptyPointDraft() }
    );
  };

  const closeEditModal = () => setEditTarget(null);

  const openScopeModal = (row: GeneralCouponRow) => {
    setScopeModalCouponId(row.id);
    setScopeSelectedProductNos(
      new Set(
        row.scope === '전체상품'
          ? ALL_SCOPE_PRODUCTS.map((product) => product.productNo)
          : row.products.map((product) => product.productNo)
      )
    );
  };

  const closeScopeModal = () => {
    setScopeModalCouponId(null);
    setScopeSelectedProductNos(new Set());
  };

  const toggleScopeProduct = (productNo: string) => {
    setScopeSelectedProductNos((prev) => {
      const next = new Set(prev);
      if (next.has(productNo)) next.delete(productNo);
      else next.add(productNo);
      return next;
    });
  };

  const toggleAllScopeProducts = () => {
    setScopeSelectedProductNos((prev) =>
      prev.size === ALL_SCOPE_PRODUCTS.length ? new Set() : new Set(ALL_SCOPE_PRODUCTS.map((product) => product.productNo))
    );
  };

  const saveScopeModal = () => {
    if (!scopeModalCoupon) return;
    const selectedProducts = ALL_SCOPE_PRODUCTS.filter((product) => scopeSelectedProductNos.has(product.productNo)).map(
      ({ productNo, productType, imageUrl, productName }) => ({ productNo, productType, imageUrl, productName })
    );
    setGeneralRows((prev) =>
      prev.map((row) =>
        row.id === scopeModalCoupon.id
          ? {
              ...row,
              scope: selectedProducts.length === ALL_SCOPE_PRODUCTS.length ? '전체상품' : '특정상품',
              products: selectedProducts,
            }
          : row
      )
    );
    closeScopeModal();
  };

  const updateGeneralDraft = <K extends keyof GeneralCouponDraft>(key: K, value: GeneralCouponDraft[K]) => {
    setEditTarget((prev) =>
      prev?.tab === 'general' ? { ...prev, draft: { ...prev.draft, [key]: value } } : prev
    );
  };

  const updatePointDraft = <K extends keyof PointCouponDraft>(key: K, value: PointCouponDraft[K]) => {
    setEditTarget((prev) =>
      prev?.tab === 'point' ? { ...prev, draft: { ...prev.draft, [key]: value } } : prev
    );
  };

  const saveEditModal = () => {
    if (!editTarget) return;
    if (editTarget.tab === 'general') {
      const { draft } = editTarget;
      if (!editTarget.id) {
        setGeneralRows((prev) => [
          {
            id: `general-new-${Date.now()}`,
            groupNo: String(10000 + prev.length + 1),
            participationCode: '',
            groupName: '',
            couponName: draft.couponName || '신규 일반쿠폰',
            couponNo: draft.couponIssueType === '직접발급' ? draft.couponNo : `GN-${Date.now()}`,
            discountRate: Number(draft.discountAmount) || 0,
            expiresAt: formatYmd(draft.expiresAt) || formatYmd(new Date()),
            scope: draft.scope,
            products: [],
            issuedAt: formatYmd(new Date()),
          },
          ...prev,
        ]);
        setCurrentPage(1);
        closeEditModal();
        return;
      }
      setGeneralRows((prev) =>
        prev.map((row) =>
          row.id === editTarget.id
            ? {
                ...row,
                couponName: draft.couponName,
                couponNo: draft.couponIssueType === '직접발급' ? draft.couponNo : row.couponNo,
                discountRate: Number(draft.discountAmount) || 0,
                expiresAt: formatYmd(draft.expiresAt) || row.expiresAt,
                scope: draft.scope,
              }
            : row
        )
      );
      closeEditModal();
      return;
    }
    const { draft } = editTarget;
    if (!editTarget.id) {
      setPointRows((prev) => [
        {
          id: `point-new-${Date.now()}`,
          groupNo: String(20000 + prev.length + 1),
          couponName: draft.couponName || '신규 적립금쿠폰',
          couponNo: `PT-${Date.now()}`,
          conversionAmount: Number(draft.conversionAmount) || 0,
          expiresAt: formatYmd(draft.expiresAt) || formatYmd(new Date()),
          issuedAt: formatYmd(new Date()),
        },
        ...prev,
      ]);
      setCurrentPage(1);
      closeEditModal();
      return;
    }
    setPointRows((prev) =>
      prev.map((row) =>
        row.id === editTarget.id
          ? {
              ...row,
              couponName: draft.couponName,
              conversionAmount: Number(draft.conversionAmount) || 0,
              expiresAt: formatYmd(draft.expiresAt) || row.expiresAt,
            }
          : row
      )
    );
    closeEditModal();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.tab === 'general') {
      setGeneralRows((prev) => prev.filter((row) => row.id !== deleteTarget.id));
    } else {
      setPointRows((prev) => prev.filter((row) => row.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  if (subId) {
    return <CouponDetailPage couponName={detailName} listPath={LIST_PATH} />;
  }

  return (
    <div className="admin-list-page">
      <h1 className="page-title">쿠폰관리</h1>

      <nav className="admin-tabs" aria-label="쿠폰 구분">
        <div className="admin-tabs__list" role="tablist">
          {COUPON_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className={`admin-tabs__tab${isActive ? ' admin-tabs__tab--active' : ''}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="admin-list-box" aria-label="쿠폰 검색 필터">
        <div className="filter-top-row admin-filter-row--no-detail">
          <div className="filter-section">
            <span className="filter-label">발급일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="발급일 프리셋"
                className="listselect--date-range"
                value={issueDateRange}
                onChange={handleIssueDatePresetChange}
                options={[
                  { value: '', label: '미선택' },
                  ...DATE_RANGES.map((range) => ({ value: range, label: range })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={issueStartDate}
                  onChange={(date: Date | null) => {
                    setIssueStartDate(date);
                    setIssueDateRange('');
                  }}
                  selectsStart
                  startDate={issueStartDate}
                  endDate={issueEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!issueStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={issueEndDate}
                  onChange={(date: Date | null) => {
                    setIssueEndDate(date);
                    setIssueDateRange('');
                  }}
                  selectsEnd
                  startDate={issueStartDate}
                  endDate={issueEndDate}
                  minDate={issueStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!issueEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={searchType}
                onChange={(next) => setSearchType(next as SearchType)}
                options={[...SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label={activeTab === 'general' ? '일반쿠폰 목록' : '적립금쿠폰 목록'}>
        {appliedChips.length > 0 && (
          <section className="admin-applied-filters" aria-label="적용된 검색 조건">
            <div className="admin-applied-filters__left">
              <div className="admin-applied-filters__list">
                {appliedChips.map((chip) => (
                  <div key={chip.key} className="admin-filter-chip">
                    <span className="admin-filter-chip__text">{chip.label}</span>
                    <button
                      type="button"
                      className="admin-filter-chip__x"
                      aria-label={`${chip.label} 해제`}
                      onClick={() => clearAppliedFilter(chip.key)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        <div className="admin-table-wrap">
          {activeTab === 'general' ? (
            <table className="admin-table admin-table--min-w-1024">
              <thead>
                <tr>
                  <th>그룹번호</th>
                  <th>공동구매</th>
                  <th>쿠폰이름</th>
                  <th className="col-center">할인률</th>
                  <th className="col-center">쿠폰만료일</th>
                  <th className="col-center">적용범위</th>
                  <th className="col-center">적용상품</th>
                  <th className="col-center">수정</th>
                  <th className="col-center">삭제</th>
                  <th className="col-center">복사</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGeneralRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="admin-table-empty-cell">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedGeneralRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.groupNo}</td>
                      <td>{row.participationCode}</td>
                      <td className="admin-table-col-title">
                        <Link to={couponDetailPath(row.id)} className="admin-link admin-table-title-link" title={row.couponName}>
                          {row.couponName}
                        </Link>
                      </td>
                      <td className="col-center">{row.discountRate}%</td>
                      <td className="col-center">
                        <div className="cell-block">
                          <span className="cell-line">{getRemainingDays(row.expiresAt)}일남음</span>
                          <span className="cell-line admin-list-muted">{row.expiresAt}</span>
                        </div>
                      </td>
                      <td className="col-center">
                        <div className="cell-block" style={{ alignItems: 'center' }}>
                          <span className="cell-line">{row.scope}</span>
                          <button type="button" className="row-btn row-btn--default" onClick={() => openScopeModal(row)}>
                            범위변경
                          </button>
                        </div>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--default" onClick={() => setProductModalCouponId(row.id)}>
                          적용상품
                        </button>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--primary" onClick={() => openGeneralEditModal(row)}>
                          수정
                        </button>
                      </td>
                      <td className="col-center">
                        <button
                          type="button"
                          className="row-btn row-btn--red"
                          onClick={() => setDeleteTarget({ tab: 'general', id: row.id, name: row.couponName })}
                        >
                          삭제
                        </button>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--default" onClick={() => handleCopy('general', row.id)}>
                          복사
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="admin-table admin-table--min-w-800">
              <thead>
                <tr>
                  <th>그룹번호</th>
                  <th>쿠폰이름</th>
                  <th className="col-center">변환금액</th>
                  <th>쿠폰만료일</th>
                  <th className="col-center">수정</th>
                  <th className="col-center">삭제</th>
                  <th className="col-center">복사</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPointRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-table-empty-cell">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedPointRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.groupNo}</td>
                      <td className="admin-table-col-title">
                        <Link to={couponDetailPath(row.id)} className="admin-link admin-table-title-link" title={row.couponName}>
                          {row.couponName}
                        </Link>
                      </td>
                      <td className="col-center">{row.conversionAmount.toLocaleString()}원</td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{getRemainingDays(row.expiresAt)}일남음</span>
                          <span className="cell-line admin-list-muted">{row.expiresAt}</span>
                        </div>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--primary" onClick={() => openPointEditModal(row)}>
                          수정
                        </button>
                      </td>
                      <td className="col-center">
                        <button
                          type="button"
                          className="row-btn row-btn--red"
                          onClick={() => setDeleteTarget({ tab: 'point', id: row.id, name: row.couponName })}
                        >
                          삭제
                        </button>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--default" onClick={() => handleCopy('point', row.id)}>
                          복사
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-list-table-footer">
          <div className="admin-table-pagination">
            <div className="pagination-inner">
              <button
                type="button"
                onClick={() => setCurrentPage(jumpPageBack(displayPage))}
                disabled={displayPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, displayPage - 1))}
                disabled={displayPage <= 1}
                aria-label="이전 페이지"
              >
                &lsaquo;
              </button>
              {getVisiblePageNumbers(totalPages, displayPage).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={displayPage === page ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, displayPage + 1))}
                disabled={displayPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(jumpPageForward(displayPage, totalPages))}
                disabled={displayPage >= totalPages}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-list-add-row">
        <button type="button" className="admin-list-add-btn" onClick={openCreateModal} aria-label="쿠폰발급">
          <Plus size={18} aria-hidden="true" />
          쿠폰발급
        </button>
      </div>

      <Modal
        open={Boolean(productModalCoupon)}
        onClose={() => setProductModalCouponId(null)}
        ariaLabel="적용상품"
        variant="option"
        panelClassName="option-modal__panel--wide"
      >
        <Modal.Header>
          <Modal.Title>적용상품</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-table-wrap">
            <table className="admin-modal-table">
              <thead>
                <tr>
                  <th>상품번호</th>
                  <th>상품타입</th>
                  <th>이미지</th>
                  <th>상품명</th>
                </tr>
              </thead>
              <tbody>
                {productModalCoupon?.products.map((product) => (
                  <tr key={product.productNo}>
                    <td>{product.productNo}</td>
                    <td>{product.productType}</td>
                    <td>
                      <img
                        src={product.imageUrl}
                        alt={`${product.productName} 이미지`}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                      />
                    </td>
                    <td>{product.productName}</td>
                  </tr>
                ))}
                {!productModalCoupon?.products.length && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>
                      적용상품이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={() => setProductModalCouponId(null)}>
            닫기
          </button>
        </Modal.Footer>
      </Modal>

      <Modal
        open={Boolean(scopeModalCoupon)}
        onClose={closeScopeModal}
        ariaLabel="적용상품 설정"
        variant="option"
        panelClassName="option-modal__panel--wide"
      >
        <Modal.Header>
          <Modal.Title>적용상품 설정</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-table-wrap">
            <table className="admin-modal-table">
              <thead>
                <tr>
                  <th className="col-center">
                    <label className="admin-checkbox-label" style={{ justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={scopeSelectedProductNos.size === ALL_SCOPE_PRODUCTS.length}
                        onChange={toggleAllScopeProducts}
                      />
                    </label>
                  </th>
                  <th>타입</th>
                  <th>상품타입</th>
                  <th>상품이미지</th>
                  <th>상품명</th>
                  <th>상품가</th>
                  <th>판매가</th>
                </tr>
              </thead>
              <tbody>
                {ALL_SCOPE_PRODUCTS.map((product) => (
                  <tr key={product.productNo}>
                    <td className="col-center">
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={scopeSelectedProductNos.has(product.productNo)}
                        onChange={() => toggleScopeProduct(product.productNo)}
                        aria-label={`${product.productName} 선택`}
                      />
                    </td>
                    <td>{product.type}</td>
                    <td>{product.productType}</td>
                    <td>
                      <img
                        src={product.imageUrl}
                        alt={`${product.productName} 이미지`}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                      />
                    </td>
                    <td>{product.productName}</td>
                    <td>{product.productPrice.toLocaleString()}원</td>
                    <td>{product.salePrice.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeScopeModal}>
            닫기
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={saveScopeModal}>
            저장
          </button>
        </Modal.Footer>
      </Modal>

      <Modal
        open={Boolean(editTarget)}
        onClose={closeEditModal}
        ariaLabel={editTarget?.id ? '쿠폰 수정' : '쿠폰 발급'}
        variant="option"
      >
        <Modal.Header>
          <Modal.Title>{editTarget?.id ? '쿠폰 수정' : '쿠폰 발급'}</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          {editTarget?.tab === 'general' && (
            <div className="admin-modal-field-grid">
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">쿠폰종류</span>
                <ListSelect
                  ariaLabel="쿠폰종류"
                  className="listselect--modal"
                  value={editTarget.draft.couponKind}
                  onChange={(next) => updateGeneralDraft('couponKind', next as GeneralCouponDraft['couponKind'])}
                  options={GENERAL_COUPON_KIND_OPTIONS.map((option) => ({ value: option, label: option }))}
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">할인금액 (%)</span>
                <ModalInput
                  type="number"
                  min={0}
                  value={editTarget.draft.discountAmount}
                  onChange={(e) => updateGeneralDraft('discountAmount', e.target.value)}
                  aria-label="할인금액"
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">쿠폰타입</span>
                <ListSelect
                  ariaLabel="쿠폰타입"
                  className="listselect--modal"
                  value={editTarget.draft.couponType}
                  onChange={(next) => updateGeneralDraft('couponType', next as GeneralCouponDraft['couponType'])}
                  options={COUPON_TYPE_OPTIONS.map((option) => ({ value: option, label: option }))}
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">주문서쿠폰여부</span>
                <ListSelect
                  ariaLabel="주문서쿠폰여부"
                  className="listselect--modal"
                  value={editTarget.draft.orderCouponAvailability}
                  onChange={(next) =>
                    updateGeneralDraft('orderCouponAvailability', next as GeneralCouponDraft['orderCouponAvailability'])
                  }
                  options={ORDER_COUPON_OPTIONS.map((option) => ({ value: option, label: option }))}
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">적용상품</span>
                <ListSelect
                  ariaLabel="적용상품"
                  className="listselect--modal"
                  value={editTarget.draft.scope}
                  onChange={(next) => updateGeneralDraft('scope', next as GeneralCouponDraft['scope'])}
                  options={COUPON_SCOPE_OPTIONS.map((option) => ({ value: option, label: option }))}
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">쿠폰번호</span>
                <div className="option-modal__inline-controls">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={editTarget.draft.couponIssueType === '자동발급'}
                      onChange={() => updateGeneralDraft('couponIssueType', '자동발급')}
                    />
                    자동발급
                  </label>
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={editTarget.draft.couponIssueType === '직접발급'}
                      onChange={() => updateGeneralDraft('couponIssueType', '직접발급')}
                    />
                    직접발급
                  </label>
                  {editTarget.draft.couponIssueType === '직접발급' && (
                    <ModalInput
                      type="text"
                      value={editTarget.draft.couponNo}
                      onChange={(e) => updateGeneralDraft('couponNo', e.target.value)}
                      placeholder="쿠폰번호 입력"
                      aria-label="직접발급 쿠폰번호"
                    />
                  )}
                </div>
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">발행갯수 (개)</span>
                <ModalInput
                  type="number"
                  min={0}
                  value={editTarget.draft.issueCount}
                  onChange={(e) => updateGeneralDraft('issueCount', e.target.value)}
                  aria-label="발행갯수"
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">쿠폰이름</span>
                <div className="option-modal__inline-controls">
                  <ModalInput
                    type="text"
                    value={editTarget.draft.couponName}
                    onChange={(e) => updateGeneralDraft('couponName', e.target.value)}
                    aria-label="쿠폰이름"
                  />
                </div>
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">쿠폰사용기간 (까지)</span>
                <ModalDatePicker
                  modalOpen={Boolean(editTarget)}
                  selected={editTarget.draft.expiresAt}
                  onChange={(date) => updateGeneralDraft('expiresAt', date)}
                  placeholderText="만료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">최소사용금액 (원)</span>
                <ModalInput
                  type="number"
                  min={0}
                  value={editTarget.draft.minOrderAmount}
                  onChange={(e) => updateGeneralDraft('minOrderAmount', e.target.value)}
                  aria-label="최소사용금액"
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">결제수단</span>
                <ListSelect
                  ariaLabel="결제수단"
                  className="listselect--modal"
                  value={editTarget.draft.paymentMethod}
                  onChange={(next) => updateGeneralDraft('paymentMethod', next as GeneralCouponDraft['paymentMethod'])}
                  options={PAYMENT_METHOD_OPTIONS.map((option) => ({ value: option, label: option }))}
                />
              </div>
            </div>
          )}

          {editTarget?.tab === 'point' && (
            <div className="admin-modal-field-grid">
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">변환금액 (원)</span>
                <ModalInput
                  type="number"
                  min={0}
                  value={editTarget.draft.conversionAmount}
                  onChange={(e) => updatePointDraft('conversionAmount', e.target.value)}
                  aria-label="변환금액"
                  />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">발행갯수 (개)</span>
                <ModalInput
                  type="number"
                  min={0}
                  value={editTarget.draft.issueCount}
                  onChange={(e) => updatePointDraft('issueCount', e.target.value)}
                  aria-label="발행갯수"
                  />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">쿠폰이름</span>
                <ModalInput
                  type="text"
                  value={editTarget.draft.couponName}
                  onChange={(e) => updatePointDraft('couponName', e.target.value)}
                  aria-label="쿠폰이름"
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">쿠폰사용기간 (까지)</span>
                <ModalDatePicker
                  modalOpen={Boolean(editTarget)}
                  selected={editTarget.draft.expiresAt}
                  onChange={(date) => updatePointDraft('expiresAt', date)}
                  placeholderText="만료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeEditModal}>
            닫기
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={saveEditModal}>
            {editTarget?.id ? '저장' : '발급'}
          </button>
        </Modal.Footer>
      </Modal>

      <Confirm
        open={Boolean(deleteTarget)}
        title="쿠폰 삭제"
        message={deleteTarget ? `${deleteTarget.name} 쿠폰을 삭제하시겠습니까?` : ''}
        confirmText="삭제"
        cancelText="취소"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
