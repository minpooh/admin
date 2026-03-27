import { useRef, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderListPage.css';
import Modal from '../../../components/modal';
import Confirm from '../../../components/confirm';
import ListSelect from './components/ListSelect';
import { MOCK_ORDERS, type OrderItem } from './mock/orderVideo.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

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
const CATEGORIES = [
  '사진보정',
  '식전영상',
  '영상편지',
  '성장영상',
  '부모님감사영상',
  '모바일초대영상',
  '행사영상',
  '오프닝영상',
];
const CONDITION_OPTIONS = [
  '결제전주문',
  '결제완료주문',
  '결제취소주문',
  '쿠폰사용주문',
  '주문취소건',
  '무통장입금',
  'PG결제',
  '결제안됨',
  '실시간계좌이체',
];
const PRODUCTION_STATUS = [
  '제작전',
  '제작중',
  '제작완료',
  '고객자료완료',
  'dvd확정미출고',
  'dvd미확정',
  'usb확정미출고',
  'usb미확정',
];
const COUPON_TYPES = ['무료쿠폰', '%할인쿠폰', '금액할인쿠폰', '미사용'];
const PUBLIC_OPTIONS = ['미공개', '공개'];

/** 가입채널(목업 `partner` 필드 값) */
const PARTNER_CHANNELS = [
  'feelmaker',
  'feelmotioncard',
  'baruncompany',
  'barunsonmall',
  'bhandscard',
  'deardeer',
  'premierpaper',
  'thecard',
  'hallchuu',
  'bom',
  'NAVER_STORE',
] as const;

/** 구매채널(목업 `purchaseChannel` 필드 값) */
const PURCHASE_CHANNELS = ['필메이커', '스토어팜'] as const;

// 주문일 문자열에서 Date 추출 (YYYY-MM-DD HH:mm:ss/ 형식)
function parseOrderDate(orderDate: string): Date {
  const dateStr = orderDate.replace(/\/$/, '').trim().slice(0, 19);
  return new Date(dateStr);
}

// 날짜 범위에 해당하는지 (dateRange: 당일, 3일, 1주, 2주, 1개월, 3개월, 6개월)
function isInDateRange(orderDate: string, dateRange: string): boolean {
  const date = parseOrderDate(orderDate);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  switch (dateRange) {
    case '당일':
      return sameDay;
    case '3일':
      return diffDays >= 0 && diffDays <= 3;
    case '1주':
      return diffDays >= 0 && diffDays <= 7;
    case '2주':
      return diffDays >= 0 && diffDays <= 14;
    case '1개월':
      return diffDays >= 0 && diffDays <= 30;
    case '3개월':
      return diffDays >= 0 && diffDays <= 90;
    case '6개월':
      return diffDays >= 0 && diffDays <= 180;
    default:
      return true;
  }
}

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: string;
  keyword: string;
  category: string | null;
  condition: string | null;
  production: string | null;
  coupon: string | null;
  publicOption: string | null;
  pgCompany: string;
  option: string;
  partner: string;
  purchaseChannel: string;
};

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

function matchOrderCondition(order: OrderItem, condition: string): boolean {
  switch (condition) {
    case '결제전주문':
      return order.paymentStatus === '결제전';
    case '결제완료주문':
      return order.paymentStatus === '결제완료';
    case '결제취소주문':
    case '주문취소건':
      return order.paymentStatus === '결제취소됨';
    case '무통장입금':
      return order.paymentMethod === '무통장 입금';
    case 'PG결제':
      return order.paymentMethod === 'PG결제';
    case '실시간계좌이체':
      return order.paymentMethod === '실시간계좌이체';
    case '쿠폰사용주문':
      return order.couponType !== '미사용';
    default:
      return true;
  }
}

function isInCustomDateRange(orderDate: string, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const d = parseOrderDate(orderDate);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (start) {
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    if (dayStart < s) return false;
  }
  if (end) {
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    if (dayStart > e) return false;
  }
  return true;
}

function applyFilters(orders: OrderItem[], applied: AppliedSearch | null): OrderItem[] {
  if (!applied) return orders;
  return orders.filter((order) => {
    const useCustomRange = applied.startDate != null || applied.endDate != null;
    if (useCustomRange) {
      if (!isInCustomDateRange(order.orderDate, applied.startDate, applied.endDate)) return false;
    } else if (!isInDateRange(order.orderDate, applied.dateRange)) {
      return false;
    }
    if (applied.keyword.trim()) {
      const k = applied.keyword.trim().toLowerCase();
      if (applied.conditionType === '이름' && !order.customerName.toLowerCase().includes(k)) return false;
      if (applied.conditionType === '아이디' && !order.customerId.toLowerCase().includes(k)) return false;
      if (applied.conditionType === '주문번호' && !order.no.includes(k)) return false;
    }
    if (applied.category !== null && order.category !== applied.category) return false;
    if (applied.condition !== null && !matchOrderCondition(order, applied.condition)) return false;
    if (applied.production !== null && order.progress !== applied.production) return false;
    if (applied.coupon !== null && order.couponType !== applied.coupon) return false;
    if (applied.publicOption !== null) {
      const orderPublic = order.videoPublic === '영상공개' ? '공개' : '미공개';
      if (orderPublic !== applied.publicOption) return false;
    }
    if (applied.pgCompany && applied.pgCompany !== '전체' && order.pgCompany !== applied.pgCompany) return false;
    if (applied.option && applied.option !== '전체' && order.option !== applied.option) return false;
    if (applied.partner && applied.partner !== '전체' && order.partner !== applied.partner) return false;
    if (
      applied.purchaseChannel &&
      applied.purchaseChannel !== '전체' &&
      order.purchaseChannel !== applied.purchaseChannel
    )
      return false;
    return true;
  });
}

