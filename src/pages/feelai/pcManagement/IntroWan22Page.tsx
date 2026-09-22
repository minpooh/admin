import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Flame, Layers } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import '../../feelmaker/orderManagement/OrderListPage.css';
import './IntroWan22Page.css';
import {
  INTRO_WAN22_STATUSES,
  MOCK_INTRO_WAN22_ITEMS,
  type IntroWan22Item,
  type IntroWan22Status,
} from './mock/introWan22.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '아이디', label: '아이디' },
  { value: '작업번호', label: '작업번호' },
] as const;
type DetailSearchScope = (typeof DETAIL_SEARCH_SCOPE_OPTIONS)[number]['value'];

const STATUS_OPTIONS = [
  { value: '전체', label: '전체' },
  ...INTRO_WAN22_STATUSES.map((status) => ({ value: status, label: status })),
] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: DetailSearchScope;
  keyword: string;
  status: StatusFilter;
};

type AppliedChipKey = 'date' | 'keyword' | 'status';

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
    search.status === '전체'
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

function applyFilters(items: IntroWan22Item[], applied: AppliedSearch | null): IntroWan22Item[] {
  if (!applied) return items;
  return items.filter((item) => {
    if (!isInCustomDateRange(item.producedAt, applied.startDate, applied.endDate)) return false;
    if (applied.status !== '전체' && item.status !== applied.status) return false;

    const keyword = applied.keyword.trim().toLowerCase();
    if (!keyword) return true;

    const matchId = item.customerId.toLowerCase().includes(keyword);
    const matchWorkNo = item.workNo.toLowerCase().includes(keyword);

    switch (applied.conditionType) {
      case '아이디':
        return matchId;
      case '작업번호':
        return matchWorkNo;
      default:
        return matchId || matchWorkNo;
    }
  });
}

function getStatusClasses(status: IntroWan22Status) {
  if (status === '완료') {
    return { rowBtn: 'row-btn--status-secondary', progress: 'progress-status--secondary' };
  }
  if (status === '생성중') {
    return { rowBtn: 'row-btn--status-blue', progress: 'progress-status--blue' };
  }
  if (status === '실패') {
    return { rowBtn: 'row-btn--status-danger', progress: 'progress-status--danger' };
  }
  return { rowBtn: 'row-btn--status-warning', progress: 'progress-status--warning' };
}

