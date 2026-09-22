import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import { CircleDollarSign, ClipboardList, Film } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import '../../feelmaker/orderManagement/OrderListPage.css';
import './WorkHistoryIntroPage.css';
import {
  MOCK_WORK_HISTORY_INTRO_ITEMS,
  WORK_HISTORY_INTRO_CATEGORIES,
  WORK_HISTORY_INTRO_STATUSES,
  WORK_HISTORY_INTRO_STYLES,
  WORK_HISTORY_INTRO_VISIBILITIES,
  type WorkHistoryIntroItem,
  type WorkHistoryIntroProgress,
  type WorkHistoryIntroStatus,
} from './mock/workHistoryIntro.mock';
import WorkHistoryIntroDetailPage from './WorkHistoryIntroDetailPage';
import { workHistoryIntroDetailPath } from './workHistoryIntroPaths';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '연락처', label: '연락처' },
  { value: '아이디', label: '아이디' },
  { value: '작업아이디', label: '작업아이디' },
] as const;
type DetailSearchScope = (typeof DETAIL_SEARCH_SCOPE_OPTIONS)[number]['value'];

const STATUS_OPTIONS = [
  { value: '전체', label: '전체' },
  ...WORK_HISTORY_INTRO_STATUSES.map((status) => ({ value: status, label: status })),
] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];

const VISIBILITY_OPTIONS = [
  { value: '전체', label: '전체' },
  ...WORK_HISTORY_INTRO_VISIBILITIES.map((visibility) => ({ value: visibility, label: visibility })),
] as const;
type VisibilityFilter = (typeof VISIBILITY_OPTIONS)[number]['value'];

const STYLE_OPTIONS = [
  { value: '전체', label: '전체' },
  ...WORK_HISTORY_INTRO_STYLES.map((style) => ({ value: style, label: style })),
] as const;
type StyleFilter = (typeof STYLE_OPTIONS)[number]['value'];

const CATEGORY_OPTIONS = [
  { value: '전체', label: '전체' },
  ...WORK_HISTORY_INTRO_CATEGORIES.map((category) => ({ value: category, label: category })),
] as const;
type CategoryFilter = (typeof CATEGORY_OPTIONS)[number]['value'];

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: DetailSearchScope;
  keyword: string;
  status: StatusFilter;
  visibility: VisibilityFilter;
  style: StyleFilter;
  category: CategoryFilter;
};

type AppliedChipKey = 'date' | 'keyword' | 'status' | 'visibility' | 'style' | 'category';

