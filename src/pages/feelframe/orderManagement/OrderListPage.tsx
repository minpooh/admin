import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import ListRowCopyButton from '../../../components/ListRowCopyButton';
import Modal from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import {
  MOCK_FEELFRAME_ORDER_LIST,
  getFeelframeOrderProgressCellDisplay,
  type FeelframeOrderListItem,
  type FeelframeOrderMemoEntry,
} from './mock/orderList.mock';

const DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '아이디', label: '아이디' },
  { value: '이메일', label: '이메일' },
  { value: '전화번호', label: '전화번호' },
  { value: '주문번호', label: '주문번호' },
  { value: '상품명', label: '상품명' },
  { value: '결제정보', label: '결제정보' },
] as const;

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;
const PRODUCT_OPTIONS = ['전체', '액자', '보정', '기타'] as const;
const PAYMENT_STATUS_OPTIONS = ['전체', '결제전', '결제완료', '결제취소', '환불완료'] as const;
const PAYMENT_METHOD_OPTIONS = [
  '전체',
  '무통장입금',
  '카드결제',
  '카카오페이',
  '실시간계좌이체',
  '네이버페이',
] as const;
const COUPON_USAGE_OPTIONS = ['전체', '미사용', '사용'] as const;
const COUPON_TYPE_OPTIONS = ['전체', 'CRM', '기본쿠폰', '회원가입', '공동구매'] as const;
const CASH_RECEIPT_OPTIONS = ['전체', '발행', '미발행'] as const;
const PROGRESS_OPTIONS = [
  '전체',
  '업로드전',
  '업로드완료',
  '상품준비중',
  '발송대기중',
  '발송완료',
  '배송완료',
] as const;
const CURRENT_LOGIN_AUTHOR = '관리자';

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  detailSearchType: (typeof DETAIL_SEARCH_OPTIONS)[number]['value'];
  keyword: string;
  product: string;
  paymentStatus: string;
  paymentMethod: string;
  couponUsage: string;
  couponType: string;
  cashReceipt: string;
  progressStatus: string;
  minAmount: string;
  maxAmount: string;
};

type AppliedChipKey =
  | 'date'
  | 'keyword'
  | 'product'
  | 'paymentStatus'
  | 'paymentMethod'
  | 'couponUsage'
  | 'couponType'
  | 'cashReceipt'
  | 'progressStatus'
  | 'amount';

type OrderDetailPreviewItem = {
  id: string;
  thumbnailLabel: string;
  productName: string;
  optionLabel: string;
};

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

function formatYmd(date: Date | null) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getOrderDetailPreviewItems(order: FeelframeOrderListItem): OrderDetailPreviewItem[] {
  const sourceProducts = order.orderInfo
    .split('+')
    .map((item) => item.trim())
    .filter(Boolean);
  const totalCount = Math.max(1, order.purchaseCount);

  return Array.from({ length: totalCount }, (_, idx) => {
    const productName = sourceProducts[idx] ?? sourceProducts[sourceProducts.length - 1] ?? order.orderInfo;
    return {
      id: `${order.id}-detail-${idx + 1}`,
      thumbnailLabel: `상품 ${idx + 1}`,
      productName,
      optionLabel: `${order.shippingCarrierName} / ${idx + 1}번째 상품`,
    };
  });
}

