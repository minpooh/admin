import { useEffect, useMemo, useRef, useState } from 'react';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
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
import {
  MOCK_TOKEN_STORE_ORDERS,
  TOKEN_STORE_CHARGE_STATUSES,
  type TokenStoreChargeStatus,
  type TokenStoreOrderItem,
} from './mock/tokenStore.mock';
import TokenPurchaseHistoryModal from './TokenPurchaseHistoryModal';
import { formatPurchaseCountLabel, getTokenPurchaseModalDataFromStore } from './tokenPurchaseHistory';
import { buildWeeklyStatusStats } from './weeklyStatusStats';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '주문번호', label: '주문번호' },
  { value: '주문 아이디', label: '주문 아이디' },
  { value: '아이디', label: '아이디' },
  { value: '전화번호', label: '전화번호' },
  { value: '충전계정', label: '충전계정' },
  { value: '옵션', label: '옵션' },
] as const;
type DetailSearchScope = (typeof DETAIL_SEARCH_SCOPE_OPTIONS)[number]['value'];

const CHARGE_STATUS_OPTIONS = [
  { value: '전체', label: '전체' },
  ...TOKEN_STORE_CHARGE_STATUSES.map((status) => ({ value: status, label: status })),
] as const;
type ChargeStatus = (typeof CHARGE_STATUS_OPTIONS)[number]['value'];

const CHARGE_STATUS_SERIES = [
  { key: '충전완료', color: '#22c55e' },
  { key: '미충전', color: '#f59e0b' },
  { key: '취소회수', color: '#98a3b8' },
  { key: '주문이상', color: '#ff4c51' },
] as const;

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: DetailSearchScope;
  keyword: string;
  chargeStatus: ChargeStatus;
};

type AppliedChipKey = 'date' | 'keyword' | 'chargeStatus';

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
    search.chargeStatus === '전체'
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

function applyFilters(orders: TokenStoreOrderItem[], applied: AppliedSearch | null): TokenStoreOrderItem[] {
  if (!applied) return orders;
  return orders.filter((order) => {
    if (!isInCustomDateRange(order.collectedAt, applied.startDate, applied.endDate)) return false;
    if (applied.chargeStatus !== '전체' && order.chargeStatus !== applied.chargeStatus) return false;

    const keyword = applied.keyword.trim().toLowerCase();
    if (!keyword) return true;

    const phoneKeyword = keyword.replace(/[^0-9]/g, '');
    const matchOrderNo = order.orderNo.toLowerCase().includes(keyword);
    const matchOrderId = order.orderId.toLowerCase().includes(keyword);
    const matchBuyerId = order.buyerId.toLowerCase().includes(keyword);
    const matchBuyerPhone = Boolean(phoneKeyword) && order.buyerPhone.replace(/[^0-9]/g, '').includes(phoneKeyword);
    const matchChargeAccount =
      order.chargeAccountName.toLowerCase().includes(keyword) ||
      order.chargeAccountId.toLowerCase().includes(keyword) ||
      (Boolean(phoneKeyword) && order.chargeAccountPhone.replace(/[^0-9]/g, '').includes(phoneKeyword));
    const matchOption = order.optionName.toLowerCase().includes(keyword);

    switch (applied.conditionType) {
      case '주문번호':
        return matchOrderNo;
      case '주문 아이디':
        return matchOrderId;
      case '아이디':
        return matchBuyerId;
      case '전화번호':
        return matchBuyerPhone;
      case '충전계정':
        return matchChargeAccount;
      case '옵션':
        return matchOption;
      default:
        return matchOrderNo || matchOrderId || matchBuyerId || matchBuyerPhone || matchChargeAccount || matchOption;
    }
  });
}

function getPurchaseCountClassName(count: number) {
  return count <= 0 ? 'row-btn--gray' : 'row-btn--primary';
}

function getChartChargeStatus(status: TokenStoreChargeStatus) {
  return status === '미충전+토큰미적재' ? '미충전' : status;
}

