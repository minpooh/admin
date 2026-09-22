import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import { createPortal } from 'react-dom';
import { CircleDollarSign, Coins, Mail, ShoppingBag } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import '../../../styles/adminPage.css';
import '../../feelmaker/orderManagement/OrderListPage.css';
import './TokenStorePage.css';
import './TokenMakerPage.css';
import {
  getChargeGradeShortName,
  MOCK_TOKEN_MAKER_ORDERS,
  type TokenMakerMemoEntry,
  type TokenMakerOrderItem,
  type TokenMakerPaymentStatus,
  type TokenMakerTokenAccrualStatus,
} from './mock/tokenMaker.mock';
import TokenPurchaseHistoryModal from './TokenPurchaseHistoryModal';
import { formatPurchaseCountLabel, getTokenPurchaseModalDataFromMaker } from './tokenPurchaseHistory';
import { buildWeeklyStatusStats } from './weeklyStatusStats';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: '이름', label: '이름' },
  { value: '전화번호', label: '전화번호' },
  { value: '아이디', label: '아이디' },
  { value: '주문번호', label: '주문번호' },
  { value: '상품명', label: '상품명' },
  { value: 'PG거래번호', label: 'PG거래번호' },
  { value: '작업아이디', label: '작업아이디' },
] as const;
type DetailSearchScope = (typeof DETAIL_SEARCH_SCOPE_OPTIONS)[number]['value'];

const PAYMENT_STATUS_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '결제완료', label: '결제완료' },
  { value: '결제전', label: '결제전' },
  { value: '실패', label: '실패' },
  { value: '취소', label: '취소' },
] as const;
type PaymentStatus = (typeof PAYMENT_STATUS_OPTIONS)[number]['value'];

const PAYMENT_METHOD_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '카드결제(NICE)', label: '카드결제(NICE)' },
  { value: '카카오페이(포트원)', label: '카카오페이(포트원)' },
  { value: '실시간계좌이체(포트원)', label: '실시간계좌이체(포트원)' },
] as const;
type PaymentMethod = (typeof PAYMENT_METHOD_OPTIONS)[number]['value'];

const CHARGE_GRADE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: 'Lite (9,900원 / 300tk)', label: 'Lite (9,900원 / 300tk)' },
  { value: 'Plus (29,000원 / 1,000tk)', label: 'Plus (29,000원 / 1,000tk)' },
  { value: 'Pro (49,000원 / 1,800tk)', label: 'Pro (49,000원 / 1,800tk)' },
  { value: 'Max (99,000원 / 4,000tk)', label: 'Max (99,000원 / 4,000tk)' },
] as const;
type ChargeGrade = (typeof CHARGE_GRADE_OPTIONS)[number]['value'];

const CURRENT_LOGIN_AUTHOR = '관리자';

const PAYMENT_STATUS_SERIES = [
  { key: '결제완료', color: '#22c55e' },
  { key: '결제전', color: '#f59e0b' },
  { key: '실패', color: '#ff4c51' },
  { key: '취소', color: '#98a3b8' },
] as const;

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: DetailSearchScope;
  keyword: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  chargeGrade: ChargeGrade;
};

type AppliedChipKey = 'date' | 'keyword' | 'paymentStatus' | 'paymentMethod' | 'chargeGrade';

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

function formatYmd(date: Date | null) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isAppliedSearchEmpty(search: AppliedSearch | null) {
  if (!search) return true;
  return (
    !search.dateRange &&
    search.startDate == null &&
    search.endDate == null &&
    !search.keyword.trim() &&
    search.paymentStatus === '전체' &&
    search.paymentMethod === '전체' &&
    search.chargeGrade === '전체'
  );
}

function parseDateTime(value: string): Date {
  const dateStr = value.replace(/\/$/, '').trim().slice(0, 19);
  return new Date(dateStr.replace(' ', 'T'));
}