type ConfirmDialogState = {
  message: string;
  onConfirm: () => void;
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
    search.visibility === '전체' &&
    search.style === '전체' &&
    search.category === '전체'
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

function applyFilters(items: WorkHistoryIntroItem[], applied: AppliedSearch | null): WorkHistoryIntroItem[] {
  if (!applied) return items;
  return items.filter((item) => {
    if (!isInCustomDateRange(item.registeredAt, applied.startDate, applied.endDate)) return false;
    if (applied.status !== '전체' && item.status !== applied.status) return false;
    if (applied.visibility !== '전체' && item.visibility !== applied.visibility) return false;
    if (applied.style !== '전체' && item.style !== applied.style) return false;
    if (applied.category !== '전체' && item.category !== applied.category) return false;

    const keyword = applied.keyword.trim().toLowerCase();
    if (!keyword) return true;

    const phoneKeyword = keyword.replace(/[^0-9]/g, '');
    const matchName = item.customerName.toLowerCase().includes(keyword);
    const matchPhone = Boolean(phoneKeyword) && item.customerPhone.replace(/[^0-9]/g, '').includes(phoneKeyword);
    const matchId = item.customerId.toLowerCase().includes(keyword);
    const matchWorkId = item.workId.toLowerCase().includes(keyword);

    switch (applied.conditionType) {
      case '이름':
        return matchName;
      case '연락처':
        return matchPhone;
      case '아이디':
        return matchId;
      case '작업아이디':
        return matchWorkId;
      default:
        return matchName || matchPhone || matchId || matchWorkId;
    }
  });
}

function getStatusClasses(status: WorkHistoryIntroStatus) {
  if (status === '완료') {
    return { rowBtn: 'row-btn--status-secondary', progress: 'progress-status--secondary' };
  }
  if (status === '생성중') {
    return { rowBtn: 'row-btn--status-blue', progress: 'progress-status--blue' };
  }
  if (status === '오류') {
    return { rowBtn: 'row-btn--status-danger', progress: 'progress-status--danger' };
  }
  return { rowBtn: 'row-btn--status-warning', progress: 'progress-status--warning' };
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

function ProgressRow({ label, progress }: { label: string; progress: WorkHistoryIntroProgress }) {
  const percent = progress.total <= 0 ? 0 : Math.min(100, Math.round((progress.current / progress.total) * 100));
  const complete = progress.total > 0 && progress.current >= progress.total;
  return (
    <div className="admin-progress-row">
      <span className="list-label">{label}</span>
      <div
        className="admin-progress-bar"
        role="progressbar"
        aria-label={`${label} ${progress.current}/${progress.total}`}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.current}
      >
        <div
          className={`admin-progress-bar__fill${complete ? ' admin-progress-bar__fill--complete' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="list-value">
        {progress.current}/{progress.total}
      </span>
    </div>
  );
}

export default function WorkHistoryIntroPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conditionType, setConditionType] = useState<DetailSearchScope>('전체');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('전체');
  const [visibility, setVisibility] = useState<VisibilityFilter>('전체');
  const [style, setStyle] = useState<StyleFilter>('전체');
  const [category, setCategory] = useState<CategoryFilter>('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<WorkHistoryIntroItem[]>(() => [...MOCK_WORK_HISTORY_INTRO_ITEMS]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const filteredItems = useMemo(() => applyFilters(items, appliedSearch), [items, appliedSearch]);
  const summarySourceHint = appliedSearch ? '현재 검색 기준' : '총 누적';
  const filteredSummary = useMemo(() => {
    const todayKey = formatYmd(new Date());
    const statusCounts = Object.fromEntries(
      WORK_HISTORY_INTRO_STATUSES.map((status) => [status, 0])
    ) as Record<WorkHistoryIntroStatus, number>;
    let totalApiCost = 0;
    let todayApiCost = 0;

    for (const item of filteredItems) {
      statusCounts[item.status] += 1;
      totalApiCost += item.apiCost;
      if (item.registeredAt.slice(0, 10) === todayKey) {
        todayApiCost += item.apiCost;
      }
    }

    return {
      totalCount: filteredItems.length,
      totalApiCost,
      todayApiCost,
      statusCounts,
    };
  }, [filteredItems]);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

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

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      status,
      visibility,
      style,
      category,
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
      case 'status':
        setStatus('전체');
        next.status = '전체';
        break;
      case 'visibility':
        setVisibility('전체');
        next.visibility = '전체';
        break;
      case 'style':
        setStyle('전체');
        next.style = '전체';
        break;
      case 'category':
        setCategory('전체');
        next.category = '전체';
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
        label: `등록일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `등록일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }

    if (appliedSearch.status !== '전체') {
      chips.push({ key: 'status', label: `상태: ${appliedSearch.status}` });
    }
    if (appliedSearch.visibility !== '전체') {
      chips.push({ key: 'visibility', label: `노출: ${appliedSearch.visibility}` });
    }
    if (appliedSearch.style !== '전체') {
      chips.push({ key: 'style', label: `스타일: ${appliedSearch.style}` });
    }
    if (appliedSearch.category !== '전체') {
      chips.push({ key: 'category', label: `카테고리: ${appliedSearch.category}` });
    }

    return chips;
  }, [appliedSearch]);

  const handleVisibilityClick = (itemId: string, isCurrentlyVisible: boolean) => {
    setConfirmDialog({
      message: isCurrentlyVisible ? '미노출로 변경할까요?' : '노출중으로 변경할까요?',
      onConfirm: () => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, visibility: isCurrentlyVisible ? '미노출' : '노출중' }
              : item
          )
        );
      },
    });
  };

  if (subId) return <WorkHistoryIntroDetailPage />;

  return (
    <div className="admin-list-page admin-list-page--work-history-intro">
      <h1 className="page-title">인트로 작업내역</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="인트로 작업내역 요약">
        <div className="admin-stat-cards admin-stat-cards--work-history-intro">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <Film size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">총 작업 수</p>
            <p className="admin-stat-value">{filteredSummary.totalCount.toLocaleString('ko-KR')}</p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <CircleDollarSign size={20} strokeWidth={2} />
            </div>
            <div className="admin-stat-card__dual">
              <div>
                <p className="admin-stat-label">총 API 비용</p>
                <p className="admin-stat-value">
                  {filteredSummary.totalApiCost.toLocaleString('ko-KR')}
                  <span className="admin-stat-value__suffix">원</span>
                </p>
              </div>
              <div>
                <p className="admin-stat-label">오늘 사용된 API비용</p>
                <p className="admin-stat-value">
                  {filteredSummary.todayApiCost.toLocaleString('ko-KR')}
                  <span className="admin-stat-value__suffix">원</span>
                </p>
              </div>
            </div>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card admin-stat-card--status">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <ClipboardList size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">작업 현황</p>
            <div className="admin-stat-card__status-counts" aria-label="작업 현황 건수">
              {WORK_HISTORY_INTRO_STATUSES.map((status) => {
                const statusClasses = getStatusClasses(status);
                return (
                  <div key={status}>
                    <p className="admin-stat-label">{status}</p>
                    <p className={`admin-stat-value ${statusClasses.progress}`}>
                      {filteredSummary.statusCounts[status].toLocaleString('ko-KR')}
                      <span className="admin-stat-value__suffix">건</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">등록일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="등록일 프리셋"
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
            <span className="filter-label">상태</span>
            <ListSelect
              ariaLabel="상태"
              value={status}
              onChange={(next) => setStatus(next as StatusFilter)}
              options={[...STATUS_OPTIONS]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">노출</span>
            <ListSelect
              ariaLabel="노출"
              value={visibility}
              onChange={(next) => setVisibility(next as VisibilityFilter)}
              options={[...VISIBILITY_OPTIONS]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">스타일</span>
            <ListSelect
              ariaLabel="스타일"
              value={style}
              onChange={(next) => setStyle(next as StyleFilter)}
              options={[...STYLE_OPTIONS]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">카테고리</span>
            <ListSelect
              ariaLabel="카테고리"
              value={category}
              onChange={(next) => setCategory(next as CategoryFilter)}
              options={[...CATEGORY_OPTIONS]}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="인트로 작업내역 리스트">
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
                <th className="col-center">썸네일</th>
                <th>작업아이디</th>
                <th className="col-center">고객정보</th>
                <th>구분</th>
                <th>진행</th>
                <th className="col-center">상태</th>
                <th>실패</th>
                <th>비용</th>
                <th className="col-center">최종영상</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const statusClasses = getStatusClasses(item.status);
                const isVisible = item.visibility === '노출중';
                return (
                  <tr key={item.id}>
                    <td className="col-center">
                      <img
                        src={item.thumbnailUrl}
                        alt={`${item.workId} 썸네일`}
                        className="admin-product-thumb admin-product-thumb--sm"
                      />
                    </td>
                    <td>
                      <div className="cell-block cell-block--product-with-badge">
                        <div className="product-name-with-public">
                          <button
                            type="button"
                            className={`badge-square ${isVisible ? 'badge-square--open' : 'badge-square--private'}`}
                            title={
                              isVisible
                                ? '노출중 — 클릭 시 미노출로 변경'
                                : '미노출 — 클릭 시 노출중으로 변경'
                            }
                            onClick={() => handleVisibilityClick(item.id, isVisible)}
                          >
                            {isVisible ? '노' : '미'}
                          </button>
                          <Link to={workHistoryIntroDetailPath(item.id)} className="admin-link cell-line">
                            {item.workId}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="admin-cell-triple">
                        <span className="cell-line">{item.customerId}</span>
                        <span className="cell-line">{item.customerName}</span>
                        <span className="cell-line">{item.customerPhone}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">
                          <span className="list-label">카테고리</span>{' '}
                          <span className="list-value">{item.category}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">스타일</span>{' '}
                          <span className="list-value">{item.style}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">비율</span>{' '}
                          <span className="list-value">{item.ratio}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-block">
                        <ProgressRow label="이미지" progress={item.imageProgress} />
                        <ProgressRow label="영상" progress={item.videoProgress} />
                      </div>
                    </td>
                    <td className="col-center">
                      <button type="button" className={['row-btn', statusClasses.rowBtn].join(' ')}>
                        <span className={['progress-status', statusClasses.progress].join(' ')}>
                          <span className="progress-status__dot" aria-hidden="true" />
                          <span className="progress-status__text">{item.status}</span>
                        </span>
                      </button>
                    </td>
                    <td>
                      {item.failReason ? (
                        <span className="cell-line cell-line--danger">{item.failReason}</span>
                      ) : (
                        <span className="admin-cell-issue--empty">-</span>
                      )}
                    </td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">
                          <span className="list-label">토큰</span>{' '}
                          <span className="list-value">{item.usedTokens.toLocaleString('ko-KR')}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">API</span>{' '}
                          <span className="amount-red">{item.apiCost.toLocaleString('ko-KR')}원</span>
                        </span>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <button
                          type="button"
                          className="row-btn row-btn--primary"
                          disabled={!item.hasFinalVideo}
                          onClick={() => window.alert('영상확인(목업)')}
                        >
                          영상확인
                        </button>
                        <button
                          type="button"
                          className="row-btn row-btn--default"
                          onClick={() => window.alert('에디터(목업)')}
                        >
                          에디터
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="cell-line">{item.registeredAt}</span>
                    </td>
                  </tr>
                );
              })}
              {paginatedItems.length === 0 && (
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

      <Confirm
        open={confirmDialog != null}
        message={confirmDialog?.message ?? ''}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          confirmDialog?.onConfirm();
          setConfirmDialog(null);
        }}
      />
    </div>
  );
}
