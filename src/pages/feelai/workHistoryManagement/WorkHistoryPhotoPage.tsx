import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, Download, PlayCircle, ShoppingBag } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import ListSelect from '../../../components/ListSelect';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import '../../feelmaker/orderManagement/OrderListPage.css';
import '../tokenManagement/TokenStorePage.css';
import './WorkHistoryPhotoPage.css';
import { buildWeeklyStatusStats } from '../tokenManagement/weeklyStatusStats';
import {
  MOCK_WORK_HISTORY_PHOTO_ITEMS,
  WORK_HISTORY_PHOTO_CHANNELS,
  WORK_HISTORY_PHOTO_PAYMENT_STATUSES,
  WORK_HISTORY_PHOTO_STATUSES,
  type WorkHistoryPhotoItem,
  type WorkHistoryPhotoStatus,
} from './mock/workHistoryPhoto.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '아이디', label: '아이디' },
  { value: '주문번호', label: '주문번호' },
  { value: '연락처', label: '연락처' },
] as const;
type DetailSearchScope = (typeof DETAIL_SEARCH_SCOPE_OPTIONS)[number]['value'];

const STATUS_OPTIONS = [
  { value: '전체', label: '전체' },
  ...WORK_HISTORY_PHOTO_STATUSES.map((status) => ({ value: status, label: status })),
] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];

const PAYMENT_OPTIONS = [
  { value: '전체', label: '전체' },
  ...WORK_HISTORY_PHOTO_PAYMENT_STATUSES.map((status) => ({ value: status, label: status })),
] as const;
type PaymentFilter = (typeof PAYMENT_OPTIONS)[number]['value'];

const STYLE_SERIES = [
  { key: '원본', color: '#98a3b8' },
  { key: '지브리', color: '#22c55e' },
  { key: '픽사', color: '#3b82f6' },
  { key: '디즈니', color: '#f59e0b' },
  { key: '치비', color: '#a855f7' },
] as const;

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: DetailSearchScope;
  keyword: string;
  status: StatusFilter;
  paymentStatus: PaymentFilter;
};

type AppliedChipKey = 'date' | 'keyword' | 'status' | 'paymentStatus';

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
    search.status === '전체' &&
    search.paymentStatus === '전체'
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

function applyFilters(items: WorkHistoryPhotoItem[], applied: AppliedSearch | null): WorkHistoryPhotoItem[] {
  if (!applied) return items;
  return items.filter((item) => {
    if (!isInCustomDateRange(item.createdAt, applied.startDate, applied.endDate)) return false;
    if (applied.status !== '전체' && item.status !== applied.status) return false;
    if (applied.paymentStatus !== '전체' && item.paymentStatus !== applied.paymentStatus) return false;

    const keyword = applied.keyword.trim().toLowerCase();
    if (!keyword) return true;

    const phoneKeyword = keyword.replace(/[^0-9]/g, '');
    const matchName = item.customerName.toLowerCase().includes(keyword);
    const matchId = item.customerId.toLowerCase().includes(keyword);
    const matchOrderNo = item.orderNo.toLowerCase().includes(keyword);
    const matchPhone = Boolean(phoneKeyword) && item.customerPhone.replace(/[^0-9]/g, '').includes(phoneKeyword);

    switch (applied.conditionType) {
      case '이름':
        return matchName;
      case '아이디':
        return matchId;
      case '주문번호':
        return matchOrderNo;
      case '연락처':
        return matchPhone;
      default:
        return matchName || matchId || matchOrderNo || matchPhone;
    }
  });
}

function getStatusClasses(status: WorkHistoryPhotoStatus) {
  if (status === '생성완료') {
    return { rowBtn: 'row-btn--status-secondary', progress: 'progress-status--secondary' };
  }
  if (status === '생성중') {
    return { rowBtn: 'row-btn--status-blue', progress: 'progress-status--blue' };
  }
  return { rowBtn: 'row-btn--status-danger', progress: 'progress-status--danger' };
}