export default function OrderVideoPage() {
  const [filterExpanded, setFilterExpanded] = useState(false);
  // 주문일을 아직 선택하지 않았을 때는 어떤 프리셋도 활성화하지 않음.
  // (isInDateRange의 default 처리로 필터링이 걸리지 않도록 함)
  const [dateRange, setDateRange] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conditionType, setConditionType] = useState('이름');
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedProduction, setSelectedProduction] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<string | null>(null);
  const [selectedPublic, setSelectedPublic] = useState<string | null>(null);
  const [pgCompany, setPgCompany] = useState('전체');
  const [option, setOption] = useState('전체');
  const [partner, setPartner] = useState('전체');
  const [purchaseChannel, setPurchaseChannel] = useState('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>(() =>
    MOCK_ORDERS.map((o) => ({
      ...o,
      makerServiceAdded: o.makerServiceAdded ?? false,
      dvdAdded: o.dvdAdded ?? false,
      usbAdded: o.usbAdded ?? false,
    }))
  );
  const [openOptionsOrderId, setOpenOptionsOrderId] = useState<string | null>(null);
  const [openVideoOptionsOrderId, setOpenVideoOptionsOrderId] = useState<string | null>(null);
  /** 테이블 overflow에 잘리지 않도록 드롭다운을 body에 고정 배치할 때 사용 */
  const rowDropdownAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [rowDropdownPos, setRowDropdownPos] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [videoPreviewOrderId, setVideoPreviewOrderId] = useState<string | null>(null);
  const [optionModal, setOptionModal] = useState<{
    orderId: string;
    type: 'makerService' | 'dvd' | 'usb';
  } | null>(null);
  const [smsModalOrderId, setSmsModalOrderId] = useState<string | null>(null);
  const [smsText, setSmsText] = useState('');
  const [smsHistoryByOrderId, setSmsHistoryByOrderId] = useState<Record<string, string[]>>({});
  const phoneMessagesRef = useRef<HTMLDivElement | null>(null);
  const [partnerModalOrderId, setPartnerModalOrderId] = useState<string | null>(null);
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(null);
  const [amountChangeModalOrderId, setAmountChangeModalOrderId] = useState<string | null>(null);
  const [changedAmount, setChangedAmount] = useState<string>('');
  const [changedPartner, setChangedPartner] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const smsHistoryLen = smsModalOrderId ? (smsHistoryByOrderId[smsModalOrderId]?.length ?? 0) : 0;

  const openConfirmDialog = (config: ConfirmDialogState) => setConfirmDialog(config);
  const closeConfirmDialog = () => setConfirmDialog(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const handleVideoPublicClick = (orderId: string, isCurrentlyPublic: boolean) => {
    const msg = isCurrentlyPublic ? '미공개로 변경할까요?' : '공개로 변경할까요?';
    openConfirmDialog({
      message: msg,
      onConfirm: () => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, videoPublic: isCurrentlyPublic ? '영상미공개' : '영상공개' }
              : o
          )
        );
      },
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    openConfirmDialog({
      title: '주문 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSmsHistoryByOrderId((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        if (openOptionsOrderId === orderId) setOpenOptionsOrderId(null);
        if (openVideoOptionsOrderId === orderId) setOpenVideoOptionsOrderId(null);
        if (videoPreviewOrderId === orderId) setVideoPreviewOrderId(null);
        if (optionModal?.orderId === orderId) setOptionModal(null);
        if (smsModalOrderId === orderId) setSmsModalOrderId(null);
        if (paymentModalOrderId === orderId) setPaymentModalOrderId(null);
        if (amountChangeModalOrderId === orderId) setAmountChangeModalOrderId(null);
      },
    });
  };

  const handleOptionMenuClick = (orderId: string, type: 'makerService' | 'dvd' | 'usb') => {
    setOptionModal({ orderId, type });
    setOpenOptionsOrderId(null);
  };

  const confirmOptionAdd = (orderId: string, key: 'makerServiceAdded' | 'dvdAdded' | 'usbAdded') => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, [key]: true } : o)));
    setOptionModal(null);
  };

  const closeOptionModal = () => setOptionModal(null);
  const closeVideoPreviewModal = () => setVideoPreviewOrderId(null);
  const closeSmsModal = () => setSmsModalOrderId(null);
  const closePartnerModal = () => setPartnerModalOrderId(null);
  const closePaymentModal = () => setPaymentModalOrderId(null);
  const closeAmountChangeModal = () => {
    setAmountChangeModalOrderId(null);
    setChangedAmount('');
  };

  const confirmPayment = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: '결제완료' } : o))
    );
    setPaymentModalOrderId(null);
  };

  const confirmAmountChange = (orderId: string) => {
    const nextAmount = Number(changedAmount);
    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      window.alert('변경 금액을 올바르게 입력해주세요.');
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, amount: nextAmount } : o)));
    closeAmountChangeModal();
  };

  const confirmPartnerChange = (orderId: string) => {
    if (!changedPartner.trim()) {
      window.alert('변경 파트너사를 선택해주세요.');
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, partner: changedPartner } : o)));
    closePartnerModal();
  };

  const handleVideoDownload = (order: OrderItem) => {
    const safeNo = order.no.replace(/[^\w-]/g, '_');
    const fileName = `${safeNo}_preview.mp4`;
    const content = [
      `주문번호: ${order.no}`,
      `상품명: ${order.productName}`,
      `고객명: ${order.customerName}`,
      '',
      '실제 다운로드 API 연결 전 목업 파일입니다.',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUtf8Bytes = (text: string) => new TextEncoder().encode(text).length;

  const trimToMaxBytes = (text: string, maxBytes: number) => {
    if (getUtf8Bytes(text) <= maxBytes) return text;
    let out = '';
    for (const ch of text) {
      const next = out + ch;
      if (getUtf8Bytes(next) > maxBytes) break;
      out = next;
    }
    return out;
  };

  useLayoutEffect(() => {
    if (!openOptionsOrderId && !openVideoOptionsOrderId) return;
    const update = () => {
      const el = rowDropdownAnchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRowDropdownPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [openOptionsOrderId, openVideoOptionsOrderId]);

  useEffect(() => {
    if (!openOptionsOrderId && !openVideoOptionsOrderId) setRowDropdownPos(null);
  }, [openOptionsOrderId, openVideoOptionsOrderId]);

  useEffect(() => {
    if (!openOptionsOrderId && !openVideoOptionsOrderId) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.row-options') || target.closest('.row-options__menu-portal')) return;
      setOpenOptionsOrderId(null);
      setOpenVideoOptionsOrderId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenOptionsOrderId(null);
        setOpenVideoOptionsOrderId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openOptionsOrderId, openVideoOptionsOrderId]);

  // Escape 처리는 공통 Modal 컴포넌트에서 처리

  useEffect(() => {
    if (!smsModalOrderId) return;
    const el = phoneMessagesRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [smsModalOrderId, smsHistoryLen, smsText]);

  const filteredOrders = useMemo(
    () => applyFilters(orders, appliedSearch),
    [orders, appliedSearch]
  );
  const totalOrderAmount = useMemo(() => orders.reduce((sum, order) => sum + order.amount, 0), [orders]);
  const totalUnpaidCount = useMemo(
    () => orders.filter((order) => order.paymentStatus !== '결제완료').length,
    [orders]
  );
  const filteredOrderAmount = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.amount, 0),
    [filteredOrders]
  );
  const filteredUnpaidCount = useMemo(
    () => filteredOrders.filter((order) => order.paymentStatus !== '결제완료').length,
    [filteredOrders]
  );

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const portalOptionsOrder = useMemo(
    () => (openOptionsOrderId ? orders.find((o) => o.id === openOptionsOrderId) ?? null : null),
    [openOptionsOrderId, orders]
  );
  const portalVideoOrder = useMemo(
    () =>
      openVideoOptionsOrderId ? orders.find((o) => o.id === openVideoOptionsOrderId) ?? null : null,
    [openVideoOptionsOrderId, orders]
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  const handleSearch = () => {
    setAppliedSearch({
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      category: selectedCategory,
      condition: selectedCondition,
      production: selectedProduction,
      coupon: selectedCoupon,
      publicOption: selectedPublic,
      pgCompany,
      option,
      partner,
      purchaseChannel,
    });
  };

  const formatYmd = (d: Date | null) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  type AppliedChipKey =
    | 'date'
    | 'keyword'
    | 'category'
    | 'condition'
    | 'production'
    | 'coupon'
    | 'publicOption'
    | 'pgCompany'
    | 'option'
    | 'partner'
    | 'purchaseChannel';

  const isAppliedSearchEmpty = (s: AppliedSearch | null) => {
    if (!s) return true;
    return (
      !s.dateRange &&
      s.startDate == null &&
      s.endDate == null &&
      !s.keyword.trim() &&
      s.category == null &&
      s.condition == null &&
      s.production == null &&
      s.coupon == null &&
      s.publicOption == null &&
      s.pgCompany === '전체' &&
      s.option === '전체' &&
      s.partner === '전체' &&
      s.purchaseChannel === '전체'
    );
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;

    const next: AppliedSearch = { ...appliedSearch };

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
        setKeyword('');
        next.keyword = '';
        break;
      case 'category':
        setSelectedCategory(null);
        next.category = null;
        break;
      case 'condition':
        setSelectedCondition(null);
        next.condition = null;
        break;
      case 'production':
        setSelectedProduction(null);
        next.production = null;
        break;
      case 'coupon':
        setSelectedCoupon(null);
        next.coupon = null;
        break;
      case 'publicOption':
        setSelectedPublic(null);
        next.publicOption = null;
        break;
      case 'pgCompany':
        setPgCompany('전체');
        next.pgCompany = '전체';
        break;
      case 'option':
        setOption('전체');
        next.option = '전체';
        break;
      case 'partner':
        setPartner('전체');
        next.partner = '전체';
        break;
      case 'purchaseChannel':
        setPurchaseChannel('전체');
        next.purchaseChannel = '전체';
        break;
      default:
        break;
    }

    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = (() => {
    if (!appliedSearch) return [];

    const chips: Array<{ key: AppliedChipKey; label: string }> = [];

    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({
        key: 'date',
        label: `주문일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `주문일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }

    if (appliedSearch.category) chips.push({ key: 'category', label: `카테고리별: ${appliedSearch.category}` });
    if (appliedSearch.condition) chips.push({ key: 'condition', label: `조건선택검색: ${appliedSearch.condition}` });
    if (appliedSearch.production) chips.push({ key: 'production', label: `제작현황: ${appliedSearch.production}` });
    if (appliedSearch.coupon) chips.push({ key: 'coupon', label: `쿠폰종류: ${appliedSearch.coupon}` });
    if (appliedSearch.publicOption) chips.push({ key: 'publicOption', label: `공개여부: ${appliedSearch.publicOption}` });
    if (appliedSearch.pgCompany && appliedSearch.pgCompany !== '전체')
      chips.push({ key: 'pgCompany', label: `pg사 검색: ${appliedSearch.pgCompany}` });
    if (appliedSearch.option && appliedSearch.option !== '전체')
      chips.push({ key: 'option', label: `옵션검색: ${appliedSearch.option}` });
    if (appliedSearch.partner && appliedSearch.partner !== '전체')
      chips.push({ key: 'partner', label: `가입채널: ${appliedSearch.partner}` });
    if (appliedSearch.purchaseChannel && appliedSearch.purchaseChannel !== '전체')
      chips.push({ key: 'purchaseChannel', label: `구매채널: ${appliedSearch.purchaseChannel}` });

    return chips;
  })();

  return (
    <div className="order-list-page">
      <h1 className="page-title">구매영상 목록</h1>

      {/* 검색 결과 문구 */}
      <section className="order-list-box">
        <p className="order-list-result">
          {appliedSearch
            ? `총 ${filteredOrders.length}개 / ${filteredOrderAmount.toLocaleString()}원 의 주문이 검색되었습니다. 미결제건은 ${filteredUnpaidCount}개 입니다.`
            : `총 ${orders.length}개 / ${totalOrderAmount.toLocaleString()}원 의 주문이 검색되었습니다. 미결제건은 ${totalUnpaidCount}개 입니다.`}
        </p>
      </section>

      {/* 검색/필터 영역 */}
      <section className="order-list-box">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">주문일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="주문일 프리셋"
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
                  ...DATE_RANGES.map((r) => ({ value: r, label: r })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => {
                    setStartDate(date);
                    setStartDateOpen(false);
                    // 날짜 피커를 직접 조작하면 프리셋 선택 상태를 해제
                    setDateRange('');
                  }}
                  onCalendarOpen={() => setStartDateOpen(true)}
                  onCalendarClose={() => setStartDateOpen(false)}
                  onInputClick={() => setStartDateOpen(true)}
                  open={startDateOpen}
                  onClickOutside={() => setStartDateOpen(false)}
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
                  maxDate={new Date()}
                  calendarContainer={({ className, children }) => (
                    <div className={`${className ?? ''} order-list-datepicker-container`.trim()}>
                      {children}
                      <div className="react-datepicker-custom-footer">
                        <button
                          type="button"
                          className="datepicker-footer-btn datepicker-footer-btn--today"
                          onClick={() => setStartDate(new Date())}
                        >
                          오늘
                        </button>
                        <button
                          type="button"
                          className="datepicker-footer-btn datepicker-footer-btn--close"
                          onClick={() => setStartDateOpen(false)}
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                  )}
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => {
                    setEndDate(date);
                    setEndDateOpen(false);
                    // 날짜 피커를 직접 조작하면 프리셋 선택 상태를 해제
                    setDateRange('');
                  }}
                  onCalendarOpen={() => setEndDateOpen(true)}
                  onCalendarClose={() => setEndDateOpen(false)}
                  onInputClick={() => setEndDateOpen(true)}
                  open={endDateOpen}
                  onClickOutside={() => setEndDateOpen(false)}
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
                  maxDate={new Date()}
                  calendarContainer={({ className, children }) => (
                    <div className={`${className ?? ''} order-list-datepicker-container`.trim()}>
                      {children}
                      <div className="react-datepicker-custom-footer">
                        <button
                          type="button"
                          className="datepicker-footer-btn datepicker-footer-btn--today"
                          onClick={() => setEndDate(new Date())}
                        >
                          오늘
                        </button>
                        <button
                          type="button"
                          className="datepicker-footer-btn datepicker-footer-btn--close"
                          onClick={() => setEndDateOpen(false)}
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">조건검색</span>
            <div className="condition-search-wrap">
              <ListSelect
                ariaLabel="조건검색 타입"
                className="listselect--condition-type"
                value={conditionType}
                onChange={setConditionType}
                options={[
                  { value: '이름', label: '이름' },
                  { value: '아이디', label: '아이디' },
                  { value: '주문번호', label: '주문번호' },
                ]}
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
              onClick={() => setFilterExpanded((v) => !v)}
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
          <span className="filter-label">카테고리별</span>
          <ListSelect
            ariaLabel="카테고리별"
            value={selectedCategory ?? ''}
            onChange={(next) => setSelectedCategory(next ? next : null)}
            options={[
              { value: '', label: '전체보기' },
              ...CATEGORIES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">조건선택검색</span>
          <ListSelect
            ariaLabel="조건선택검색"
            value={selectedCondition ?? ''}
            onChange={(next) => setSelectedCondition(next ? next : null)}
            options={[
              { value: '', label: '전체보기' },
              ...CONDITION_OPTIONS.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">제작현황</span>
          <ListSelect
            ariaLabel="제작현황"
            value={selectedProduction ?? ''}
            onChange={(next) => setSelectedProduction(next ? next : null)}
            options={[
              { value: '', label: '전체보기' },
              ...PRODUCTION_STATUS.map((p) => ({ value: p, label: p })),
            ]}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">쿠폰종류</span>
          <ListSelect
            ariaLabel="쿠폰종류"
            value={selectedCoupon ?? ''}
            onChange={(next) => setSelectedCoupon(next ? next : null)}
            options={[
              { value: '', label: '전체보기' },
              ...COUPON_TYPES.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">공개여부</span>
          <ListSelect
            ariaLabel="공개여부"
            value={selectedPublic ?? ''}
            onChange={(next) => setSelectedPublic(next ? next : null)}
            options={[
              { value: '', label: '전체보기' },
              ...PUBLIC_OPTIONS.map((p) => ({ value: p, label: p })),
            ]}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">pg사 검색</span>
          <ListSelect
            ariaLabel="pg사 검색"
            value={pgCompany}
            onChange={setPgCompany}
            options={[
              { value: '전체', label: '전체' },
              { value: '토스', label: '토스' },
              { value: '나이스', label: '나이스' },
            ]}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">옵션검색</span>
          <ListSelect
            ariaLabel="옵션검색"
            value={option}
            onChange={setOption}
            options={[
              { value: '전체', label: '전체' },
              { value: '기본', label: '기본' },
              { value: '프리미엄', label: '프리미엄' },
            ]}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">가입채널</span>
          <ListSelect
            ariaLabel="가입채널"
            value={partner}
            onChange={setPartner}
            options={[
              { value: '전체', label: '전체' },
              ...PARTNER_CHANNELS.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>

        <div className="filter-section">
          <span className="filter-label">구매채널</span>
          <ListSelect
            ariaLabel="구매채널"
            value={purchaseChannel}
            onChange={setPurchaseChannel}
            options={[
              { value: '전체', label: '전체' },
              ...PURCHASE_CHANNELS.map((c) => ({ value: c, label: c })),
            ]}
          />
        </div>

        </div>

      </section>

      {/* 주문 리스트 (좌우 스크롤) - 박스 패딩 없이 테이블로 꽉 채움 */}
      <section className="order-list-box order-list-box--table">
      {appliedChips.length > 0 && (
        <section className="applied-filters">
          <div className="applied-filters__left">
            <div className="applied-filters__list">
              {appliedChips.map((chip) => (
                <div key={chip.key} className="applied-chip">
                  <span className="applied-chip__text">{chip.label}</span>
                  <button
                    type="button"
                    className="applied-chip__x"
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

        <div className="order-table-wrap">
          <table className="order-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>구매채널/가입채널</th>
                <th>진행현황</th>
                <th>상품정보</th>
                <th>이름</th>
                <th>아이디</th>
                <th>전화번호</th>
                <th>주문일/최초제작일</th>
                <th>결제현황</th>
                <th>결제금액</th>
                <th>추가옵션</th>
                <th>영상</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">{order.no}</span>
                      <span className="cell-line">{order.noSub}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-block cell-block--channels">
                      <span className="cell-line">
                        <span className="channel-label">구매</span> {order.purchaseChannel}
                      </span>
                      <span className="cell-line">
                        <span className="channel-label">가입</span>
                        <button
                          type="button"
                          className="channel-partner-btn"
                          onClick={() => {
                            setPartnerModalOrderId(order.id);
                            setChangedPartner(order.partner);
                            setOpenOptionsOrderId(null);
                            setOpenVideoOptionsOrderId(null);
                            setOptionModal(null);
                            setSmsModalOrderId(null);
                          }}
                        >
                          {order.partner}
                        </button>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div
                      className={[
                        'progress-status',
                        order.paymentStatus === '결제취소됨'
                          ? 'progress-status--danger'
                          : order.progress.includes('제작전')
                          ? 'progress-status--primary'
                          : order.progress.includes('제작중')
                            ? 'progress-status--danger'
                            : order.progress.includes('제작완료')
                              ? 'progress-status--secondary'
                              : 'progress-status--warning',
                      ].join(' ')}
                    >
                      <span className="progress-status__dot" aria-hidden="true" />
                      <span className="progress-status__text">
                        {order.paymentStatus === '결제취소됨' ? '결제취소됨' : order.progress}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-block cell-block--product-with-badge">
                      <div className="product-name-with-public">
                        <button
                          type="button"
                          className={`badge-square ${
                            order.videoPublic === '영상공개'
                              ? 'badge-square--open'
                              : 'badge-square--private'
                          }`}
                          title={
                            order.videoPublic === '영상공개'
                              ? '영상 공개 — 클릭 시 미공개로 변경'
                              : '영상 미공개 — 클릭 시 공개로 변경'
                          }
                          onClick={() =>
                            handleVideoPublicClick(
                              order.id,
                              order.videoPublic === '영상공개'
                            )
                          }
                        >
                          {order.videoPublic === '영상공개' ? '공' : '미'}
                        </button>
                        <span className="cell-line">{order.productName}</span>
                      </div>
                    </div>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.customerId}</td>
                  <td>
                    <div className="phone-with-sms">
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-secondary row-icon-btn--compact"
                        aria-label="문자 발송"
                        title="문자 발송"
                        onClick={() => {
                          setSmsModalOrderId(order.id);
                          setSmsText('');
                        }}
                      >
                        <Mail size={12} aria-hidden="true" />
                      </button>
                      <span className="phone-with-sms__number">{order.customerPhone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-with-add">
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-secondary row-icon-btn--compact date-with-add__btn"
                        aria-label="기간추가"
                        title="기간추가"
                        onClick={() => {
                          openConfirmDialog({
                            title: '기간 추가',
                            message: '추가하시겠습니까?',
                            onConfirm: () => {},
                          });
                        }}
                      >
                        <Plus size={12} aria-hidden="true" />
                      </button>
                      <div className="cell-block cell-block--dates">
                        <span className="cell-line">{order.orderDate}</span>
                        <span className="cell-line">{order.firstProductionDate}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cell-block">
                      <button
                        type="button"
                        className={[
                          'row-btn',
                          order.paymentStatus === '결제완료'
                            ? 'row-btn--status-secondary'
                            : order.paymentStatus === '결제취소됨'
                              ? 'row-btn--status-danger'
                              : 'row-btn--status-warning',
                        ].join(' ')}
                        onClick={() => setPaymentModalOrderId(order.id)}
                      >
                        <span
                          className={[
                            'progress-status',
                            order.paymentStatus === '결제완료'
                              ? 'progress-status--secondary'
                              : order.paymentStatus === '결제취소됨'
                                ? 'progress-status--danger'
                                : 'progress-status--warning',
                          ].join(' ')}
                        >
                          <span className="progress-status__dot" aria-hidden="true" />
                          <span className="progress-status__text">{order.paymentStatus}</span>
                        </span>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="cell-block cell-block--amount-inline">
                      <span className="cell-line amount-red">{order.amount.toLocaleString()}원</span>
                      <button
                        type="button"
                        className="row-btn row-btn--blue"
                        onClick={() => {
                          setAmountChangeModalOrderId(order.id);
                          setChangedAmount(String(order.amount));
                        }}
                      >
                        금액 변경
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="row-options">
                      <button
                        type="button"
                        className="row-options__trigger"
                        aria-haspopup="menu"
                        aria-expanded={openOptionsOrderId === order.id}
                        aria-label="추가옵션"
                        onClick={(e) => {
                          e.stopPropagation();
                          const closing = openOptionsOrderId === order.id;
                          setOpenVideoOptionsOrderId(null);
                          if (closing) {
                            setOpenOptionsOrderId(null);
                            rowDropdownAnchorRef.current = null;
                            setRowDropdownPos(null);
                            return;
                          }
                          rowDropdownAnchorRef.current = e.currentTarget;
                          const r = e.currentTarget.getBoundingClientRect();
                          setRowDropdownPos({
                            top: r.bottom + 6,
                            right: window.innerWidth - r.right,
                          });
                          setOpenOptionsOrderId(order.id);
                        }}
                      >
                        <MoreHorizontal size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="row-options">
                      <button
                        type="button"
                        className="row-options__trigger"
                        aria-haspopup="menu"
                        aria-expanded={openVideoOptionsOrderId === order.id}
                        aria-label="영상"
                        onClick={(e) => {
                          e.stopPropagation();
                          const closing = openVideoOptionsOrderId === order.id;
                          setOpenOptionsOrderId(null);
                          if (closing) {
                            setOpenVideoOptionsOrderId(null);
                            rowDropdownAnchorRef.current = null;
                            setRowDropdownPos(null);
                            return;
                          }
                          rowDropdownAnchorRef.current = e.currentTarget;
                          const r = e.currentTarget.getBoundingClientRect();
                          setRowDropdownPos({
                            top: r.bottom + 6,
                            right: window.innerWidth - r.right,
                          });
                          setOpenVideoOptionsOrderId(order.id);
                        }}
                      >
                        <MoreHorizontal size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      aria-label="주문 삭제"
                      title="Delete"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="order-table-pagination">
          <div className="pagination-inner">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              aria-label="첫 페이지"
            >
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={currentPage === page ? 'active' : ''}
                onClick={() => setCurrentPage(page)}
              >
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
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              aria-label="마지막 페이지"
            >
              &raquo;
            </button>
          </div>
        </div>
      </section>

      {portalOptionsOrder &&
        rowDropdownPos &&
        createPortal(
          <div
            className="row-options__menu-portal"
            role="menu"
            style={{
              position: 'fixed',
              top: rowDropdownPos.top,
              right: rowDropdownPos.right,
              zIndex: 10000,
            }}
          >
            <button
              type="button"
              className="row-options__item"
              role="menuitem"
              onClick={() => handleOptionMenuClick(portalOptionsOrder.id, 'makerService')}
            >
              메이커서비스 {portalOptionsOrder.makerServiceAdded ? '현황보기' : '추가'}
            </button>
            <button
              type="button"
              className="row-options__item"
              role="menuitem"
              onClick={() => handleOptionMenuClick(portalOptionsOrder.id, 'dvd')}
            >
              DVD {portalOptionsOrder.dvdAdded ? '현황보기' : '추가'}
            </button>
            <button
              type="button"
              className="row-options__item"
              role="menuitem"
              onClick={() => handleOptionMenuClick(portalOptionsOrder.id, 'usb')}
            >
              USB {portalOptionsOrder.usbAdded ? '현황보기' : '추가'}
            </button>
          </div>,
          document.body
        )}

      {portalVideoOrder &&
        rowDropdownPos &&
        createPortal(
          <div
            className="row-options__menu-portal"
            role="menu"
            style={{
              position: 'fixed',
              top: rowDropdownPos.top,
              right: rowDropdownPos.right,
              zIndex: 10000,
            }}
          >
            {portalVideoOrder.progress === '제작완료' && (
              <>
                <button
                  type="button"
                  className="row-options__item"
                  role="menuitem"
                  onClick={() => {
                    setVideoPreviewOrderId(portalVideoOrder.id);
                    setOpenVideoOptionsOrderId(null);
                  }}
                >
                  영상확인
                </button>
                <button
                  type="button"
                  className="row-options__item"
                  role="menuitem"
                  onClick={() => {
                    handleVideoDownload(portalVideoOrder);
                    setOpenVideoOptionsOrderId(null);
                  }}
                >
                  영상다운로드
                </button>
              </>
            )}
            <button
              type="button"
              className="row-options__item"
              role="menuitem"
              onClick={() => setOpenVideoOptionsOrderId(null)}
            >
              에디터
            </button>
            <button
              type="button"
              className="row-options__item"
              role="menuitem"
              onClick={() => setOpenVideoOptionsOrderId(null)}
            >
              에디터복사
            </button>
          </div>,
          document.body
        )}

      {optionModal && (() => {
        const order = orders.find((o) => o.id === optionModal.orderId);
        if (!order) return null;

        const modalKey =
          optionModal.type === 'makerService'
            ? ('makerServiceAdded' as const)
            : optionModal.type === 'dvd'
              ? ('dvdAdded' as const)
              : ('usbAdded' as const);

        const label = optionModal.type === 'makerService' ? '메이커서비스' : optionModal.type === 'dvd' ? 'DVD' : 'USB';
        const isAdded = !!order[modalKey];

        return (
          <Modal
            open
            onClose={closeOptionModal}
            ariaLabel={`${label} ${isAdded ? '현황보기' : '추가'}`}
            variant="option"
          >
            <Modal.Header>
              <Modal.Title>
                {label} {isAdded ? '현황보기' : '추가'}
              </Modal.Title>
              <Modal.Close />
            </Modal.Header>

            <Modal.Body>
              {!isAdded ? (
                <>
                  <div className="option-modal__desc">
                    주문 <strong>{order.no}</strong> ({order.noSub})에 <strong>{label}</strong> 옵션을 추가할까요?
                  </div>
                  <div className="option-modal__hint">추가 후에는 “현황보기”로 전환됩니다.</div>
                </>
              ) : (
                <>
                  <div className="option-modal__desc">
                    주문 <strong>{order.no}</strong> ({order.noSub})에 <strong>{label}</strong> 옵션이 이미 추가되어 있습니다.
                  </div>
                  <div className="option-modal__hint">(목업) 여기에서 옵션 상세/상태 정보를 보여주면 됩니다.</div>
                  <div className="option-modal__status-grid">
                    <div className="option-modal__status-row">
                      <span className="option-modal__status-label">상태</span>
                      <span className="option-modal__status-value">추가됨</span>
                    </div>
                    <div className="option-modal__status-row">
                      <span className="option-modal__status-label">등록일</span>
                      <span className="option-modal__status-value">{order.orderDate.slice(0, 10)}</span>
                    </div>
                  </div>
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--ghost"
                onClick={() => closeOptionModal()}
              >
                닫기
              </button>
              {!isAdded && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--primary"
                  onClick={() => confirmOptionAdd(order.id, modalKey)}
                >
                  {label} 추가
                </button>
              )}
            </Modal.Footer>
          </Modal>
        );
      })()}

      {videoPreviewOrderId && (() => {
        const order = orders.find((o) => o.id === videoPreviewOrderId);
        if (!order) return null;

        return (
          <Modal open onClose={closeVideoPreviewModal} ariaLabel="영상 미리보기" variant="option">
            <Modal.Header>
              <Modal.Title>영상 미리보기</Modal.Title>
              <Modal.Close />
            </Modal.Header>

            <Modal.Body>
              <div className="video-preview-modal__desc">
                주문 <strong>{order.no}</strong> ({order.noSub}) - <strong>{order.productName}</strong>
              </div>
              <div className="video-preview-modal__player-wrap">
                <video
                  className="video-preview-modal__player"
                  controls
                  preload="metadata"
                  poster="https://dummyimage.com/1280x720/f3f4f6/6b7280&text=Video+Preview"
                >
                  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                  브라우저가 video 태그를 지원하지 않습니다.
                </video>
              </div>
              <div className="video-preview-modal__hint">
                실제 서비스 연결 전 목업 미리보기 영상입니다.
              </div>
            </Modal.Body>

            <Modal.Footer>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--ghost"
                onClick={closeVideoPreviewModal}
              >
                닫기
              </button>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--primary"
                onClick={() => handleVideoDownload(order)}
              >
                영상다운로드
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      {smsModalOrderId && (() => {
        const order = orders.find((o) => o.id === smsModalOrderId);
        if (!order) return null;
        const byteCount = getUtf8Bytes(smsText);
        const history = smsHistoryByOrderId[order.id] ?? [];

        return (
          <Modal open onClose={closeSmsModal} ariaLabel="문자 발송" variant="sms">
            <Modal.Header>
              <Modal.Title>문자 발송</Modal.Title>
              <Modal.Close />
            </Modal.Header>

            <Modal.Body>
              <div className="sms-modal__content">
                <div className="sms-modal__preview" aria-label="휴대폰 미리보기">
                  <div className="phone-mock">
                    <div className="phone-mock__bezel">
                      <div className="phone-mock__notch" aria-hidden="true" />
                      <div className="phone-mock__screen">
                        <div className="phone-mock__top">
                          <div className="phone-mock__to">To: {order.customerName}</div>
                          <div className="phone-mock__to-sub">{order.customerPhone}</div>
                        </div>
                        <div className="phone-mock__messages" ref={phoneMessagesRef}>
                          {history.map((m, idx) => (
                            <div
                              key={`${order.id}-sms-${idx}`}
                              className="phone-mock__bubble phone-mock__bubble--history"
                            >
                              {m}
                            </div>
                          ))}
                          <div
                            className={`phone-mock__bubble phone-mock__bubble--draft ${smsText.trim() ? '' : 'is-empty'}`}
                          >
                            {smsText.trim() ? smsText : '메시지를 입력하면 이곳에 미리보기가 표시됩니다.'}
                          </div>
                        </div>
                        <div className="phone-mock__composer">
                          <textarea
                            id="sms-text"
                            className="phone-mock__textarea"
                            value={smsText}
                            onChange={(e) => setSmsText(trimToMaxBytes(e.target.value, 80))}
                            placeholder="내용을 입력하세요. (최대 80byte)"
                            rows={2}
                          />
                          <div className={`phone-mock__counter ${byteCount > 80 ? 'is-over' : ''}`}>
                            {byteCount}/80byte
                          </div>
                        </div>
                        <div className="phone-mock__home-indicator" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </Modal.Body>

            <Modal.Footer>
              <button
                type="button"
                className="sms-modal__btn sms-modal__btn--ghost"
                onClick={() => closeSmsModal()}
              >
                닫기
              </button>
              <button
                type="button"
                className="sms-modal__btn sms-modal__btn--primary"
                onClick={() => {
                  if (!smsText.trim()) {
                    window.alert('문자내용을 입력해주세요.');
                    return;
                  }
                  setSmsHistoryByOrderId((prev) => ({
                    ...prev,
                    [order.id]: [...(prev[order.id] ?? []), smsText.trim()],
                  }));
                  window.alert('문자 발송(목업)');
                  closeSmsModal();
                }}
              >
                발송
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      {partnerModalOrderId && (() => {
        const order = orders.find((o) => o.id === partnerModalOrderId);
        if (!order) return null;
        return (
          <Modal open onClose={closePartnerModal} ariaLabel="파트너 변경" variant="option">
            <Modal.Header>
              <Modal.Title>파트너 변경</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <div className="option-modal__status-grid">
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">현재 파트너사</span>
                  <span className="option-modal__status-value">{order.partner}</span>
                </div>
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">변경 파트너사</span>
                  <select
                    className="option-modal__partner-select"
                    value={changedPartner}
                    onChange={(e) => setChangedPartner(e.target.value)}
                  >
                    {PARTNER_CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--ghost"
                onClick={closePartnerModal}
              >
                닫기
              </button>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--primary"
                onClick={() => confirmPartnerChange(order.id)}
              >
                변경 저장
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      {paymentModalOrderId && (() => {
        const order = orders.find((o) => o.id === paymentModalOrderId);
        if (!order) return null;
        const isUnpaid = order.paymentStatus === '결제전';
        const isCanceled = order.paymentStatus === '결제취소됨';

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
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="option-modal__btn option-modal__btn--danger">
                주문취소
              </button>
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
                  onClick={() => confirmPayment(order.id)}
                >
                  결제처리
                </button>
              )}
            </Modal.Footer>
          </Modal>
        );
      })()}

      {amountChangeModalOrderId && (() => {
        const order = orders.find((o) => o.id === amountChangeModalOrderId);
        if (!order) return null;

        return (
          <Modal open onClose={closeAmountChangeModal} ariaLabel="금액변경" variant="option">
            <Modal.Header>
              <Modal.Title>금액변경</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <div className="option-modal__status-grid">
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">현재금액</span>
                  <span className="option-modal__status-value">{order.amount.toLocaleString()}원</span>
                </div>
                <div className="option-modal__status-row">
                  <label className="option-modal__status-label" htmlFor="changed-amount">
                    변경 금액
                  </label>
                  <input
                    id="changed-amount"
                    className="option-modal__amount-input"
                    type="number"
                    min={0}
                    step={100}
                    value={changedAmount}
                    onChange={(e) => setChangedAmount(e.target.value)}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--ghost"
                onClick={closeAmountChangeModal}
              >
                닫기
              </button>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--primary"
                onClick={() => confirmAmountChange(order.id)}
              >
                변경
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
    </div>
  );
}