function getChargeStatusClasses(status: TokenStoreChargeStatus) {
  if (status === '충전완료') {
    return { rowBtn: 'row-btn--status-secondary', progress: 'progress-status--secondary' };
  }
  if (status === '취소회수' || status === '주문이상') {
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

export default function TokenStorePage() {
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conditionType, setConditionType] = useState<DetailSearchScope>('전체');
  const [keyword, setKeyword] = useState('');
  const [chargeStatus, setChargeStatus] = useState<ChargeStatus>('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [smsModalOrderId, setSmsModalOrderId] = useState<string | null>(null);
  const [purchaseModalOrderId, setPurchaseModalOrderId] = useState<string | null>(null);
  const [smsText, setSmsText] = useState('');
  const [smsHistoryByOrderId, setSmsHistoryByOrderId] = useState<Record<string, string[]>>({});
  const phoneMessagesRef = useRef<HTMLDivElement | null>(null);

  const orders = MOCK_TOKEN_STORE_ORDERS;
  const filteredOrders = useMemo(() => applyFilters(orders, appliedSearch), [orders, appliedSearch]);
  const summarySourceHint = appliedSearch ? '현재 검색 기준' : '총 누적';
  const filteredSummary = useMemo(() => {
    return filteredOrders.reduce(
      (summary, order) => {
        summary.orderAmount += order.amount;
        if (order.chargeStatus === '충전완료') {
          summary.chargedTokens += order.tokenAmount;
        }
        return summary;
      },
      {
        orderCount: filteredOrders.length,
        orderAmount: 0,
        chargedTokens: 0,
      }
    );
  }, [filteredOrders]);
  const weeklyChargeStats = useMemo(
    () =>
      buildWeeklyStatusStats(
        filteredOrders,
        (order) => parseDateTime(order.collectedAt),
        (order) => getChartChargeStatus(order.chargeStatus),
        CHARGE_STATUS_SERIES.map((series) => series.key)
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

  const closeSmsModal = () => {
    setSmsModalOrderId(null);
    setSmsText('');
  };
  const closePurchaseModal = () => setPurchaseModalOrderId(null);

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

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      chargeStatus,
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
        setConditionType('전체');
        next.keyword = '';
        next.conditionType = '전체';
        break;
      case 'chargeStatus':
        setChargeStatus('전체');
        next.chargeStatus = '전체';
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
        label: `주문 수집일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `주문 수집일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }

    if (appliedSearch.chargeStatus !== '전체') {
      chips.push({ key: 'chargeStatus', label: `충전상태: ${appliedSearch.chargeStatus}` });
    }

    return chips;
  }, [appliedSearch]);

  return (
    <div className="admin-list-page admin-list-page--token-store">
      <h1 className="page-title">스토어 토큰 주문</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="스토어 토큰 주문 요약">
        <div className="admin-stat-cards admin-stat-cards--token-store">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <ShoppingBag size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">스토어 토큰주문 수</p>
            <p className="admin-stat-value">{filteredSummary.orderCount.toLocaleString('ko-KR')}</p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <CircleDollarSign size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">주문금액 합계</p>
            <p className="admin-stat-value">
              {filteredSummary.orderAmount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">원</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <Coins size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">충전된 토큰량</p>
            <p className="admin-stat-value">
              {filteredSummary.chargedTokens.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">토큰</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card admin-stat-card--chart">
            <div className="admin-stat-card__body">
              <div className="admin-stat-card__content">
                <p className="admin-stat-label admin-stat-label--title">충전 현황</p>
                <p className="admin-stat-hint">일주일별</p>
                <div className="token-store-chart-legend" aria-hidden>
                  {CHARGE_STATUS_SERIES.map((series) => (
                    <span key={series.key} className="token-store-chart-legend__item">
                      <span className="token-store-chart-legend__dot" style={{ background: series.color }} />
                      {series.key}
                    </span>
                  ))}
                </div>
              </div>
              <div className="admin-stat-card__chart" aria-label="충전상태 일주일별 그래프">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChargeStats} barCategoryGap={2} barGap={0}>
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
                    {CHARGE_STATUS_SERIES.map((series) => (
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
        <div className="filter-top-row admin-filter-row--equal-4">
          <div className="filter-section">
            <span className="filter-label">주문 수집일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="주문 수집일 프리셋"
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

          <div className="filter-section">
            <span className="filter-label">충전상태</span>
            <ListSelect
              ariaLabel="충전상태"
              value={chargeStatus}
              onChange={(next) => setChargeStatus(next as ChargeStatus)}
              options={[...CHARGE_STATUS_OPTIONS]}
            />
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="스토어 토큰 주문 리스트">
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
                <th>주문일/수집일</th>
                <th className="col-center">구매자</th>
                <th className="col-center">누적구매수</th>
                <th>옵션/토큰</th>
                <th>주문금액</th>
                <th>충전상태</th>
                <th className="col-center">충전계정</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const chargeClasses = getChargeStatusClasses(order.chargeStatus);
                const purchaseCount = getTokenPurchaseModalDataFromStore(order).summary.totalCount;
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{order.orderNo}</span>
                        <span className="cell-line">{order.orderId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-block cell-block--channels">
                        <span className="cell-line">
                          <span className="list-label">주문</span>{' '}
                          <span className="list-value">{order.orderedAt}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">수집</span>{' '}
                          <span className="list-value">{order.collectedAt}</span>
                        </span>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="admin-cell-triple">
                        <span className="cell-line">{order.buyerId}</span>
                        <span className="cell-line">{order.buyerPhone}</span>
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
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{order.optionName}</span>
                        <span className="badge-square badge-square--inline badge-square--warning badge-square--no-transition badge-square--no-margin">
                          {order.tokenAmount.toLocaleString('ko-KR')}토큰
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="amount-red">{order.amount.toLocaleString('ko-KR')}원</span>
                    </td>
                    <td>
                      <div className="cell-block">
                        <button type="button" className={['row-btn', chargeClasses.rowBtn].join(' ')}>
                          <span className={['progress-status', chargeClasses.progress].join(' ')}>
                            <span className="progress-status__dot" aria-hidden="true" />
                            <span className="progress-status__text">{order.chargeStatus}</span>
                          </span>
                        </button>
                        <span className="cell-line">{order.completedAt ?? '-'}</span>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="admin-cell-triple">
                        <span className="cell-line">{order.chargeAccountName}</span>
                        <span className="cell-line">{order.chargeAccountId}</span>
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
                          <span className="phone-with-sms__number">{order.chargeAccountPhone}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedOrders.length === 0 && (
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
                            <div className="phone-mock__to">To: {order.chargeAccountName}</div>
                            <div className="phone-mock__to-sub">{order.chargeAccountPhone}</div>
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

      {purchaseModalOrderId &&
        (() => {
          const order = orders.find((item) => item.id === purchaseModalOrderId);
          if (!order) return null;
          const data = getTokenPurchaseModalDataFromStore(order);

          return (
            <TokenPurchaseHistoryModal
              onClose={closePurchaseModal}
              profile={data.profile}
              items={data.items}
              summary={data.summary}
            />
          );
        })()}
    </div>
  );
}