function parseAmountInput(value: string) {
  const normalized = value.replace(/[^\d]/g, '');
  if (!normalized) return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function isAppliedSearchEmpty(search: AppliedSearch | null) {
  if (!search) return true;
  return (
    !search.dateRange &&
    search.startDate == null &&
    search.endDate == null &&
    !search.keyword.trim() &&
    search.product === '전체' &&
    search.paymentStatus === '전체' &&
    search.paymentMethod === '전체' &&
    search.couponUsage === '전체' &&
    search.couponType === '전체' &&
    search.cashReceipt === '전체' &&
    search.progressStatus === '전체' &&
    !search.minAmount.trim() &&
    !search.maxAmount.trim()
  );
}

function applyOrderListFilters(orders: FeelframeOrderListItem[], search: AppliedSearch | null) {
  if (!search) return orders;

  const keyword = search.keyword.trim().toLowerCase();
  const minAmount = parseAmountInput(search.minAmount);
  const maxAmount = parseAmountInput(search.maxAmount);

  return orders.filter((order) => {
    if (search.startDate || search.endDate) {
      const orderedAtDate = new Date(order.orderedAt);
      if (Number.isNaN(orderedAtDate.getTime())) return false;
      if (search.startDate) {
        const start = new Date(search.startDate);
        start.setHours(0, 0, 0, 0);
        if (orderedAtDate < start) return false;
      }
      if (search.endDate) {
        const end = new Date(search.endDate);
        end.setHours(23, 59, 59, 999);
        if (orderedAtDate > end) return false;
      }
    }

    if (keyword) {
      const paymentInfo = [order.paymentMethod, order.depositor ?? ''].join(' ').toLowerCase();
      const fieldMap: Record<(typeof DETAIL_SEARCH_OPTIONS)[number]['value'], string> = {
        전체: [
          order.customerName,
          order.customerId,
          order.customerEmail,
          order.customerPhone,
          order.orderNo,
          order.orderInfo,
          order.shippingCarrierName,
          paymentInfo,
        ]
          .join(' ')
          .toLowerCase(),
        이름: order.customerName.toLowerCase(),
        아이디: order.customerId.toLowerCase(),
        이메일: order.customerEmail.toLowerCase(),
        전화번호: order.customerPhone.toLowerCase(),
        주문번호: order.orderNo.toLowerCase(),
        상품명: `${order.orderInfo} ${order.shippingCarrierName}`.toLowerCase(),
        결제정보: paymentInfo,
      };

      if (!fieldMap[search.detailSearchType].includes(keyword)) return false;
    }

    if (
      search.product !== '전체' &&
      !order.orderInfo.includes(search.product) &&
      !order.shippingCarrierName.includes(search.product)
    ) {
      return false;
    }
    if (search.paymentStatus !== '전체' && order.paymentStatus !== search.paymentStatus) return false;
    if (search.paymentMethod !== '전체' && order.paymentMethod !== search.paymentMethod) return false;
    if (search.progressStatus !== '전체' && order.progressStatus !== search.progressStatus) return false;
    if (minAmount != null && order.paymentAmount < minAmount) return false;
    if (maxAmount != null && order.paymentAmount > maxAmount) return false;

    return true;
  });
}

function formatOrderCustomerCopyText(order: FeelframeOrderListItem): string {
  return [
    `이름: ${order.customerName}`,
    `아이디: ${order.customerId}`,
    `전화번호: ${order.customerPhone}`,
    `주문번호: ${order.orderNo}`,
  ].join('\n');
}

export default function FeelframeOrderListPage() {
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [detailSearchType, setDetailSearchType] = useState<(typeof DETAIL_SEARCH_OPTIONS)[number]['value']>('전체');
  const [keyword, setKeyword] = useState('');
  const [product, setProduct] = useState('전체');
  const [paymentStatus, setPaymentStatus] = useState('전체');
  const [paymentMethod, setPaymentMethod] = useState('전체');
  const [couponUsage, setCouponUsage] = useState('전체');
  const [couponType, setCouponType] = useState('전체');
  const [cashReceipt, setCashReceipt] = useState('전체');
  const [progressStatus, setProgressStatus] = useState('전체');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<FeelframeOrderListItem[]>(MOCK_FEELFRAME_ORDER_LIST);
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(null);
  const [managerModalOrderId, setManagerModalOrderId] = useState<string | null>(null);
  const [changedManager, setChangedManager] = useState('');
  const [memoModalOrderId, setMemoModalOrderId] = useState<string | null>(null);
  const [memoTooltipOrderId, setMemoTooltipOrderId] = useState<string | null>(null);
  const [memoTooltipPosition, setMemoTooltipPosition] = useState<{ top: number; right: number } | null>(null);
  const memoTooltipAnchorRef = useRef<HTMLElement | null>(null);
  const [orderDetailTooltipOrderId, setOrderDetailTooltipOrderId] = useState<string | null>(null);
  const [orderDetailTooltipPosition, setOrderDetailTooltipPosition] = useState<{ top: number; right: number } | null>(null);
  const orderDetailTooltipAnchorRef = useRef<HTMLElement | null>(null);
  const [memoInput, setMemoInput] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const ITEMS_PER_PAGE = 10;

  const filteredOrders = useMemo(
    () => applyOrderListFilters(orders, appliedSearch),
    [orders, appliedSearch]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);
  const selectedPeriodOrderCount = filteredOrders.length;

  const getPaymentStatusClassName = (status: FeelframeOrderListItem['paymentStatus']) => {
    if (status === '결제완료') return 'row-btn row-btn--status-secondary';
    if (status === '결제취소') return 'row-btn row-btn--status-danger';
    if (status === '환불완료') return 'row-btn row-btn--status-danger';
    return 'row-btn row-btn--status-warning';
  };

  const getPaymentProgressClassName = (status: FeelframeOrderListItem['paymentStatus']) => {
    if (status === '결제완료') return 'progress-status progress-status--secondary';
    if (status === '결제취소') return 'progress-status progress-status--danger';
    if (status === '환불완료') return 'progress-status progress-status--danger';
    return 'progress-status progress-status--warning';
  };

  const getProgressStatusClassName = (status: FeelframeOrderListItem['progressStatus']) => {
    if (status === '배송완료' || status === '발송완료') return 'progress-status progress-status--secondary';
    if (status === '상품준비중' || status === '발송대기중') return 'progress-status progress-status--warning';
    if (status === '업로드완료') return 'progress-status progress-status--blue';
    return 'progress-status progress-status--danger';
  };
  const managerOptions = useMemo(
    () => Array.from(new Set(orders.map((order) => order.manager))),
    [orders]
  );

  const closePaymentModal = () => setPaymentModalOrderId(null);
  const closeManagerModal = () => setManagerModalOrderId(null);
  const closeMemoModal = () => {
    setMemoModalOrderId(null);
    setMemoInput('');
  };
  const closeConfirmDialog = () => setConfirmDialog(null);

  const confirmPayment = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, paymentStatus: '결제완료' }
          : order
      )
    );
    setPaymentModalOrderId(null);
  };

  const confirmPaymentCancel = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, paymentStatus: '결제취소' }
          : order
      )
    );
    setPaymentModalOrderId(null);
  };

  const confirmRefund = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, paymentStatus: '환불완료' }
          : order
      )
    );
    setPaymentModalOrderId(null);
  };

  const issueCashReceipt = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              cashReceiptPurpose: order.cashReceiptPurpose ?? '소득공제',
              cashReceiptNo: order.cashReceiptNo ?? order.customerPhone,
            }
          : order
      )
    );
  };

  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const handleDeleteOrder = (orderId: string) => {
    setConfirmDialog({
      title: '주문 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        if (managerModalOrderId === orderId) setManagerModalOrderId(null);
      },
    });
  };

  const confirmManagerChange = (orderId: string) => {
    const nextManager = changedManager.trim();
    if (!nextManager) return;
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, manager: nextManager }
          : order
      )
    );
    closeManagerModal();
  };

  const openMemoModal = (orderId: string) => {
    setMemoModalOrderId(orderId);
    setMemoInput('');
  };

  const addMemo = (orderId: string) => {
    const content = memoInput.trim();
    if (!content) return;

    const nextMemo: FeelframeOrderMemoEntry = {
      id: `memo-${Date.now()}`,
      author: CURRENT_LOGIN_AUTHOR,
      content,
      createdAt: formatDateTimeNow(),
    };

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, memoEntries: [...order.memoEntries, nextMemo] }
          : order
      )
    );
    setMemoInput('');
  };

  const deleteMemo = (orderId: string, memoId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, memoEntries: order.memoEntries.filter((memo) => memo.id !== memoId) }
          : order
      )
    );
  };

  const updateMemoTooltipPosition = () => {
    const anchorElement = memoTooltipAnchorRef.current;
    if (!anchorElement) return;
    const rect = anchorElement.getBoundingClientRect();
    const viewportMargin = 12;
    const top = rect.bottom + 8;
    const right = Math.max(viewportMargin, window.innerWidth - rect.right);

    setMemoTooltipPosition({
      top,
      right,
    });
  };

  useLayoutEffect(() => {
    if (!memoTooltipOrderId) return;
    const update = () => updateMemoTooltipPosition();
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [memoTooltipOrderId]);

  const showMemoTooltip = (orderId: string, triggerElement: HTMLElement) => {
    memoTooltipAnchorRef.current = triggerElement;
    setMemoTooltipOrderId(orderId);
    updateMemoTooltipPosition();
  };

  const hideMemoTooltip = () => {
    setMemoTooltipOrderId(null);
    setMemoTooltipPosition(null);
    memoTooltipAnchorRef.current = null;
  };

  const updateOrderDetailTooltipPosition = () => {
    const anchorElement = orderDetailTooltipAnchorRef.current;
    if (!anchorElement) return;
    const rect = anchorElement.getBoundingClientRect();
    const viewportMargin = 12;
    const top = rect.bottom + 8;
    const right = Math.max(viewportMargin, window.innerWidth - rect.right);
    setOrderDetailTooltipPosition({ top, right });
  };

  const hideOrderDetailTooltip = () => {
    setOrderDetailTooltipOrderId(null);
    setOrderDetailTooltipPosition(null);
    orderDetailTooltipAnchorRef.current = null;
  };

  const toggleOrderDetailTooltip = (orderId: string, triggerElement: HTMLElement) => {
    if (orderDetailTooltipOrderId === orderId) {
      hideOrderDetailTooltip();
      return;
    }
    orderDetailTooltipAnchorRef.current = triggerElement;
    setOrderDetailTooltipOrderId(orderId);
    updateOrderDetailTooltipPosition();
  };

  useLayoutEffect(() => {
    if (!orderDetailTooltipOrderId) return;
    const update = () => updateOrderDetailTooltipPosition();
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [orderDetailTooltipOrderId]);

  useEffect(() => {
    if (!orderDetailTooltipOrderId) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const anchor = orderDetailTooltipAnchorRef.current;
      if (anchor?.contains(target)) return;
      hideOrderDetailTooltip();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      hideOrderDetailTooltip();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [orderDetailTooltipOrderId]);

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      detailSearchType,
      keyword,
      product,
      paymentStatus,
      paymentMethod,
      couponUsage,
      couponType,
      cashReceipt,
      progressStatus,
      minAmount,
      maxAmount,
    };
    setAppliedSearch(isAppliedSearchEmpty(nextAppliedSearch) ? null : nextAppliedSearch);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };

    switch (key) {
      case 'date':
        setDateRange('');
        setStartDate(null);
        setEndDate(null);
        next.dateRange = '';
        next.startDate = null;
        next.endDate = null;
        break;
      case 'keyword':
        setDetailSearchType('전체');
        setKeyword('');
        next.detailSearchType = '전체';
        next.keyword = '';
        break;
      case 'product':
        setProduct('전체');
        next.product = '전체';
        break;
      case 'paymentStatus':
        setPaymentStatus('전체');
        next.paymentStatus = '전체';
        break;
      case 'paymentMethod':
        setPaymentMethod('전체');
        next.paymentMethod = '전체';
        break;
      case 'couponUsage':
        setCouponUsage('전체');
        next.couponUsage = '전체';
        break;
      case 'couponType':
        setCouponType('전체');
        next.couponType = '전체';
        break;
      case 'cashReceipt':
        setCashReceipt('전체');
        next.cashReceipt = '전체';
        break;
      case 'progressStatus':
        setProgressStatus('전체');
        next.progressStatus = '전체';
        break;
      case 'amount':
        setMinAmount('');
        setMaxAmount('');
        next.minAmount = '';
        next.maxAmount = '';
        break;
      default:
        break;
    }

    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];

    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `기간: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `기간: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.product !== '전체') chips.push({ key: 'product', label: `상품: ${appliedSearch.product}` });
    if (appliedSearch.paymentStatus !== '전체') {
      chips.push({ key: 'paymentStatus', label: `결제현황: ${appliedSearch.paymentStatus}` });
    }
    if (appliedSearch.paymentMethod !== '전체') {
      chips.push({ key: 'paymentMethod', label: `결제수단: ${appliedSearch.paymentMethod}` });
    }
    if (appliedSearch.couponUsage !== '전체') {
      chips.push({ key: 'couponUsage', label: `쿠폰여부: ${appliedSearch.couponUsage}` });
    }
    if (appliedSearch.couponType !== '전체') {
      chips.push({ key: 'couponType', label: `쿠폰종류: ${appliedSearch.couponType}` });
    }
    if (appliedSearch.cashReceipt !== '전체') {
      chips.push({ key: 'cashReceipt', label: `현금영수증: ${appliedSearch.cashReceipt}` });
    }
    if (appliedSearch.progressStatus !== '전체') {
      chips.push({ key: 'progressStatus', label: `진행현황: ${appliedSearch.progressStatus}` });
    }
    if (appliedSearch.minAmount.trim() || appliedSearch.maxAmount.trim()) {
      chips.push({
        key: 'amount',
        label: `금액: ${appliedSearch.minAmount || '0'} ~ ${appliedSearch.maxAmount || '∞'}`,
      });
    }
    return chips;
  }, [appliedSearch]);

  return (
    <div className="admin-list-page">
      <h1 className="page-title">주문 관리</h1>

      <section className="admin-list-box">
        <p className="admin-list-result">선택기간 주문건수는 {selectedPeriodOrderCount}건 입니다.</p>
      </section>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">기간</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="기간 프리셋"
                className="listselect--date-range"
                value={dateRange}
                onChange={(next) => {
                  if (!next) {
                    setDateRange('');
                    setStartDate(null);
                    setEndDate(null);
                    return;
                  }
                  setDateRange(next);
                  const { start, end } = getDateRangeByPreset(next);
                  setStartDate(start);
                  setEndDate(end);
                }}
                options={[
                  { value: '', label: '미선택' },
                  ...DATE_RANGES.map((range) => ({ value: range, label: range })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => {
                    setStartDate(date);
                    setDateRange('');
                  }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!startDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => {
                    setEndDate(date);
                    setDateRange('');
                  }}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!endDate}
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
                value={detailSearchType}
                onChange={(next) => setDetailSearchType(next as (typeof DETAIL_SEARCH_OPTIONS)[number]['value'])}
                options={[...DETAIL_SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-top-actions">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
            <button
              type="button"
              className={`detail-search-toggle ${filterExpanded ? 'is-open' : ''}`}
              onClick={() => setFilterExpanded((prev) => !prev)}
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

        <div className={`filter-detail ${filterExpanded ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">상품</span>
            <ListSelect
              ariaLabel="상품"
              value={product}
              onChange={setProduct}
              options={PRODUCT_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">결제현황</span>
            <ListSelect
              ariaLabel="결제현황"
              value={paymentStatus}
              onChange={setPaymentStatus}
              options={PAYMENT_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">결제수단</span>
            <ListSelect
              ariaLabel="결제수단"
              value={paymentMethod}
              onChange={setPaymentMethod}
              options={PAYMENT_METHOD_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">쿠폰여부</span>
            <ListSelect
              ariaLabel="쿠폰여부"
              value={couponUsage}
              onChange={setCouponUsage}
              options={COUPON_USAGE_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">쿠폰종류</span>
            <ListSelect
              ariaLabel="쿠폰종류"
              value={couponType}
              onChange={setCouponType}
              options={COUPON_TYPE_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">현금영수증</span>
            <ListSelect
              ariaLabel="현금영수증"
              value={cashReceipt}
              onChange={setCashReceipt}
              options={CASH_RECEIPT_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">진행현황</span>
            <ListSelect
              ariaLabel="진행현황"
              value={progressStatus}
              onChange={setProgressStatus}
              options={PROGRESS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">금액별 검색</span>
            <div className="filter-range-wrap">
              <div className="filter-range-fields">
                <input
                  type="text"
                  inputMode="numeric"
                  className="filter-range-input"
                  placeholder="최소 금액"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <span className="filter-range-sep">~</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="filter-range-input"
                  placeholder="최대 금액"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="주문 리스트">
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
          <table className="admin-table admin-table--min-w-800 admin-table--feelframe-order-list">
            <thead>
              <tr>
                <th className="col-center">복사</th>
                <th>주문번호</th>
                <th>담당자</th>
                <th>고객정보</th>
                <th>가입일/예식일</th>
                <th>주문일</th>
                <th>주문정보/배송정보</th>
                <th className="col-center">구매수</th>
                <th className="col-center">결제금액</th>
                <th className="col-center">결제현황</th>
                <th className="col-center">진행현황</th>
                <th className="col-center">메모</th>
                <th className="col-center">상세정보</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className={
                    order.paymentStatus === '결제취소' || order.paymentStatus === '환불완료'
                      ? 'admin-table-row--danger'
                      : undefined
                  }
                >
                  <td className="col-center">
                    <ListRowCopyButton
                      text={formatOrderCustomerCopyText(order)}
                      ariaLabel="이름·아이디·전화번호·주문번호 복사"
                    />
                  </td>
                  <td>
                    <div className="admin-memo-trigger">
                      <button
                        type="button"
                        className="admin-link"
                        onClick={(e) => toggleOrderDetailTooltip(order.id, e.currentTarget)}
                        aria-expanded={orderDetailTooltipOrderId === order.id}
                        aria-label="주문상세 보기"
                      >
                        {order.orderNo}
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-link"
                      onClick={() => {
                        setManagerModalOrderId(order.id);
                        setChangedManager(order.manager);
                      }}
                    >
                      {order.manager}
                    </button>
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">{order.customerId}</span>
                      <span className="cell-line">{order.customerName}</span>
                      <span className="cell-line">{order.customerPhone}</span>
                      <span className="cell-line">{order.customerEmail}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-block cell-block--dates">
                      <span className="cell-line">{order.joinedAt}</span>
                      <span className="cell-line">{order.ceremonyAt}</span>
                    </div>
                  </td>
                  <td>{order.orderedAt}</td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">
                        <button
                          type="button"
                          className="admin-link"
                          onClick={(e) => toggleOrderDetailTooltip(order.id, e.currentTarget)}
                          aria-expanded={orderDetailTooltipOrderId === order.id}
                          aria-label="주문상세 보기"
                        >
                          {order.orderInfo}
                        </button>
                      </span>
                      <span className="cell-line cell-line--with-action">
                        <span className="badge-square badge-square--inline badge-square--no-transition badge-square--private" aria-hidden="true">
                        {order.shippingCarrierName}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="col-center">{order.purchaseCount}</td>
                  <td className="col-center">{order.paymentAmount.toLocaleString()}원</td>
                  <td className="col-center">
                    <div className="cell-block">
                      <button
                        type="button"
                        className={getPaymentStatusClassName(order.paymentStatus)}
                        onClick={() => setPaymentModalOrderId(order.id)}
                      >
                        <span className={getPaymentProgressClassName(order.paymentStatus)}>
                          <span className="progress-status__dot" aria-hidden="true" />
                          <span className="progress-status__text">{order.paymentStatus}</span>
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="col-center">
                    {(() => {
                      const progressCell = getFeelframeOrderProgressCellDisplay(order);
                      return (
                        <div className="cell-block">
                          <span className={getProgressStatusClassName(progressCell.statusForStyle)}>
                            <span className="progress-status__dot" aria-hidden="true" />
                            <span className="progress-status__text">{progressCell.primaryLabel}</span>
                          </span>
                          {progressCell.detailLines.map((line, lineIdx) => (
                            <span key={`${order.id}-progress-${lineIdx}`} className="cell-line">
                              {line}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="col-center">
                    <div
                      className="admin-memo-trigger"
                      onMouseEnter={(e) => {
                        if (order.memoEntries.length === 0) return;
                        showMemoTooltip(order.id, e.currentTarget);
                      }}
                      onMouseLeave={hideMemoTooltip}
                      onFocus={(e) => {
                        if (order.memoEntries.length === 0) return;
                        showMemoTooltip(order.id, e.currentTarget);
                      }}
                      onBlur={hideMemoTooltip}
                    >
                      <button
                        type="button"
                        className={`row-btn ${order.memoEntries.length > 0 ? 'row-btn--red' : 'row-btn--default'}`}
                        onClick={() => openMemoModal(order.id)}
                      >
                        {order.memoEntries.length > 0 ? '메모 확인' : '메모 작성'}
                      </button>
                    </div>
                  </td>
                  <td className="col-center">
                    <button type="button" className="admin-link">
                      상세보기
                    </button>
                  </td>
                  <td className="col-center">
                    <button
                      type="button"
                      className="row-btn row-btn--blue"
                      aria-label="삭제"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '20px' }}>
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
              <button type="button" onClick={() => setCurrentPage((p) => jumpPageBack(p))} disabled={currentPage <= 1} aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}>
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="이전 페이지"
              >
                &lsaquo;
              </button>
              {getVisiblePageNumbers(totalPages, currentPage).map((page) => (
                <button key={page} type="button" className={currentPage === page ? 'active' : ''} onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button type="button" onClick={() => setCurrentPage((p) => jumpPageForward(p, totalPages))} disabled={currentPage >= totalPages} aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}>
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      {paymentModalOrderId && (() => {
        const order = orders.find((item) => item.id === paymentModalOrderId);
        if (!order) return null;
        const isUnpaid = order.paymentStatus === '결제전';
        const isCanceled = order.paymentStatus === '결제취소';
        const isRefunded = order.paymentStatus === '환불완료';
        const isRefundedBankTransfer = isRefunded && order.paymentMethod === '무통장입금';

        return (
          <Modal open onClose={closePaymentModal} ariaLabel="결제현황" variant="option">
            <Modal.Header>
              <Modal.Title>결제현황</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <div className="option-modal__status-grid">
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">결제상태</span>
                  <span className="option-modal__status-value">{order.paymentStatus}</span>
                </div>
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">결제수단</span>
                  <span className="option-modal__status-value">
                    {order.paymentMethod}
                    {order.depositor ? ` (입금자명: ${order.depositor})` : ''}
                  </span>
                </div>
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">구매경로</span>
                  <span className="option-modal__status-value">{order.purchasePath}</span>
                </div>
                {isRefundedBankTransfer && (
                  <>
                    <div className="option-modal__status-row">
                      <span className="option-modal__status-label">현금영수증 용도</span>
                      <span className="option-modal__status-value">{order.cashReceiptPurpose ?? '-'}</span>
                    </div>
                    <div className="option-modal__status-row">
                      <span className="option-modal__status-label">발행번호</span>
                      <span className="option-modal__status-value">{order.cashReceiptNo ?? '-'}</span>
                    </div>
                  </>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              {!isRefunded && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--danger"
                  onClick={() => confirmPaymentCancel(order.id)}
                >
                  결제취소
                </button>
              )}
              <button
                type="button"
                className="option-modal__btn option-modal__btn--ghost"
                onClick={closePaymentModal}
              >
                닫기
              </button>
              {isUnpaid && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--primary"
                  onClick={() => confirmPayment(order.id)}
                >
                  입금 확인
                </button>
              )}
              {isCanceled && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--primary"
                  onClick={() => confirmRefund(order.id)}
                >
                  환불완료 처리
                </button>
              )}
              {isRefundedBankTransfer && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--primary"
                  onClick={() => issueCashReceipt(order.id)}
                >
                  현금영수증 발행
                </button>
              )}
            </Modal.Footer>
          </Modal>
        );
      })()}

      {managerModalOrderId && (() => {
        const order = orders.find((item) => item.id === managerModalOrderId);
        if (!order) return null;

        return (
          <Modal open onClose={closeManagerModal} ariaLabel="담당자 변경" variant="option">
            <Modal.Header>
              <Modal.Title>담당자변경</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <div className="option-modal__status-grid">
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">현재 담당자</span>
                  <span className="option-modal__status-value">{order.manager}</span>
                </div>
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">변경 담당자</span>
                  <ListSelect
                    ariaLabel="변경 담당자"
                    className="listselect--modal"
                    value={changedManager}
                    onChange={setChangedManager}
                    options={managerOptions.map((manager) => ({ value: manager, label: manager }))}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeManagerModal}>
                닫기
              </button>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--primary"
                onClick={() => confirmManagerChange(order.id)}
              >
                변경 저장
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      {memoModalOrderId && (() => {
        const order = orders.find((item) => item.id === memoModalOrderId);
        if (!order) return null;

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
                {order.memoEntries.length === 0 ? (
                  <p className="admin-memo-history__empty">등록된 메모가 없습니다.</p>
                ) : (
                  <ul className="admin-memo-history__list">
                    {[...order.memoEntries].reverse().map((memo) => (
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
                            onClick={() => deleteMemo(order.id, memo.id)}
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
                onClick={() => addMemo(order.id)}
              >
                메모 저장
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      {memoTooltipOrderId && memoTooltipPosition && (() => {
        const order = orders.find((item) => item.id === memoTooltipOrderId);
        if (!order || order.memoEntries.length === 0) return null;

        return createPortal(
          <div
            className="admin-memo-floating-tooltip"
            role="tooltip"
            style={{ top: memoTooltipPosition.top, right: memoTooltipPosition.right }}
          >
            <ul className="admin-memo-history__list">
              {[...order.memoEntries].reverse().map((memo) => (
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

      {orderDetailTooltipOrderId && orderDetailTooltipPosition && (() => {
        const order = orders.find((item) => item.id === orderDetailTooltipOrderId);
        if (!order) return null;
        const detailItems = getOrderDetailPreviewItems(order);

        return createPortal(
          <div
            className="admin-order-detail-floating-tooltip"
            role="tooltip"
            style={{ top: orderDetailTooltipPosition.top, right: orderDetailTooltipPosition.right }}
          >
            <div className="admin-order-detail-tooltip">
              <div className="admin-order-detail-tooltip__header">
                <span>고객명: {order.customerName}</span>
                <span>주문번호: {order.orderNo}</span>
              </div>
              <ul className="admin-order-detail-tooltip__list">
                {detailItems.map((detailItem) => (
                  <li key={detailItem.id} className="admin-order-detail-tooltip__item">
                    <div className="admin-order-detail-tooltip__thumb" aria-hidden="true">
                      {detailItem.thumbnailLabel}
                    </div>
                    <div className="admin-order-detail-tooltip__meta">
                      <p className="admin-order-detail-tooltip__name">{detailItem.productName}</p>
                      <p className="admin-order-detail-tooltip__option">{detailItem.optionLabel}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
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
    </div>
  );
}
