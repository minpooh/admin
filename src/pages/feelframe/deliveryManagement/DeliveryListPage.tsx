import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import type {
  FeelframeDeliveryListRow,
  FeelframeDeliveryShippingStatus,
  FeelframePickupProductionStatus,
} from './mock/deliveryList.mock';
import { MOCK_FEELFRAME_DELIVERY_LIST } from './mock/deliveryList.mock';
import type { FeelframeDeliveryOrderMemoEntry } from './mock/deliveryOrder.mock';
import {
  getVisiblePageNumbers,
  jumpPageBack,
  jumpPageForward,
  PAGINATION_JUMP_PAGES,
} from '../../../utils/pagination';

const DELIVERY_LIST_TABS = [
  { id: 'courier' as const, label: '택배배송' },
  { id: 'pickup' as const, label: '방문수령' },
];

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const COURIER_DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '전화번호', label: '전화번호' },
  { value: '주민번호', label: '주민번호' },
  { value: '결제정보', label: '결제정보' },
] as const;

const PICKUP_DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '전화번호', label: '전화번호' },
  { value: '주민번호', label: '주민번호' },
] as const;

const CARRIER_OPTIONS = ['전체', '우체국', 'CJ'] as const;
const COURIER_PAYMENT_METHOD_OPTIONS = ['전체', '무통장입금', '카드결제', '카카오페이', '실시간계좌이체'] as const;
const PICKUP_PROGRESS_OPTIONS = ['전체', '방문전', '수령완료'] as const;

/** 배송 현황 모달 · 배송사 선택 (필터 전체 제외) */
const MODAL_CARRIER_OPTIONS = ['CJ대한통운', '우체국', '한진택배', '롯데택배', 'CJ', '기타'] as const;

const CURRENT_LOGIN_AUTHOR = '관리자';

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

type CourierDetailType = (typeof COURIER_DETAIL_SEARCH_OPTIONS)[number]['value'];
type PickupDetailType = (typeof PICKUP_DETAIL_SEARCH_OPTIONS)[number]['value'];

type ShippingDraft = {
  carrier: string;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  addressLine: string;
  deliveryMessage: string;
};

const ITEMS_PER_PAGE = 10;

type AppliedCourierSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  detailSearchType: CourierDetailType;
  keyword: string;
  carrier: (typeof CARRIER_OPTIONS)[number];
  paymentMethod: (typeof COURIER_PAYMENT_METHOD_OPTIONS)[number];
};

type AppliedPickupSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  detailSearchType: PickupDetailType;
  keyword: string;
  progress: (typeof PICKUP_PROGRESS_OPTIONS)[number];
};

type CourierChipKey = 'date' | 'keyword' | 'carrier' | 'paymentMethod';
type PickupChipKey = 'date' | 'keyword' | 'progress';