function DatePickerFooter({ onToday, onClose }: { onToday: () => void; onClose: () => void }) {
  return (
    <div className="react-datepicker-custom-footer">
      <button type="button" className="datepicker-footer-btn datepicker-footer-btn--today" onClick={onToday}>
        오늘
      </button>
      <button type="button" className="datepicker-footer-btn datepicker-footer-btn--close" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}

export default function WorkHistoryPhotoPage() {
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conditionType, setConditionType] = useState<DetailSearchScope>('전체');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('전체');
  const [paymentStatus, setPaymentStatus] = useState<PaymentFilter>('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const items = MOCK_WORK_HISTORY_PHOTO_ITEMS;
  const filteredItems = useMemo(() => applyFilters(items, appliedSearch), [items, appliedSearch]);
  const summarySourceHint = appliedSearch ? '현재 검색 기준' : '총 누적';

  const filteredSummary = useMemo(() => {
    const channelCounts = Object.fromEntries(WORK_HISTORY_PHOTO_CHANNELS.map((channel) => [channel, 0])) as Record<
      (typeof WORK_HISTORY_PHOTO_CHANNELS)[number],
      number
    >;
    let totalAmount = 0;

    for (const item of filteredItems) {
      totalAmount += item.amount;
      channelCounts[item.channel] += 1;
    }

    return {
      totalCount: filteredItems.length,
      totalAmount,
      channelCounts,
    };
  }, [filteredItems]);

  const weeklyStyleStats = useMemo(
    () =>
      buildWeeklyStatusStats(
        filteredItems,
        (item) => parseDateTime(item.createdAt),
        (item) => item.style,
        STYLE_SERIES.map((series) => series.key)
      ),
    [filteredItems]
  );

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      status,
      paymentStatus,
    };
    setAppliedSearch(isAppliedSearchEmpty(nextAppliedSearch) ? null : nextAppliedSearch);
    setCurrentPage(1);
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
      case 'status':
        setStatus('전체');
        next.status = '전체';
        break;
      case 'paymentStatus':
        setPaymentStatus('전체');
        next.paymentStatus = '전체';
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
      chips.push({
        key: 'date',
        label: `생성일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `생성일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }

    if (appliedSearch.status !== '전체') {
      chips.push({ key: 'status', label: `작업현황: ${appliedSearch.status}` });
    }
    if (appliedSearch.paymentStatus !== '전체') {
      chips.push({ key: 'paymentStatus', label: `결제현황: ${appliedSearch.paymentStatus}` });
    }

    return chips;
  }, [appliedSearch]);

  return (
    <div className="admin-list-page admin-list-page--work-history-photo">
      <h1 className="page-title">모션포토 작업내역</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="모션포토 작업내역 요약">
        <div className="admin-stat-cards admin-stat-cards--work-history-photo">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <ShoppingBag size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">총 주문수</p>
            <p className="admin-stat-value">
              {filteredSummary.totalCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <CircleDollarSign size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">총 주문금액</p>
            <p className="admin-stat-value">
              {filteredSummary.totalAmount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">원</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <PlayCircle size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">사용수</p>
            <div className="admin-stat-card__dual admin-stat-card__dual--row" aria-label="채널별 사용수">
              {WORK_HISTORY_PHOTO_CHANNELS.map((channel) => (
                <div key={channel}>
                  <p className="admin-stat-label">{channel}</p>
                  <p className="admin-stat-value">
                    {filteredSummary.channelCounts[channel].toLocaleString('ko-KR')}
                    <span className="admin-stat-value__suffix">건</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>

          <div className="admin-stat-card admin-stat-card--chart">
            <div className="admin-stat-card__body">
              <div className="admin-stat-card__content">
                <p className="admin-stat-label admin-stat-label--title">사용된 스타일</p>
                <p className="admin-stat-hint">일주일별</p>
                <div className="token-store-chart-legend" aria-hidden>
                  {STYLE_SERIES.map((series) => (
                    <span key={series.key} className="token-store-chart-legend__item">
                      <span className="token-store-chart-legend__dot" style={{ background: series.color }} />
                      {series.key}
                    </span>
                  ))}
                </div>
              </div>
              <div className="admin-stat-card__chart" aria-label="사용된 스타일 일주일별 그래프">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStyleStats} barCategoryGap={2} barGap={0}>
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
                    {STYLE_SERIES.map((series) => (
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
            <span className="filter-label">생성일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="생성일 프리셋"
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
                      <DatePickerFooter onToday={() => setStartDate(new Date())} onClose={() => setStartDateOpen(false)} />
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
                      <DatePickerFooter onToday={() => setEndDate(new Date())} onClose={() => setEndDateOpen(false)} />
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
            <span className="filter-label">작업현황</span>
            <ListSelect
              ariaLabel="작업현황"
              value={status}
              onChange={(next) => setStatus(next as StatusFilter)}
              options={[...STATUS_OPTIONS]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">결제현황</span>
            <ListSelect
              ariaLabel="결제현황"
              value={paymentStatus}
              onChange={(next) => setPaymentStatus(next as PaymentFilter)}
              options={[...PAYMENT_OPTIONS]}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="모션포토 작업내역 리스트">
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
          <table className="admin-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th className="col-center">작업현황</th>
                <th>생성일</th>
                <th className="col-center">스타일</th>
                <th>고객정보</th>
                <th className="col-center">누적사용수</th>
                <th>사용토큰</th>
                <th>API 비용</th>
                <th className="col-center">미리보기</th>
                <th className="col-center">다운로드</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const statusClasses = getStatusClasses(item.status);
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="cell-line">{item.orderNo}</span>
                    </td>
                    <td className="col-center">
                      <span className={['row-btn', statusClasses.rowBtn].join(' ')}>
                        <span className={['progress-status', statusClasses.progress].join(' ')}>
                          <span className="progress-status__dot" aria-hidden="true" />
                          <span className="progress-status__text">{item.status}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="cell-line">{item.createdAt}</span>
                    </td>
                    <td className="col-center">
                      <span className="cell-line">{item.style}</span>
                    </td>
                    <td>
                      <div className="admin-cell-triple">
                        <span className="cell-line">{item.customerId}</span>
                        <span className="cell-line">{item.customerName}</span>
                        <span className="cell-line">{item.customerPhone}</span>
                      </div>
                    </td>
                    <td className="col-center">
                      <span className="cell-line">{item.cumulativeUsage.toLocaleString('ko-KR')}회</span>
                    </td>
                    <td>
                      <span className="cell-line text-warning">{item.usedTokens.toLocaleString('ko-KR')} tk</span>
                    </td>
                    <td>
                      <span className="amount-red">{item.apiCost.toLocaleString('ko-KR')}원</span>
                    </td>
                    <td className="col-center">
                      {item.previewUrl ? (
                        <button
                          type="button"
                          className="row-btn row-btn--default"
                          aria-label={`${item.orderNo} 미리보기`}
                          onClick={() => window.open(item.previewUrl!, '_blank', 'noopener,noreferrer')}
                        >
                          미리보기
                        </button>
                      ) : (
                        <span className="cell-line">-</span>
                      )}
                    </td>
                    <td className="col-center">
                      {item.downloadUrl ? (
                        <button
                          type="button"
                          className="row-btn row-btn--default"
                          aria-label={`${item.orderNo} 다운로드`}
                          onClick={() => window.open(item.downloadUrl!, '_blank', 'noopener,noreferrer')}
                        >
                          <Download size={14} aria-hidden />
                          다운로드
                        </button>
                      ) : (
                        <span className="cell-line">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="admin-table-empty-cell">
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
              {getVisiblePageNumbers(currentPage, totalPages).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`${page}페이지`}
                  aria-current={page === currentPage ? 'page' : undefined}
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
    </div>
  );
}