function formatElapsedSeconds(startedAtMs: number, nowMs: number) {
  const elapsed = Math.max(0, (nowMs - startedAtMs) / 1000);
  return `${elapsed.toFixed(2)}초 경과`;
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

export default function IntroWan22Page() {
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conditionType, setConditionType] = useState<DetailSearchScope>('전체');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [producingSlideIndex, setProducingSlideIndex] = useState(1);
  const [producingInstant, setProducingInstant] = useState(false);
  const producingLockedRef = useRef(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const items = MOCK_INTRO_WAN22_ITEMS;
  const producingItems = useMemo(() => items.filter((item) => item.status === '생성중'), [items]);
  const producingCount = producingItems.length;
  const producingLoop = producingCount > 1;
  const producingSlides = useMemo(() => {
    if (producingCount === 0) return [];
    if (!producingLoop) return producingItems;
    return [producingItems[producingCount - 1], ...producingItems, producingItems[0]];
  }, [producingItems, producingCount, producingLoop]);
  const producingDisplayIndex =
    producingCount <= 1
      ? 1
      : producingSlideIndex === 0
        ? producingCount
        : producingSlideIndex === producingCount + 1
          ? 1
          : producingSlideIndex;
  const producingEstimate = producingItems[0]?.estimatedSeconds ?? null;
  const todayKey = formatYmd(new Date());
  const todayCount = useMemo(
    () => items.filter((item) => formatYmd(parseDateTime(item.producedAt)) === todayKey).length,
    [items, todayKey]
  );
  const totalCount = items.length;

  const filteredItems = useMemo(() => applyFilters(items, appliedSearch), [items, appliedSearch]);

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

  useEffect(() => {
    if (producingItems.length === 0) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [producingItems.length]);

  useEffect(() => {
    setProducingSlideIndex(producingCount > 1 ? 1 : 0);
    producingLockedRef.current = false;
    setProducingInstant(false);
  }, [producingCount]);

  const goPrevProducing = () => {
    if (producingCount <= 1 || producingLockedRef.current) return;
    producingLockedRef.current = true;
    setProducingSlideIndex((prev) => prev - 1);
  };

  const goNextProducing = () => {
    if (producingCount <= 1 || producingLockedRef.current) return;
    producingLockedRef.current = true;
    setProducingSlideIndex((prev) => prev + 1);
  };

  const handleProducingTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== 'transform') return;
    if (!producingLoop) {
      producingLockedRef.current = false;
      return;
    }
    if (producingSlideIndex === producingCount + 1) {
      setProducingInstant(true);
      setProducingSlideIndex(1);
      return;
    }
    if (producingSlideIndex === 0) {
      setProducingInstant(true);
      setProducingSlideIndex(producingCount);
      return;
    }
    producingLockedRef.current = false;
  };

  useLayoutEffect(() => {
    if (!producingInstant) return undefined;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setProducingInstant(false);
        producingLockedRef.current = false;
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [producingInstant]);

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      status,
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
        label: `제작일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `제작일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }

    if (appliedSearch.status !== '전체') {
      chips.push({ key: 'status', label: `제작현황: ${appliedSearch.status}` });
    }

    return chips;
  }, [appliedSearch]);

  return (
    <div className="admin-list-page admin-list-page--intro-wan22">
      <h1 className="page-title">인트로 wan 2.2 제작 현황</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="인트로 wan 2.2 제작 요약">
        <div className="admin-stat-cards admin-stat-cards--intro-wan22">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <Flame size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">제작중</p>
            <p className="admin-stat-value">
              {producingItems.length.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
            {producingItems.length === 0 ? (
              <p className="admin-stat-empty">제작 중인 작업 없음</p>
            ) : (
              <div className="admin-stat-producing-slider" aria-label="제작중 상세">
                <div className="admin-stat-producing-slider__viewport">
                  <div
                    className={[
                      'admin-stat-producing-slider__track',
                      producingInstant ? 'is-instant' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ transform: `translateX(-${producingSlideIndex * 100}%)` }}
                    onTransitionEnd={handleProducingTransitionEnd}
                  >
                    {producingSlides.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="admin-stat-producing-slider__slide"
                        aria-hidden={index !== producingSlideIndex}
                      >
                        <div className="admin-stat-running-item">
                          <div className="admin-stat-rank-row">
                            <span className="admin-stat-rank-name">{item.customerId}</span>
                            <span className="row-btn row-btn--status-blue">
                              <span className="progress-status progress-status--blue">
                                <span className="progress-status__dot" aria-hidden="true" />
                                <span className="progress-status__text">WAN</span>
                              </span>
                            </span>
                          </div>
                          <p className="admin-stat-hint">
                            {item.startedAtMs != null ? formatElapsedSeconds(item.startedAtMs, nowMs) : ''}
                            {producingEstimate != null ? ` · wan2.2 · 예상 ${producingEstimate}초` : ' · wan2.2'}
                          </p>
                          <div className="admin-progress-row">
                            <div
                              className="admin-progress-bar"
                              role="progressbar"
                              aria-label={`${item.customerId} 진행률 ${item.progress}%`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={item.progress}
                            >
                              <div className="admin-progress-bar__fill" style={{ width: `${item.progress}%` }} />
                            </div>
                            <span className="list-value">{item.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className="admin-stat-producing-slider__navs"
                  aria-hidden={producingItems.length <= 1}
                >
                  <button
                    type="button"
                    className="admin-stat-producing-slider__nav"
                    onClick={goPrevProducing}
                    aria-label="이전 제작중 작업"
                    disabled={producingItems.length <= 1}
                  >
                    <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
                  </button>
                  <span className="admin-stat-producing-slider__count">
                    {producingDisplayIndex}/{producingCount}
                  </span>
                  <button
                    type="button"
                    className="admin-stat-producing-slider__nav"
                    onClick={goNextProducing}
                    aria-label="다음 제작중 작업"
                    disabled={producingItems.length <= 1}
                  >
                    <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <CalendarDays size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">오늘제작</p>
            <p className="admin-stat-value">
              {todayCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
            <p className="admin-stat-hint">오늘</p>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <Layers size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">누적제작</p>
            <p className="admin-stat-value">
              {totalCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
            <p className="admin-stat-hint">총 누적</p>
          </div>
        </div>
      </section>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row admin-filter-row--no-detail">
          <div className="filter-section">
            <span className="filter-label">제작일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="제작일 프리셋"
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

          <div className="filter-section">
            <span className="filter-label">제작현황</span>
            <ListSelect
              ariaLabel="제작현황"
              value={status}
              onChange={(next) => setStatus(next as StatusFilter)}
              options={[...STATUS_OPTIONS]}
            />
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="인트로 wan 2.2 제작 리스트">
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
                <th>작업번호</th>
                <th>고객정보</th>
                <th className="col-center">씬</th>
                <th className="col-center">썸네일</th>
                <th className="col-center">제작현황</th>
                <th>진행/사유</th>
                <th className="col-center">영상</th>
                <th>제작일시</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const statusClasses = getStatusClasses(item.status);
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="cell-line">{item.workNo}</span>
                    </td>
                    <td>
                      <div className="admin-cell-triple">
                        <span className="cell-line">{item.customerId}</span>
                        <span className="cell-line">{item.customerName}</span>
                        <span className="cell-line">{item.customerPhone}</span>
                      </div>
                    </td>
                    <td className="col-center">
                      <span className="cell-line">
                        {item.sceneCurrent}/{item.sceneTotal}
                      </span>
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="request-image-btn"
                        aria-label={`${item.workNo} 썸네일 보기`}
                        onClick={() => window.open(item.thumbnailUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <img src={item.thumbnailUrl} alt="" className="admin-product-thumb admin-product-thumb--sm" />
                      </button>
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
                      {item.status === '실패' && item.failReason ? (
                        <span className="cell-line cell-line--danger">{item.failReason}</span>
                      ) : item.status === '생성중' ? (
                        <div className="admin-progress-row">
                          <div
                            className="admin-progress-bar"
                            role="progressbar"
                            aria-label={`${item.workNo} 진행률 ${item.progress}%`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={item.progress}
                          >
                            <div className="admin-progress-bar__fill" style={{ width: `${item.progress}%` }} />
                          </div>
                          <span className="list-value">{item.progress}%</span>
                        </div>
                      ) : (
                        <span className="cell-line">-</span>
                      )}
                    </td>
                    <td className="col-center">
                      {item.videoUrl ? (
                        <button
                          type="button"
                          className="row-btn row-btn--default"
                          aria-label={`${item.workNo} 영상 다운로드`}
                          onClick={() => window.open(item.videoUrl!, '_blank', 'noopener,noreferrer')}
                        >
                          <Download size={14} aria-hidden />
                          다운로드
                        </button>
                      ) : (
                        <span className="cell-line">-</span>
                      )}
                    </td>
                    <td>
                      <span className="cell-line">{item.producedAt}</span>
                    </td>
                  </tr>
                );
              })}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-table-empty-cell">
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