function formatYmd(date: Date | null) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseOrderDateFromOrderNo(orderNo: string): Date | null {
  const part = orderNo.split('-')[0];
  if (!/^\d{8}$/.test(part)) return null;
  const y = Number(part.slice(0, 4));
  const m = Number(part.slice(4, 6)) - 1;
  const d = Number(part.slice(6, 8));
  const dt = new Date(y, m, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isAppliedCourierEmpty(s: AppliedCourierSearch): boolean {
  return (
    !s.dateRange &&
    s.startDate == null &&
    s.endDate == null &&
    !s.keyword.trim() &&
    s.carrier === '전체' &&
    s.paymentMethod === '전체'
  );
}

function isAppliedPickupEmpty(s: AppliedPickupSearch): boolean {
  return (
    !s.dateRange &&
    s.startDate == null &&
    s.endDate == null &&
    !s.keyword.trim() &&
    s.progress === '전체'
  );
}

function applyCourierDeliveryFilters(rows: FeelframeDeliveryListRow[], search: AppliedCourierSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();

  return rows.filter((row) => {
    if (search.startDate || search.endDate) {
      const od = parseOrderDateFromOrderNo(row.orderNo);
      if (!od) return false;
      if (search.startDate) {
        const start = new Date(search.startDate);
        start.setHours(0, 0, 0, 0);
        if (od < start) return false;
      }
      if (search.endDate) {
        const end = new Date(search.endDate);
        end.setHours(23, 59, 59, 999);
        if (od > end) return false;
      }
    }

    if (keyword) {
      const paymentInfo = row.paymentMethod.toLowerCase();
      const fieldMap: Record<CourierDetailType, string> = {
        전체: [
          row.ordererName,
          row.ordererPhone,
          row.orderNo,
          row.unitNo,
          row.productName,
          row.optionLabel,
          row.paymentMethod,
          row.recipientName,
          row.recipientPhone,
          row.addressLine,
          row.carrier,
          row.postalCode,
        ]
          .join(' ')
          .toLowerCase(),
        이름: row.ordererName.toLowerCase(),
        전화번호: row.ordererPhone.toLowerCase(),
        주민번호: '',
        결제정보: paymentInfo,
      };
      if (search.detailSearchType === '주민번호') return false;
      if (!fieldMap[search.detailSearchType].includes(keyword)) return false;
    }

    if (search.carrier !== '전체') {
      const lc = row.carrier.toLowerCase();
      if (search.carrier === 'CJ' && !lc.includes('cj')) return false;
      if (search.carrier === '우체국' && !lc.includes('우체국')) return false;
    }

    if (search.paymentMethod !== '전체' && row.paymentMethod !== search.paymentMethod) return false;

    return true;
  });
}

function applyPickupDeliveryFilters(rows: FeelframeDeliveryListRow[], search: AppliedPickupSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();

  return rows.filter((row) => {
    if (search.startDate || search.endDate) {
      const od = parseOrderDateFromOrderNo(row.orderNo);
      if (!od) return false;
      if (search.startDate) {
        const start = new Date(search.startDate);
        start.setHours(0, 0, 0, 0);
        if (od < start) return false;
      }
      if (search.endDate) {
        const end = new Date(search.endDate);
        end.setHours(23, 59, 59, 999);
        if (od > end) return false;
      }
    }

    if (keyword) {
      const fieldMap: Record<PickupDetailType, string> = {
        전체: [
          row.ordererName,
          row.ordererPhone,
          row.orderNo,
          row.unitNo,
          row.productName,
          row.optionLabel,
          row.visitSchedule ?? '',
          row.recipientName,
          row.recipientPhone,
        ]
          .join(' ')
          .toLowerCase(),
        이름: row.ordererName.toLowerCase(),
        전화번호: row.ordererPhone.toLowerCase(),
        주민번호: '',
      };
      if (search.detailSearchType === '주민번호') return false;
      if (!fieldMap[search.detailSearchType].includes(keyword)) return false;
    }

    if (search.progress === '방문전' && row.visitStatus !== '방문전') return false;
    if (search.progress === '수령완료' && row.visitStatus !== '수령완료') return false;

    return true;
  });
}

function getDateRangeByPreset(preset: string): { start: Date; end: Date } {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);

  switch (preset) {
    case '당일':
      break;
    case '3일':
      start.setDate(start.getDate() - 2);
      break;
    case '1주':
      start.setDate(start.getDate() - 6);
      break;
    case '2주':
      start.setDate(start.getDate() - 13);
      break;
    case '1개월':
      start.setDate(start.getDate() - 29);
      break;
    case '3개월':
      start.setDate(start.getDate() - 89);
      break;
    case '6개월':
      start.setDate(start.getDate() - 179);
      break;
    default:
      break;
  }

  return { start, end };
}

function formatDateTimeNow() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function formatDateYmd() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getNextProductionStatus(current: FeelframePickupProductionStatus): FeelframePickupProductionStatus {
  if (current === '입고전') return '발주완료';
  if (current === '발주완료') return '입고완료';
  return '입고전';
}

function getShippingStatusButtonClassName(status: FeelframeDeliveryShippingStatus) {
  if (status === '배송중') return 'row-btn row-btn--status-secondary';
  return 'row-btn row-btn--status-warning';
}

function getShippingProgressClassName(status: FeelframeDeliveryShippingStatus) {
  if (status === '배송중') return 'progress-status progress-status--secondary';
  return 'progress-status progress-status--warning';
}

function getProductionStatusButtonClassName(status: FeelframePickupProductionStatus) {
  if (status === '입고전') return 'row-btn row-btn--status-warning';
  return 'row-btn row-btn--status-secondary';
}

function getProductionProgressClassName(status: FeelframePickupProductionStatus) {
  if (status === '입고전') return 'progress-status progress-status--warning';
  return 'progress-status progress-status--secondary';
}

/** UploadPhotoPage 진행현황과 동일 계열: 방문전=warning, 수령완료=secondary */
function getVisitStatusProgressClassName(status: '방문전' | '수령완료') {
  if (status === '방문전') return 'progress-status progress-status--warning';
  return 'progress-status progress-status--secondary';
}

/** 연월일시분초 표시; 날짜만 저장된 값은 00:00:00 보정 */
function formatPickupReceivedAtDisplay(value: string | null | undefined): string {
  if (value == null || !String(value).trim()) return '—';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  return s;
}

function displayDeliveryMessage(value: string | null) {
  if (value == null || !String(value).trim()) return '—';
  return value;
}

export default function FeelframeDeliveryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<FeelframeDeliveryListRow[]>(() => [...MOCK_FEELFRAME_DELIVERY_LIST]);

  const [memoModalRowId, setMemoModalRowId] = useState<string | null>(null);
  const [memoInput, setMemoInput] = useState('');
  const [memoTooltipRowId, setMemoTooltipRowId] = useState<string | null>(null);
  const [memoTooltipPosition, setMemoTooltipPosition] = useState<{ top: number; right: number } | null>(null);
  const memoTooltipAnchorRef = useRef<HTMLElement | null>(null);

  const [shippingModalRowId, setShippingModalRowId] = useState<string | null>(null);
  const [shippingDraft, setShippingDraft] = useState<ShippingDraft | null>(null);
  const [productionModalRowId, setProductionModalRowId] = useState<string | null>(null);
  const [deliveryChangeRowId, setDeliveryChangeRowId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [selectedCourierIds, setSelectedCourierIds] = useState<Set<string>>(() => new Set());
  const courierHeaderCheckboxRef = useRef<HTMLInputElement>(null);

  const activeTab = useMemo<(typeof DELIVERY_LIST_TABS)[number]['id']>(() => {
    const t = searchParams.get('tab');
    return t === 'pickup' ? 'pickup' : 'courier';
  }, [searchParams]);

  const setActiveTab = (next: (typeof DELIVERY_LIST_TABS)[number]['id']) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('tab', next === 'pickup' ? 'pickup' : 'courier');
        return p;
      },
      { replace: true }
    );
  };

  const [courierDateRange, setCourierDateRange] = useState('');
  const [courierStartDate, setCourierStartDate] = useState<Date | null>(null);
  const [courierEndDate, setCourierEndDate] = useState<Date | null>(null);
  const [courierDetailType, setCourierDetailType] = useState<CourierDetailType>('전체');
  const [courierKeyword, setCourierKeyword] = useState('');
  const [courierCarrier, setCourierCarrier] = useState<(typeof CARRIER_OPTIONS)[number]>('전체');
  const [courierPaymentMethod, setCourierPaymentMethod] = useState<(typeof COURIER_PAYMENT_METHOD_OPTIONS)[number]>('전체');
  const [courierDetailExpanded, setCourierDetailExpanded] = useState(false);

  const [pickupDateRange, setPickupDateRange] = useState('');
  const [pickupStartDate, setPickupStartDate] = useState<Date | null>(null);
  const [pickupEndDate, setPickupEndDate] = useState<Date | null>(null);
  const [pickupDetailType, setPickupDetailType] = useState<PickupDetailType>('전체');
  const [pickupKeyword, setPickupKeyword] = useState('');
  const [pickupProgress, setPickupProgress] = useState<(typeof PICKUP_PROGRESS_OPTIONS)[number]>('전체');

  const [appliedCourierSearch, setAppliedCourierSearch] = useState<AppliedCourierSearch | null>(null);
  const [appliedPickupSearch, setAppliedPickupSearch] = useState<AppliedPickupSearch | null>(null);
  const [courierCurrentPage, setCourierCurrentPage] = useState(1);
  const [pickupCurrentPage, setPickupCurrentPage] = useState(1);

  const handleCourierSearch = () => {
    const next: AppliedCourierSearch = {
      dateRange: courierDateRange,
      startDate: courierStartDate,
      endDate: courierEndDate,
      detailSearchType: courierDetailType,
      keyword: courierKeyword,
      carrier: courierCarrier,
      paymentMethod: courierPaymentMethod,
    };
    setAppliedCourierSearch(isAppliedCourierEmpty(next) ? null : next);
    setCourierCurrentPage(1);
    setSelectedCourierIds(new Set());
  };

  const handlePickupSearch = () => {
    const next: AppliedPickupSearch = {
      dateRange: pickupDateRange,
      startDate: pickupStartDate,
      endDate: pickupEndDate,
      detailSearchType: pickupDetailType,
      keyword: pickupKeyword,
      progress: pickupProgress,
    };
    setAppliedPickupSearch(isAppliedPickupEmpty(next) ? null : next);
    setPickupCurrentPage(1);
  };

  const courierListRows = useMemo(() => rows.filter((row) => row.channel === 'courier'), [rows]);
  const pickupListRows = useMemo(() => rows.filter((row) => row.channel === 'pickup'), [rows]);

  const filteredCourierRows = useMemo(
    () => applyCourierDeliveryFilters(courierListRows, appliedCourierSearch),
    [courierListRows, appliedCourierSearch]
  );
  const filteredPickupRows = useMemo(
    () => applyPickupDeliveryFilters(pickupListRows, appliedPickupSearch),
    [pickupListRows, appliedPickupSearch]
  );

  const courierTotalPages = Math.max(1, Math.ceil(filteredCourierRows.length / ITEMS_PER_PAGE));
  const pickupTotalPages = Math.max(1, Math.ceil(filteredPickupRows.length / ITEMS_PER_PAGE));

  const paginatedCourierRows = useMemo(() => {
    const start = (courierCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourierRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourierRows, courierCurrentPage]);

  const paginatedPickupRows = useMemo(() => {
    const start = (pickupCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredPickupRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPickupRows, pickupCurrentPage]);

  useEffect(() => {
    if (courierCurrentPage > courierTotalPages) setCourierCurrentPage(courierTotalPages);
  }, [courierCurrentPage, courierTotalPages]);

  useEffect(() => {
    if (pickupCurrentPage > pickupTotalPages) setPickupCurrentPage(pickupTotalPages);
  }, [pickupCurrentPage, pickupTotalPages]);

  const courierPageIds = paginatedCourierRows.map((row) => row.id);
  const allCourierPageSelected =
    courierPageIds.length > 0 && courierPageIds.every((id) => selectedCourierIds.has(id));
  const someCourierPageSelected = courierPageIds.some((id) => selectedCourierIds.has(id));
  const selectedCourierCount = selectedCourierIds.size;

  useEffect(() => {
    const el = courierHeaderCheckboxRef.current;
    if (el) el.indeterminate = someCourierPageSelected && !allCourierPageSelected;
  }, [someCourierPageSelected, allCourierPageSelected, paginatedCourierRows]);

  const toggleCourierRow = (id: string) => {
    setSelectedCourierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCourierPage = () => {
    setSelectedCourierIds((prev) => {
      const next = new Set(prev);
      if (allCourierPageSelected) courierPageIds.forEach((id) => next.delete(id));
      else courierPageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkShippingStandby = () => {
    if (selectedCourierIds.size === 0) return;
    setRows((prev) =>
      prev.map((row) =>
        selectedCourierIds.has(row.id) && row.channel === 'courier' && row.shippingStatus
          ? { ...row, shippingStatus: '배송중' }
          : row
      )
    );
    setSelectedCourierIds(new Set());
  };

  const courierAppliedChips = useMemo(() => {
    if (!appliedCourierSearch) return [] as Array<{ key: CourierChipKey; label: string }>;
    const s = appliedCourierSearch;
    const chips: Array<{ key: CourierChipKey; label: string }> = [];
    if (s.startDate || s.endDate) {
      const start = formatYmd(s.startDate);
      const end = formatYmd(s.endDate);
      chips.push({ key: 'date', label: `기간: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (s.dateRange) {
      chips.push({ key: 'date', label: `기간: ${s.dateRange}` });
    }
    if (s.keyword.trim()) {
      chips.push({ key: 'keyword', label: `검색: ${s.detailSearchType} ${s.keyword}` });
    }
    if (s.carrier !== '전체') chips.push({ key: 'carrier', label: `배송사: ${s.carrier}` });
    if (s.paymentMethod !== '전체') chips.push({ key: 'paymentMethod', label: `결제수단: ${s.paymentMethod}` });
    return chips;
  }, [appliedCourierSearch]);

  const pickupAppliedChips = useMemo(() => {
    if (!appliedPickupSearch) return [] as Array<{ key: PickupChipKey; label: string }>;
    const s = appliedPickupSearch;
    const chips: Array<{ key: PickupChipKey; label: string }> = [];
    if (s.startDate || s.endDate) {
      const start = formatYmd(s.startDate);
      const end = formatYmd(s.endDate);
      chips.push({ key: 'date', label: `기간: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (s.dateRange) {
      chips.push({ key: 'date', label: `기간: ${s.dateRange}` });
    }
    if (s.keyword.trim()) {
      chips.push({ key: 'keyword', label: `검색: ${s.detailSearchType} ${s.keyword}` });
    }
    if (s.progress !== '전체') chips.push({ key: 'progress', label: `진행현황: ${s.progress}` });
    return chips;
  }, [appliedPickupSearch]);

  const clearCourierAppliedFilter = (key: CourierChipKey) => {
    if (!appliedCourierSearch) return;
    const next = { ...appliedCourierSearch };
    switch (key) {
      case 'date':
        setCourierDateRange('');
        setCourierStartDate(null);
        setCourierEndDate(null);
        next.dateRange = '';
        next.startDate = null;
        next.endDate = null;
        break;
      case 'keyword':
        setCourierDetailType('전체');
        setCourierKeyword('');
        next.detailSearchType = '전체';
        next.keyword = '';
        break;
      case 'carrier':
        setCourierCarrier('전체');
        next.carrier = '전체';
        break;
      case 'paymentMethod':
        setCourierPaymentMethod('전체');
        next.paymentMethod = '전체';
        break;
      default:
        break;
    }
    setAppliedCourierSearch(isAppliedCourierEmpty(next) ? null : next);
    setCourierCurrentPage(1);
    setSelectedCourierIds(new Set());
  };

  const clearPickupAppliedFilter = (key: PickupChipKey) => {
    if (!appliedPickupSearch) return;
    const next = { ...appliedPickupSearch };
    switch (key) {
      case 'date':
        setPickupDateRange('');
        setPickupStartDate(null);
        setPickupEndDate(null);
        next.dateRange = '';
        next.startDate = null;
        next.endDate = null;
        break;
      case 'keyword':
        setPickupDetailType('전체');
        setPickupKeyword('');
        next.detailSearchType = '전체';
        next.keyword = '';
        break;
      case 'progress':
        setPickupProgress('전체');
        next.progress = '전체';
        break;
      default:
        break;
    }
    setAppliedPickupSearch(isAppliedPickupEmpty(next) ? null : next);
    setPickupCurrentPage(1);
  };

  const updateMemoTooltipPosition = () => {
    const anchorElement = memoTooltipAnchorRef.current;
    if (!anchorElement) return;
    const rect = anchorElement.getBoundingClientRect();
    const viewportMargin = 12;
    setMemoTooltipPosition({
      top: rect.bottom + 8,
      right: Math.max(viewportMargin, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!memoTooltipRowId) return;
    updateMemoTooltipPosition();
    window.addEventListener('scroll', updateMemoTooltipPosition, true);
    window.addEventListener('resize', updateMemoTooltipPosition);
    return () => {
      window.removeEventListener('scroll', updateMemoTooltipPosition, true);
      window.removeEventListener('resize', updateMemoTooltipPosition);
    };
  }, [memoTooltipRowId]);

  const showMemoTooltip = (rowId: string, triggerElement: HTMLElement) => {
    memoTooltipAnchorRef.current = triggerElement;
    setMemoTooltipRowId(rowId);
  };

  const hideMemoTooltip = () => {
    setMemoTooltipRowId(null);
    setMemoTooltipPosition(null);
    memoTooltipAnchorRef.current = null;
  };

  const closeMemoModal = () => {
    setMemoModalRowId(null);
    setMemoInput('');
  };

  const openMemoModal = (rowId: string) => {
    setMemoModalRowId(rowId);
    setMemoInput('');
  };

  const addMemo = (rowId: string) => {
    const content = memoInput.trim();
    if (!content) return;

    const nextMemo: FeelframeDeliveryOrderMemoEntry = {
      id: `memo-${Date.now()}`,
      author: CURRENT_LOGIN_AUTHOR,
      content,
      createdAt: formatDateTimeNow(),
    };

    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, memo: [...row.memo, nextMemo] } : row))
    );
    setMemoInput('');
  };

  const deleteMemo = (rowId: string, memoId: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, memo: row.memo.filter((memo) => memo.id !== memoId) } : row
      )
    );
  };

  const closeShippingModal = () => {
    setShippingModalRowId(null);
    setShippingDraft(null);
  };

  const openShippingModal = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row || row.channel !== 'courier' || !row.shippingStatus) return;
    setShippingModalRowId(rowId);
    setShippingDraft({
      carrier: row.carrier,
      recipientName: row.recipientName,
      recipientPhone: row.recipientPhone,
      postalCode: row.postalCode,
      addressLine: row.addressLine,
      deliveryMessage: row.deliveryMessage ?? '',
    });
  };

  const applyShippingDraftToRow = (rowId: string, draft: ShippingDraft) => {
    const msg = draft.deliveryMessage.trim();
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          carrier: draft.carrier,
          recipientName: draft.recipientName,
          recipientPhone: draft.recipientPhone,
          postalCode: draft.postalCode,
          addressLine: draft.addressLine,
          deliveryMessage: msg ? msg : null,
        };
      })
    );
  };

  const handleShippingChange = () => {
    if (!shippingModalRowId || !shippingDraft) return;
    applyShippingDraftToRow(shippingModalRowId, shippingDraft);
    closeShippingModal();
  };

  const handleShippingStandby = () => {
    if (!shippingModalRowId || !shippingDraft) return;
    const rowId = shippingModalRowId;
    const draft = shippingDraft;
    const msg = draft.deliveryMessage.trim();
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId || r.channel !== 'courier' || !r.shippingStatus) return r;
        const withFields = {
          ...r,
          carrier: draft.carrier,
          recipientName: draft.recipientName,
          recipientPhone: draft.recipientPhone,
          postalCode: draft.postalCode,
          addressLine: draft.addressLine,
          deliveryMessage: msg ? msg : null,
        };
        const nextStatus: FeelframeDeliveryShippingStatus =
          withFields.shippingStatus === '배송전' ? '배송중' : '배송전';
        return { ...withFields, shippingStatus: nextStatus };
      })
    );
    closeShippingModal();
  };

  const closeConfirmDialog = () => setConfirmDialog(null);

  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const closeProductionModal = () => setProductionModalRowId(null);

  const openProductionModal = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row || row.channel !== 'pickup' || !row.productionStatus) return;
    setProductionModalRowId(rowId);
  };

  const openProductionStatusChangeConfirm = (rowId: string) => {
    setConfirmDialog({
      message: '상태를 변경하시겠습니까?',
      onConfirm: () => {
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== rowId || r.channel !== 'pickup' || !r.productionStatus) return r;
            const next = getNextProductionStatus(r.productionStatus);
            const ymd = formatDateYmd();
            let orderPlacedAt = r.orderPlacedAt;
            let stockInAt = r.stockInAt;
            if (next === '발주완료' && r.productionStatus === '입고전' && !orderPlacedAt) orderPlacedAt = ymd;
            if (next === '입고완료' && !stockInAt) stockInAt = ymd;
            if (next === '입고전') {
              orderPlacedAt = null;
              stockInAt = null;
            }
            return { ...r, productionStatus: next, orderPlacedAt, stockInAt };
          })
        );
        closeProductionModal();
      },
    });
  };

  const handleFrameStockIn = (rowId: string) => {
    const ymd = formatDateYmd();
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId || r.channel !== 'pickup') return r;
        return {
          ...r,
          productionStatus: '입고완료',
          stockInAt: ymd,
          orderPlacedAt: r.orderPlacedAt ?? ymd,
        };
      })
    );
    closeProductionModal();
  };

  const completePickupVisit = (rowId: string) => {
    if (!window.confirm('방문수령 완료 처리하시겠습니까?')) return;
    const receivedAt = formatDateTimeNow();
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId || r.channel !== 'pickup') return r;
        return { ...r, visitStatus: '수령완료', pickupReceivedAt: receivedAt };
      })
    );
  };

  const openVisitStatusChangeConfirm = (rowId: string) => {
    setConfirmDialog({
      message: '상태를 변경하시겠습니까?',
      onConfirm: () => {
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== rowId || r.channel !== 'pickup') return r;
            return { ...r, visitStatus: '방문전', pickupReceivedAt: null };
          })
        );
      },
    });
  };

  const closeDeliveryChangeModal = () => setDeliveryChangeRowId(null);

  const applyPickupToCourierDelivery = (rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId || r.channel !== 'pickup') return r;
        return {
          ...r,
          channel: 'courier',
          carrier: 'CJ대한통운',
          shippingStatus: '배송전' as FeelframeDeliveryShippingStatus,
          postalCode: r.postalCode?.trim() ? r.postalCode : '00000',
          addressLine: r.addressLine?.trim() ? r.addressLine : '주소 미입력',
          recipientName: r.recipientName || r.ordererName,
          recipientPhone: r.recipientPhone || r.ordererPhone,
          productionStatus: null,
          orderPlacedAt: null,
          stockInAt: null,
          visitStatus: null,
          visitSchedule: undefined,
          pickupReceivedAt: null,
        };
      })
    );
    closeDeliveryChangeModal();
  };

  const shippingModalRow = shippingModalRowId ? rows.find((r) => r.id === shippingModalRowId) : undefined;
  const isShippingReadOnly =
    shippingModalRow &&
    shippingModalRow.channel === 'courier' &&
    shippingModalRow.shippingStatus === '배송중';

  return (
    <div className="admin-list-page">
      <h1 className="page-title">배송관리</h1>

      <nav className="admin-tabs" aria-label="배송 구분">
        <div className="admin-tabs__list" role="tablist">
          {DELIVERY_LIST_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`feelframe-delivery-list-tab-${tab.id}`}
                className={`admin-tabs__tab${isActive ? ' admin-tabs__tab--active' : ''}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === 'courier' ? (
        <>
          <section className="admin-list-box" aria-label="택배배송 검색 필터">
            <div className="filter-top-row">
              <div className="filter-section">
                <span className="filter-label">기간</span>
                <div className="date-range-wrap">
                  <ListSelect
                    ariaLabel="기간 프리셋"
                    className="listselect--date-range"
                    value={courierDateRange}
                    onChange={(next) => {
                      if (!next) {
                        setCourierDateRange('');
                        setCourierStartDate(null);
                        setCourierEndDate(null);
                        return;
                      }
                      setCourierDateRange(next);
                      const { start, end } = getDateRangeByPreset(next);
                      setCourierStartDate(start);
                      setCourierEndDate(end);
                    }}
                    options={[{ value: '', label: '미선택' }, ...DATE_RANGES.map((range) => ({ value: range, label: range }))]}
                  />
                  <div className="date-range-pickers">
                    <DatePicker
                      selected={courierStartDate}
                      onChange={(date: Date | null) => {
                        setCourierStartDate(date);
                        setCourierDateRange('');
                      }}
                      selectsStart
                      startDate={courierStartDate}
                      endDate={courierEndDate}
                      placeholderText="시작일"
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      className="date-picker-input"
                      isClearable={!!courierStartDate}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="scroll"
                    />
                    <span className="date-sep">~</span>
                    <DatePicker
                      selected={courierEndDate}
                      onChange={(date: Date | null) => {
                        setCourierEndDate(date);
                        setCourierDateRange('');
                      }}
                      selectsEnd
                      startDate={courierStartDate}
                      endDate={courierEndDate}
                      minDate={courierStartDate ?? undefined}
                      placeholderText="종료일"
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      className="date-picker-input"
                      isClearable={!!courierEndDate}
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
                    value={courierDetailType}
                    onChange={(next) => setCourierDetailType(next as CourierDetailType)}
                    options={[...COURIER_DETAIL_SEARCH_OPTIONS]}
                  />
                  <input
                    type="text"
                    placeholder="검색어 입력"
                    value={courierKeyword}
                    onChange={(e) => setCourierKeyword(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-top-actions">
                <button type="button" className="filter-btn filter-btn--primary" onClick={handleCourierSearch}>
                  검색
                </button>
                <button
                  type="button"
                  className={`detail-search-toggle ${courierDetailExpanded ? 'is-open' : ''}`}
                  onClick={() => setCourierDetailExpanded((prev) => !prev)}
                >
                  <span className="detail-search-toggle__text">상세검색</span>
                  <svg
                    className="detail-search-toggle__icon"
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="none"
                  >
                    <path
                      d="M4.5 6.75L8 10.25L11.5 6.75"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className={`filter-detail ${courierDetailExpanded ? 'filter-detail--expanded' : ''}`}>
              <div className="filter-section">
                <span className="filter-label">배송사</span>
                <ListSelect
                  ariaLabel="배송사"
                  value={courierCarrier}
                  onChange={(next) => setCourierCarrier(next as (typeof CARRIER_OPTIONS)[number])}
                  options={CARRIER_OPTIONS.map((option) => ({ value: option, label: option }))}
                />
              </div>

              <div className="filter-section">
                <span className="filter-label">결제수단</span>
                <ListSelect
                  ariaLabel="결제수단"
                  value={courierPaymentMethod}
                  onChange={(next) => setCourierPaymentMethod(next as (typeof COURIER_PAYMENT_METHOD_OPTIONS)[number])}
                  options={COURIER_PAYMENT_METHOD_OPTIONS.map((option) => ({ value: option, label: option }))}
                />
              </div>
            </div>
          </section>

          <section className="admin-list-box admin-list-box--table" aria-label="택배배송 목록">
            {courierAppliedChips.length > 0 && (
              <section className="admin-applied-filters" aria-label="적용된 검색 조건">
                <div className="admin-applied-filters__left">
                  <div className="admin-applied-filters__list">
                    {courierAppliedChips.map((chip) => (
                      <div key={chip.key} className="admin-filter-chip">
                        <span className="admin-filter-chip__text">{chip.label}</span>
                        <button
                          type="button"
                          className="admin-filter-chip__x"
                          aria-label={`${chip.label} 해제`}
                          onClick={() => clearCourierAppliedFilter(chip.key)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {selectedCourierCount > 0 && (
              <div className="admin-settlement-bulk" aria-live="polite">
                <div className="admin-settlement-bulk__bar">
                  <p className="admin-settlement-bulk__summary">
                    선택 <strong>{selectedCourierCount}</strong>건
                  </p>
                  <button type="button" className="filter-btn filter-btn--primary" onClick={handleBulkShippingStandby}>
                    배송대기처리
                  </button>
                </div>
              </div>
            )}
            <div className="admin-table-wrap">
              <table className="admin-table admin-table--min-w-800 admin-table--feelframe-delivery-list-courier">
                <thead>
                  <tr>
                    <th scope="col" className="admin-table-col-checkbox">
                      <label className="admin-table-checkbox-label">
                        <input
                          ref={courierHeaderCheckboxRef}
                          type="checkbox"
                          className="admin-checkbox"
                          checked={allCourierPageSelected}
                          onChange={toggleCourierPage}
                          aria-label="현재 페이지 전체 선택"
                        />
                      </label>
                    </th>
                    <th scope="col" className="col-center">
                      메모
                    </th>
                    <th scope="col">주문정보</th>
                    <th scope="col">고객정보</th>
                    <th scope="col">상품명/옵션</th>
                    <th scope="col">배송현황</th>
                    <th scope="col">배송정보</th>
                    <th scope="col">수령자정보</th>
                    <th scope="col">배송메세지</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCourierRows.map((row) => (
                    <tr key={row.id}>
                      <td className="admin-table-col-checkbox">
                        <label className="admin-table-checkbox-label">
                          <input
                            type="checkbox"
                            className="admin-checkbox"
                            checked={selectedCourierIds.has(row.id)}
                            onChange={() => toggleCourierRow(row.id)}
                            aria-label={`행 선택 ${row.orderNo}`}
                          />
                        </label>
                      </td>
                      <td className="col-center">
                        <div
                          className="admin-memo-trigger"
                          onMouseEnter={(e) => {
                            if (row.memo.length === 0) return;
                            showMemoTooltip(row.id, e.currentTarget);
                          }}
                          onMouseLeave={hideMemoTooltip}
                          onFocus={(e) => {
                            if (row.memo.length === 0) return;
                            showMemoTooltip(row.id, e.currentTarget);
                          }}
                          onBlur={hideMemoTooltip}
                        >
                          <button
                            type="button"
                            className={`row-btn ${row.memo.length > 0 ? 'row-btn--blue' : 'row-btn--default'}`}
                            onClick={() => openMemoModal(row.id)}
                          >
                            {row.memo.length > 0 ? '메모 확인' : '메모 작성'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.paymentMethod}</span>
                          <span className="cell-line">{row.orderNo}</span>
                          <span className="cell-line">{row.unitNo}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.ordererName}</span>
                          <span className="cell-line">{row.ordererPhone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.productName}</span>
                          <span className="cell-line admin-list-muted">{row.optionLabel}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.carrier}</span>
                          {row.shippingStatus ? (
                            <div className="cell-block">
                              <button
                                type="button"
                                className={getShippingStatusButtonClassName(row.shippingStatus)}
                                onClick={() => openShippingModal(row.id)}
                              >
                                <span className={getShippingProgressClassName(row.shippingStatus)}>
                                  <span className="progress-status__dot" aria-hidden="true" />
                                  <span className="progress-status__text">{row.shippingStatus}</span>
                                </span>
                              </button>
                            </div>
                          ) : (
                            <span className="cell-line">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.postalCode}</span>
                          <span className="cell-line">{row.addressLine}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.recipientName}</span>
                          <span className="cell-line">{row.recipientPhone}</span>
                        </div>
                      </td>
                      <td>{displayDeliveryMessage(row.deliveryMessage)}</td>
                    </tr>
                  ))}
                  {paginatedCourierRows.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-list-table-footer">
              <div className="admin-table-pagination">
                <div className="pagination-inner">
                  <button
                    type="button"
                    onClick={() => setCourierCurrentPage((p) => jumpPageBack(p))}
                    disabled={courierCurrentPage <= 1}
                    aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
                  >
                    &laquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourierCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={courierCurrentPage <= 1}
                    aria-label="이전 페이지"
                  >
                    &lsaquo;
                  </button>
                  {getVisiblePageNumbers(courierTotalPages, courierCurrentPage).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={courierCurrentPage === page ? 'active' : ''}
                      onClick={() => setCourierCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCourierCurrentPage((p) => Math.min(courierTotalPages, p + 1))}
                    disabled={courierCurrentPage >= courierTotalPages}
                    aria-label="다음 페이지"
                  >
                    &rsaquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourierCurrentPage((p) => jumpPageForward(p, courierTotalPages))}
                    disabled={courierCurrentPage >= courierTotalPages}
                    aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="admin-list-box" aria-label="방문수령 검색 필터">
            <div className="filter-top-row admin-filter-row--equal-4">
              <div className="filter-section">
                <span className="filter-label">기간</span>
                <div className="date-range-wrap">
                  <ListSelect
                    ariaLabel="기간 프리셋"
                    className="listselect--date-range"
                    value={pickupDateRange}
                    onChange={(next) => {
                      if (!next) {
                        setPickupDateRange('');
                        setPickupStartDate(null);
                        setPickupEndDate(null);
                        return;
                      }
                      setPickupDateRange(next);
                      const { start, end } = getDateRangeByPreset(next);
                      setPickupStartDate(start);
                      setPickupEndDate(end);
                    }}
                    options={[{ value: '', label: '미선택' }, ...DATE_RANGES.map((range) => ({ value: range, label: range }))]}
                  />
                  <div className="date-range-pickers">
                    <DatePicker
                      selected={pickupStartDate}
                      onChange={(date: Date | null) => {
                        setPickupStartDate(date);
                        setPickupDateRange('');
                      }}
                      selectsStart
                      startDate={pickupStartDate}
                      endDate={pickupEndDate}
                      placeholderText="시작일"
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      className="date-picker-input"
                      isClearable={!!pickupStartDate}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="scroll"
                    />
                    <span className="date-sep">~</span>
                    <DatePicker
                      selected={pickupEndDate}
                      onChange={(date: Date | null) => {
                        setPickupEndDate(date);
                        setPickupDateRange('');
                      }}
                      selectsEnd
                      startDate={pickupStartDate}
                      endDate={pickupEndDate}
                      minDate={pickupStartDate ?? undefined}
                      placeholderText="종료일"
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      className="date-picker-input"
                      isClearable={!!pickupEndDate}
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
                    value={pickupDetailType}
                    onChange={(next) => setPickupDetailType(next as PickupDetailType)}
                    options={[...PICKUP_DETAIL_SEARCH_OPTIONS]}
                  />
                  <input
                    type="text"
                    placeholder="검색어 입력"
                    value={pickupKeyword}
                    onChange={(e) => setPickupKeyword(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-section">
                <span className="filter-label">진행현황</span>
                <ListSelect
                  ariaLabel="진행현황"
                  value={pickupProgress}
                  onChange={(next) => setPickupProgress(next as (typeof PICKUP_PROGRESS_OPTIONS)[number])}
                  options={PICKUP_PROGRESS_OPTIONS.map((option) => ({ value: option, label: option }))}
                />
              </div>

              <div className="filter-section filter-section--search-btn">
                <button type="button" className="filter-btn filter-btn--primary" onClick={handlePickupSearch}>
                  검색
                </button>
              </div>
            </div>
          </section>

          <section className="admin-list-box admin-list-box--table" aria-label="방문수령 목록">
            {pickupAppliedChips.length > 0 && (
              <section className="admin-applied-filters" aria-label="적용된 검색 조건">
                <div className="admin-applied-filters__left">
                  <div className="admin-applied-filters__list">
                    {pickupAppliedChips.map((chip) => (
                      <div key={chip.key} className="admin-filter-chip">
                        <span className="admin-filter-chip__text">{chip.label}</span>
                        <button
                          type="button"
                          className="admin-filter-chip__x"
                          aria-label={`${chip.label} 해제`}
                          onClick={() => clearPickupAppliedFilter(chip.key)}
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
              <table className="admin-table admin-table--min-w-1024 admin-table--feelframe-delivery-list-pickup">
                <thead>
                  <tr>
                    <th className="col-center">
                      메모
                    </th>
                    <th>주문정보</th>
                    <th>고객정보</th>
                    <th>상품명/옵션</th>
                    <th className="col-center">제작현황</th>
                    <th className="col-center">방문현황</th>
                    <th>방문일정</th>
                    <th className="col-center">
                      배송변경
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPickupRows.map((row) => (
                    <tr key={row.id}>
                      <td className="col-center">
                        <div
                          className="admin-memo-trigger"
                          onMouseEnter={(e) => {
                            if (row.memo.length === 0) return;
                            showMemoTooltip(row.id, e.currentTarget);
                          }}
                          onMouseLeave={hideMemoTooltip}
                          onFocus={(e) => {
                            if (row.memo.length === 0) return;
                            showMemoTooltip(row.id, e.currentTarget);
                          }}
                          onBlur={hideMemoTooltip}
                        >
                          <button
                            type="button"
                            className={`row-btn ${row.memo.length > 0 ? 'row-btn--blue' : 'row-btn--default'}`}
                            onClick={() => openMemoModal(row.id)}
                          >
                            {row.memo.length > 0 ? '메모 확인' : '메모 작성'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.paymentMethod}</span>
                          <span className="cell-line">{row.orderNo}</span>
                          <span className="cell-line">{row.unitNo}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.ordererName}</span>
                          <span className="cell-line">{row.ordererPhone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.productName}</span>
                          <span className="cell-line">{row.optionLabel}</span>
                        </div>
                      </td>
                      <td className="col-center">
                        <div className="cell-block">
                          {row.productionStatus ? (
                            <>
                              <button
                                type="button"
                                className={getProductionStatusButtonClassName(row.productionStatus)}
                                onClick={() => openProductionModal(row.id)}
                              >
                                <span className={getProductionProgressClassName(row.productionStatus)}>
                                  <span className="progress-status__dot" aria-hidden="true" />
                                  <span className="progress-status__text">{row.productionStatus}</span>
                                </span>
                              </button>
                              {row.productionStatus === '발주완료' && (
                                <span className="cell-line">{row.orderPlacedAt ?? '—'}</span>
                              )}
                              {row.productionStatus === '입고완료' && (
                                <span className="cell-line">{row.stockInAt ?? '—'}</span>
                              )}
                            </>
                          ) : (
                            <span className="cell-line">—</span>
                          )}
                        </div>
                      </td>
                      <td className="col-center">
                        <div className="cell-block">
                          {row.visitStatus === '방문전' && (
                            <>
                              <span className={getVisitStatusProgressClassName('방문전')}>
                                <span className="progress-status__dot" aria-hidden="true" />
                                <span className="progress-status__text">방문전</span>
                              </span>
                              <button type="button" className="row-btn row-btn--status-secondary" onClick={() => completePickupVisit(row.id)}>
                                방문수령완료
                              </button>
                            </>
                          )}
                          {row.visitStatus === '수령완료' && (
                            <>
                              <span className={getVisitStatusProgressClassName('수령완료')}>
                                <span className="progress-status__dot" aria-hidden="true" />
                                <span className="progress-status__text">수령완료</span>
                              </span>
                              <div>{formatPickupReceivedAtDisplay(row.pickupReceivedAt)}</div>
                              <button
                                type="button"
                                className="row-btn row-btn--default"
                                onClick={() => openVisitStatusChangeConfirm(row.id)}
                              >
                                상태변경
                              </button>
                            </>
                          )}
                          {row.visitStatus == null && <span className="cell-line">—</span>}
                        </div>
                      </td>
                      <td>
                        <span className="cell-line">{row.visitSchedule ?? '—'}</span>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--default" onClick={() => setDeliveryChangeRowId(row.id)}>
                          배송변경
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedPickupRows.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-list-table-footer">
              <div className="admin-table-pagination">
                <div className="pagination-inner">
                  <button
                    type="button"
                    onClick={() => setPickupCurrentPage((p) => jumpPageBack(p))}
                    disabled={pickupCurrentPage <= 1}
                    aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
                  >
                    &laquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pickupCurrentPage <= 1}
                    aria-label="이전 페이지"
                  >
                    &lsaquo;
                  </button>
                  {getVisiblePageNumbers(pickupTotalPages, pickupCurrentPage).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={pickupCurrentPage === page ? 'active' : ''}
                      onClick={() => setPickupCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPickupCurrentPage((p) => Math.min(pickupTotalPages, p + 1))}
                    disabled={pickupCurrentPage >= pickupTotalPages}
                    aria-label="다음 페이지"
                  >
                    &rsaquo;
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupCurrentPage((p) => jumpPageForward(p, pickupTotalPages))}
                    disabled={pickupCurrentPage >= pickupTotalPages}
                    aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {memoModalRowId &&
        (() => {
          const row = rows.find((item) => item.id === memoModalRowId);
          if (!row) return null;

          return (
            <Modal open onClose={closeMemoModal} ariaLabel="메모 관리" variant="option">
              <Modal.Header>
                <Modal.Title>메모 관리</Modal.Title>
                <Modal.Close />
              </Modal.Header>
              <Modal.Body>
                <div className="admin-modal-field-grid">
                  <div className="admin-modal-field-row admin-memo-modal__field-row">
                    <span className="admin-modal-field-label">메모내용</span>
                    <textarea
                      className="admin-modal-field-control admin-memo-modal__textarea"
                      value={memoInput}
                      onChange={(e) => setMemoInput(e.target.value)}
                      placeholder="메모를 입력해주세요."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="admin-memo-history">
                  <p className="admin-memo-history__title">지난 메모</p>
                  {row.memo.length === 0 ? (
                    <p className="admin-memo-history__empty">등록된 메모가 없습니다.</p>
                  ) : (
                    <ul className="admin-memo-history__list">
                      {[...row.memo].reverse().map((memo) => (
                        <li key={memo.id} className="admin-memo-history__item">
                          <div className="admin-memo-history__meta">
                            <span>{memo.author}</span>
                            <span>{memo.createdAt}</span>
                          </div>
                          <p className="admin-memo-history__content">{memo.content}</p>
                          <div className="admin-memo-history__actions">
                            <button
                              type="button"
                              className="row-btn row-btn--red"
                              onClick={() => deleteMemo(row.id, memo.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeMemoModal}>
                  닫기
                </button>
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--primary"
                  onClick={() => addMemo(row.id)}
                >
                  메모 저장
                </button>
              </Modal.Footer>
            </Modal>
          );
        })()}

      {shippingModalRowId && shippingDraft && shippingModalRow && shippingModalRow.shippingStatus && (
        <Modal open onClose={closeShippingModal} ariaLabel="배송 현황" variant="option">
          <Modal.Header>
            <Modal.Title>배송 현황</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="admin-modal-field-grid">
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">배송사</span>
                {isShippingReadOnly ? (
                  <span className="admin-modal-field-value">{shippingDraft.carrier}</span>
                ) : (
                  <ListSelect
                    ariaLabel="배송사"
                    className="listselect--modal"
                    value={shippingDraft.carrier}
                    onChange={(next) => setShippingDraft((d) => (d ? { ...d, carrier: next } : d))}
                    options={MODAL_CARRIER_OPTIONS.map((o) => ({ value: o, label: o }))}
                  />
                )}
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">수령인</span>
                <input
                  type="text"
                  className="admin-modal-field-control"
                  value={shippingDraft.recipientName}
                  onChange={(e) => setShippingDraft((d) => (d ? { ...d, recipientName: e.target.value } : d))}
                  readOnly={Boolean(isShippingReadOnly)}
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">연락처</span>
                <input
                  type="text"
                  className="admin-modal-field-control"
                  value={shippingDraft.recipientPhone}
                  onChange={(e) => setShippingDraft((d) => (d ? { ...d, recipientPhone: e.target.value } : d))}
                  readOnly={Boolean(isShippingReadOnly)}
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">우편번호</span>
                <input
                  type="text"
                  className="admin-modal-field-control"
                  value={shippingDraft.postalCode}
                  onChange={(e) => setShippingDraft((d) => (d ? { ...d, postalCode: e.target.value } : d))}
                  readOnly={Boolean(isShippingReadOnly)}
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">주소</span>
                <input
                  type="text"
                  className="admin-modal-field-control"
                  value={shippingDraft.addressLine}
                  onChange={(e) => setShippingDraft((d) => (d ? { ...d, addressLine: e.target.value } : d))}
                  readOnly={Boolean(isShippingReadOnly)}
                />
              </div>
              <div className="admin-modal-field-row admin-memo-modal__field-row">
                <span className="admin-modal-field-label">배송메세지</span>
                <textarea
                  className="admin-modal-field-control admin-memo-modal__textarea"
                  value={shippingDraft.deliveryMessage}
                  onChange={(e) => setShippingDraft((d) => (d ? { ...d, deliveryMessage: e.target.value } : d))}
                  placeholder="배송 요청사항"
                  rows={2}
                  readOnly={Boolean(isShippingReadOnly)}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeShippingModal}>
              닫기
            </button>
            {!isShippingReadOnly && (
              <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={handleShippingChange}>
                배송변경
              </button>
            )}
            <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={handleShippingStandby}>
              배송대기처리
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {productionModalRowId &&
        (() => {
          const row = rows.find((r) => r.id === productionModalRowId);
          if (!row || row.channel !== 'pickup' || !row.productionStatus) return null;
          const ps = row.productionStatus;
          return (
            <Modal open onClose={closeProductionModal} ariaLabel="제작현황" variant="option">
              <Modal.Header>
                <Modal.Title>제작현황</Modal.Title>
                <Modal.Close />
              </Modal.Header>
              <Modal.Body>
                <div className="admin-modal-field-grid">
                  <div className="admin-modal-field-row">
                    <span className="admin-modal-field-label">주문번호</span>
                    <span className="admin-modal-field-value">{row.orderNo}</span>
                  </div>
                  <div className="admin-modal-field-row">
                    <span className="admin-modal-field-label">제작상태</span>
                    <span className="admin-modal-field-value">{ps}</span>
                  </div>
                  {ps === '발주완료' && (
                    <div className="admin-modal-field-row">
                      <span className="admin-modal-field-label">발주일자</span>
                      <span className="admin-modal-field-value">{row.orderPlacedAt ?? '—'}</span>
                    </div>
                  )}
                  {ps === '입고완료' && (
                    <div className="admin-modal-field-row">
                      <span className="admin-modal-field-label">입고일자</span>
                      <span className="admin-modal-field-value">{row.stockInAt ?? '—'}</span>
                    </div>
                  )}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeProductionModal}>
                  닫기
                </button>
                {ps === '발주완료' ? (
                  <>
                    <button
                      type="button"
                      className="option-modal__btn option-modal__btn--ghost"
                      onClick={() => openProductionStatusChangeConfirm(row.id)}
                    >
                      상태변경
                    </button>
                    <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => handleFrameStockIn(row.id)}>
                      액자입고
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="option-modal__btn option-modal__btn--primary"
                    onClick={() => openProductionStatusChangeConfirm(row.id)}
                  >
                    상태변경
                  </button>
                )}
              </Modal.Footer>
            </Modal>
          );
        })()}

      {deliveryChangeRowId &&
        (() => {
          const row = rows.find((r) => r.id === deliveryChangeRowId);
          if (!row) return null;
          return (
            <Modal open onClose={closeDeliveryChangeModal} ariaLabel="배송변경" variant="option">
              <Modal.Header>
                <Modal.Title>배송변경</Modal.Title>
                <Modal.Close />
              </Modal.Header>
              <Modal.Body>
                <p className="admin-modal-field-value">
                  해당 주문을 택배 배송으로 변경합니다. 변경 후 택배배송 탭에서 배송 정보를 입력할 수 있습니다.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeDeliveryChangeModal}>
                  닫기
                </button>
                <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => applyPickupToCourierDelivery(row.id)}>
                  배송변경
                </button>
              </Modal.Footer>
            </Modal>
          );
        })()}

      <Confirm
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message ?? ''}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        danger={confirmDialog?.danger}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
      />

      {memoTooltipRowId && memoTooltipPosition &&
        (() => {
          const row = rows.find((item) => item.id === memoTooltipRowId);
          if (!row || row.memo.length === 0) return null;

          return createPortal(
            <div
              className="admin-memo-floating-tooltip"
              role="tooltip"
              style={{ top: memoTooltipPosition.top, right: memoTooltipPosition.right }}
            >
              <ul className="admin-memo-history__list">
                {[...row.memo].reverse().map((memo) => (
                  <li key={memo.id} className="admin-memo-history__item">
                    <div className="admin-memo-history__meta">
                      <span>{memo.author}</span>
                      <span>{memo.createdAt}</span>
                    </div>
                    <p className="admin-memo-history__content">{memo.content}</p>
                  </li>
                ))}
              </ul>
            </div>,
            document.body
          );
        })()}
    </div>
  );
}