function isInCustomDateRange(dateValue: string, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const date = parseDateTime(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  if (start) {
    const rangeStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (date < rangeStart) return false;
  }
  if (end) {
    const rangeEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
    if (date > rangeEnd) return false;
  }
  return true;
}

function applyFilters(orders: TokenMakerOrderItem[], applied: AppliedSearch | null): TokenMakerOrderItem[] {
  if (!applied) return orders;
  return orders.filter((order) => {
    if (!isInCustomDateRange(order.orderedAt, applied.startDate, applied.endDate)) return false;
    if (applied.paymentStatus !== '전체' && order.paymentStatus !== applied.paymentStatus) return false;
    if (applied.paymentMethod !== '전체' && order.paymentMethod !== applied.paymentMethod) return false;
    if (applied.chargeGrade !== '전체' && order.chargeGrade !== applied.chargeGrade) return false;

    const keyword = applied.keyword.trim().toLowerCase();
    if (!keyword) return true;

    const phoneKeyword = keyword.replace(/[^0-9]/g, '');
    const matchName = order.customerName.toLowerCase().includes(keyword);
    const matchPhone = Boolean(phoneKeyword) && order.customerPhone.replace(/[^0-9]/g, '').includes(phoneKeyword);
    const matchId = order.customerId.toLowerCase().includes(keyword);
    const matchOrderNo = order.orderNo.toLowerCase().includes(keyword);
    const matchProduct = order.productName.toLowerCase().includes(keyword);
    const matchPg = order.pgTransactionNo.toLowerCase().includes(keyword);
    const matchWorkId = order.workId.toLowerCase().includes(keyword);

    switch (applied.conditionType) {
      case '이름':
        return matchName;
      case '전화번호':
        return matchPhone;
      case '아이디':
        return matchId;
      case '주문번호':
        return matchOrderNo;
      case '상품명':
        return matchProduct;
      case 'PG거래번호':
        return matchPg;
      case '작업아이디':
        return matchWorkId;
      default:
        return matchName || matchPhone || matchId || matchOrderNo || matchProduct || matchPg || matchWorkId;
    }
  });
}

function getPurchaseCountClassName(count: number) {
  return count <= 0 ? 'row-btn--gray' : 'row-btn--primary';
}

function getPaymentStatusClasses(status: TokenMakerPaymentStatus) {
  if (status === '결제완료') {
    return { rowBtn: 'row-btn--status-secondary', progress: 'progress-status--secondary' };
  }
  if (status === '실패' || status === '취소') {
    return { rowBtn: 'row-btn--status-danger', progress: 'progress-status--danger' };
  }
  return { rowBtn: 'row-btn--status-warning', progress: 'progress-status--warning' };
}

function getTokenAccrualStatusClasses(status: TokenMakerTokenAccrualStatus) {
  if (status === '적립완료') {
    return { rowBtn: 'row-btn--status-secondary', progress: 'progress-status--secondary' };
  }
  if (status === '적립취소') {
    return { rowBtn: 'row-btn--status-danger', progress: 'progress-status--danger' };
  }
  return { rowBtn: 'row-btn--status-warning', progress: 'progress-status--warning' };
}

function getUtf8Bytes(text: string) {
  return new TextEncoder().encode(text).length;
}

function trimToMaxBytes(text: string, maxBytes: number) {
  if (getUtf8Bytes(text) <= maxBytes) return text;
  let out = '';
  for (const ch of text) {
    const next = out + ch;
    if (getUtf8Bytes(next) > maxBytes) break;
    out = next;
  }
  return out;
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

export default function TokenMakerPage() {
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conditionType, setConditionType] = useState<DetailSearchScope>('이름');
  const [keyword, setKeyword] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('전체');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('전체');
  const [chargeGrade, setChargeGrade] = useState<ChargeGrade>('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<TokenMakerOrderItem[]>(() => [...MOCK_TOKEN_MAKER_ORDERS]);
  const [smsModalOrderId, setSmsModalOrderId] = useState<string | null>(null);
  const [smsText, setSmsText] = useState('');
  const [smsHistoryByOrderId, setSmsHistoryByOrderId] = useState<Record<string, string[]>>({});
  const phoneMessagesRef = useRef<HTMLDivElement | null>(null);
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(null);
  const [purchaseModalOrderId, setPurchaseModalOrderId] = useState<string | null>(null);
  const [memoModalOrderId, setMemoModalOrderId] = useState<string | null>(null);
  const [memoTooltipOrderId, setMemoTooltipOrderId] = useState<string | null>(null);
  const [memoTooltipPosition, setMemoTooltipPosition] = useState<{ top: number; right: number } | null>(null);
  const memoTooltipAnchorRef = useRef<HTMLElement | null>(null);
  const [memoInput, setMemoInput] = useState('');

  const filteredOrders = useMemo(() => applyFilters(orders, appliedSearch), [orders, appliedSearch]);
  const summarySourceHint = appliedSearch ? '현재 검색 기준' : '총 누적';
  const filteredSummary = useMemo(() => {
    return filteredOrders.reduce(
      (summary, order) => {
        if (order.paymentStatus === '결제완료') {
          summary.paidAmount += order.amount;
        }
        if (order.tokenAccrualStatus === '적립완료') {
          summary.grantedTokens += order.chargeTokenAmount;
        }
        return summary;
      },
      {
        orderCount: filteredOrders.length,
        paidAmount: 0,
        grantedTokens: 0,
      }
    );
  }, [filteredOrders]);
  const weeklyPaymentStats = useMemo(
    () =>
      buildWeeklyStatusStats(
        filteredOrders,
        (order) => parseDateTime(order.orderedAt),
        (order) => order.paymentStatus,
        PAYMENT_STATUS_SERIES.map((series) => series.key)
      ),
    [filteredOrders]
  );
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);
  const smsHistoryLen = smsModalOrderId ? (smsHistoryByOrderId[smsModalOrderId]?.length ?? 0) : 0;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      queueMicrotask(() => {
        setCurrentPage(totalPages);
      });
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentPage(1);
    });
  }, [appliedSearch]);

  useEffect(() => {
    if (!smsModalOrderId) return;
    const el = phoneMessagesRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [smsModalOrderId, smsHistoryLen, smsText]);

  const closeSmsModal = () => {
    setSmsModalOrderId(null);
    setSmsText('');
  };

  const closePaymentModal = () => setPaymentModalOrderId(null);
  const closePurchaseModal = () => setPurchaseModalOrderId(null);

  const confirmPayment = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              paymentStatus: '결제완료',
              paidAt: order.paidAt ?? formatDateTimeNow(),
            }
          : order
      )
    );
    setPaymentModalOrderId(null);
  };

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      paymentStatus,
      paymentMethod,
      chargeGrade,
    };
    setAppliedSearch(isAppliedSearchEmpty(nextAppliedSearch) ? null : nextAppliedSearch);
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
        setConditionType('이름');
        next.keyword = '';
        next.conditionType = '이름';
        break;
      case 'paymentStatus':
        setPaymentStatus('전체');
        next.paymentStatus = '전체';
        break;
      case 'paymentMethod':
        setPaymentMethod('전체');
        next.paymentMethod = '전체';
        break;
      case 'chargeGrade':
        setChargeGrade('전체');
        next.chargeGrade = '전체';
        break;
      default:
        break;
    }

    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
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

    if (appliedSearch.paymentStatus !== '전체') {
      chips.push({ key: 'paymentStatus', label: `결제현황: ${appliedSearch.paymentStatus}` });
    }
    if (appliedSearch.paymentMethod !== '전체') {
      chips.push({ key: 'paymentMethod', label: `결제수단: ${appliedSearch.paymentMethod}` });
    }
    if (appliedSearch.chargeGrade !== '전체') {
      chips.push({ key: 'chargeGrade', label: `충전등급: ${appliedSearch.chargeGrade}` });
    }

    return chips;
  }, [appliedSearch]);

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
    if (!memoTooltipOrderId) return;
    updateMemoTooltipPosition();
    window.addEventListener('scroll', updateMemoTooltipPosition, true);
    window.addEventListener('resize', updateMemoTooltipPosition);
    return () => {
      window.removeEventListener('scroll', updateMemoTooltipPosition, true);
      window.removeEventListener('resize', updateMemoTooltipPosition);
    };
  }, [memoTooltipOrderId]);

  const showMemoTooltip = (orderId: string, triggerElement: HTMLElement) => {
    memoTooltipAnchorRef.current = triggerElement;
    setMemoTooltipOrderId(orderId);
  };

  const hideMemoTooltip = () => {
    setMemoTooltipOrderId(null);
    setMemoTooltipPosition(null);
    memoTooltipAnchorRef.current = null;
  };

  const closeMemoModal = () => {
    setMemoModalOrderId(null);
    setMemoInput('');
  };

  const openMemoModal = (orderId: string) => {
    hideMemoTooltip();
    setMemoModalOrderId(orderId);
    setMemoInput('');
  };

  const addMemo = (orderId: string) => {
    const content = memoInput.trim();
    if (!content) return;

    const nextMemo: TokenMakerMemoEntry = {
      id: `memo-${Date.now()}`,
      author: CURRENT_LOGIN_AUTHOR,
      content,
      createdAt: formatDateTimeNow(),
    };

    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, memo: [...order.memo, nextMemo] } : order))
    );
    setMemoInput('');
  };

  const deleteMemo = (orderId: string, memoId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, memo: order.memo.filter((memo) => memo.id !== memoId) } : order
      )
    );
  };

  return (
    <div className="admin-list-page admin-list-page--token-store admin-list-page--token-maker">
      <h1 className="page-title">메이커 토큰 주문</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="메이커 토큰 주문 요약">
        <div className="admin-stat-cards admin-stat-cards--token-store">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <ShoppingBag size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">총 주문</p>
            <p className="admin-stat-value">{filteredSummary.orderCount.toLocaleString('ko-KR')}</p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <CircleDollarSign size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">결제완료 금액</p>
            <p className="admin-stat-value">
              {filteredSummary.paidAmount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">원</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <Coins size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">지급된 토큰량</p>
            <p className="admin-stat-value">
              {filteredSummary.grantedTokens.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">토큰</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card admin-stat-card--chart">
            <div className="admin-stat-card__body">
              <div className="admin-stat-card__content">
                <p className="admin-stat-label admin-stat-label--title">결제현황</p>
                <p className="admin-stat-hint">일주일별</p>
                <div className="token-store-chart-legend" aria-hidden>
                  {PAYMENT_STATUS_SERIES.map((series) => (
                    <span key={series.key} className="token-store-chart-legend__item">
                      <span className="token-store-chart-legend__dot" style={{ background: series.color }} />
                      {series.key}
                    </span>
                  ))}
                </div>
              </div>
              <div className="admin-stat-card__chart" aria-label="결제현황 일주일별 그래프">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyPaymentStats} barCategoryGap={2} barGap={0}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={6} />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        return (
                          <div className="admin-stat-card__chart-tooltip">
                            <p className="admin-stat-card__chart-tooltip-day">{label}</p>
                            {payload.map((item) => (
                              <p key={String(item.dataKey)} className="admin-stat-card__chart-tooltip-value">
                                <span
                                  className="admin-stat-card__chart-tooltip-dot"
                                  style={{ background: String(item.color) }}
                                />
                                {item.name}: <strong>{Number(item.value ?? 0).toLocaleString('ko-KR')}</strong>
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    {PAYMENT_STATUS_SERIES.map((series) => (
                      <Bar
                        key={series.key}
                        dataKey={series.key}
                        fill={series.color}
                        radius={[8, 8, 8, 8]}
                        barSize={9}
                        className="admin-stat-card__chart-bar"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-list-box" aria-label="검색 필터">
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
                  ...DATE_RANGES.map((range) => ({ value: range, label: range })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => {
                    setStartDate(date);
                    setStartDateOpen(false);
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
                    <div className={`${className ?? ''} admin-list-datepicker-container`.trim()}>
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
                    <div className={`${className ?? ''} admin-list-datepicker-container`.trim()}>
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
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={conditionType}
                onChange={(next) => setConditionType(next as DetailSearchScope)}
                options={[...DETAIL_SEARCH_SCOPE_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
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
            <span className="filter-label">결제현황</span>
            <ListSelect
              ariaLabel="결제현황"
              value={paymentStatus}
              onChange={(next) => setPaymentStatus(next as PaymentStatus)}
              options={[...PAYMENT_STATUS_OPTIONS]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">결제수단</span>
            <ListSelect
              ariaLabel="결제수단"
              value={paymentMethod}
              onChange={(next) => setPaymentMethod(next as PaymentMethod)}
              options={[...PAYMENT_METHOD_OPTIONS]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">충전등급</span>
            <ListSelect
              ariaLabel="충전등급"
              value={chargeGrade}
              onChange={(next) => setChargeGrade(next as ChargeGrade)}
              options={[...CHARGE_GRADE_OPTIONS]}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="메이커 토큰 주문 리스트">
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
          <table className="admin-table admin-table--min-w-1024">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문일/결제일</th>
                <th className="col-center">고객정보</th>
                <th className="col-center">누적구매수</th>
                <th className="col-center">등급/충전량</th>
                <th className="col-center">결제현황</th>
                <th>결제금액</th>
                <th className="col-center">토큰적립현황</th>
                <th>작업아이디</th>
                <th className="col-center">메모</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const paymentClasses = getPaymentStatusClasses(order.paymentStatus);
                const accrualClasses = getTokenAccrualStatusClasses(order.tokenAccrualStatus);
                const purchaseCount = getTokenPurchaseModalDataFromMaker(order).summary.totalCount;
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{order.orderNo}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-block cell-block--channels">
                        <span className="cell-line">
                          <span className="list-label">주문</span>{' '}
                          <span className="list-value">{order.orderedAt}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">결제</span>{' '}
                          <span className="list-value">{order.paidAt ?? '-'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="admin-cell-triple">
                        <span className="cell-line">{order.customerName}</span>
                        <span className="cell-line">{order.customerId}</span>
                        <div className="phone-with-sms admin-cell-triple__phone-row">
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
                        <span className="cell-line">
                          <span className="list-label">현재</span>{' '}
                          <span className="list-value">{order.tokenBalance.toLocaleString('ko-KR')}토큰</span>
                        </span>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <button
                          type="button"
                          className={['row-btn', getPurchaseCountClassName(purchaseCount)].join(' ')}
                          onClick={() => setPurchaseModalOrderId(order.id)}
                        >
                          {formatPurchaseCountLabel(purchaseCount)}
                        </button>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <span className="cell-line">{getChargeGradeShortName(order.chargeGrade)}</span>
                        <span className="badge-square badge-square--inline badge-square--warning badge-square--no-transition badge-square--no-margin">
                          {order.chargeTokenAmount.toLocaleString('ko-KR')}토큰
                        </span>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <button
                          type="button"
                          className={['row-btn', paymentClasses.rowBtn].join(' ')}
                          onClick={() => setPaymentModalOrderId(order.id)}
                        >
                          <span className={['progress-status', paymentClasses.progress].join(' ')}>
                            <span className="progress-status__dot" aria-hidden="true" />
                            <span className="progress-status__text">{order.paymentStatus}</span>
                          </span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="amount-red">{order.amount.toLocaleString('ko-KR')}원</span>
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <button type="button" className={['row-btn', accrualClasses.rowBtn].join(' ')}>
                          <span className={['progress-status', accrualClasses.progress].join(' ')}>
                            <span className="progress-status__dot" aria-hidden="true" />
                            <span className="progress-status__text">{order.tokenAccrualStatus}</span>
                          </span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="cell-line">{order.workId}</span>
                    </td>
                    <td className="col-center">
                      <div
                        className="admin-memo-trigger"
                        onMouseEnter={(e) => {
                          if (order.memo.length === 0) return;
                          showMemoTooltip(order.id, e.currentTarget);
                        }}
                        onMouseLeave={hideMemoTooltip}
                        onFocus={(e) => {
                          if (order.memo.length === 0) return;
                          showMemoTooltip(order.id, e.currentTarget);
                        }}
                        onBlur={hideMemoTooltip}
                      >
                        <button
                          type="button"
                          className={`row-btn ${order.memo.length > 0 ? 'row-btn--red' : 'row-btn--default'}`}
                          onClick={() => openMemoModal(order.id)}
                        >
                          {order.memo.length > 0 ? '메모 확인' : '메모 작성'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>
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
                onClick={() => setCurrentPage((page) => jumpPageBack(page))}
                disabled={currentPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage <= 1}
                aria-label="이전 페이지"
              >
                &lsaquo;
              </button>
              {getVisiblePageNumbers(totalPages, currentPage).map((page) => (
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
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => jumpPageForward(page, totalPages))}
                disabled={currentPage >= totalPages}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      {smsModalOrderId &&
        (() => {
          const order = orders.find((item) => item.id === smsModalOrderId);
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
                            {history.map((message, idx) => (
                              <div
                                key={`${order.id}-sms-${idx}`}
                                className="phone-mock__bubble phone-mock__bubble--history"
                              >
                                {message}
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
                <button type="button" className="sms-modal__btn sms-modal__btn--ghost" onClick={closeSmsModal}>
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

      {paymentModalOrderId &&
        (() => {
          const order = orders.find((item) => item.id === paymentModalOrderId);
          if (!order) return null;
          const isUnpaid = order.paymentStatus === '결제전';
          const isCanceled = order.paymentStatus === '취소' || order.paymentStatus === '실패';

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
                <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closePaymentModal}>
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

      {purchaseModalOrderId &&
        (() => {
          const order = orders.find((item) => item.id === purchaseModalOrderId);
          if (!order) return null;
          const data = getTokenPurchaseModalDataFromMaker(order);

          return (
            <TokenPurchaseHistoryModal
              onClose={closePurchaseModal}
              profile={data.profile}
              items={data.items}
              summary={data.summary}
            />
          );
        })()}

      {memoModalOrderId &&
        (() => {
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
                  {order.memo.length === 0 ? (
                    <p className="admin-memo-history__empty">등록된 메모가 없습니다.</p>
                  ) : (
                    <ul className="admin-memo-history__list">
                      {[...order.memo].reverse().map((memo) => (
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

      {memoTooltipOrderId &&
        memoTooltipPosition &&
        (() => {
          const order = orders.find((item) => item.id === memoTooltipOrderId);
          if (!order || order.memo.length === 0) return null;

          return createPortal(
            <div
              className="admin-memo-floating-tooltip"
              role="tooltip"
              style={{ top: memoTooltipPosition.top, right: memoTooltipPosition.right }}
            >
              <ul className="admin-memo-history__list">
                {[...order.memo].reverse().map((memo) => (
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
