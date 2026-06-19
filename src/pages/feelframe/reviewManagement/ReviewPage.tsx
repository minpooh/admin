import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Clock3 } from 'lucide-react';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/Confirm';
import {
  getVisiblePageNumbers,
  jumpPageBack,
  jumpPageForward,
  PAGINATION_JUMP_PAGES,
} from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import './ReviewPage.css';
import ReviewDetailPage from './ReviewDetailPage';
import { reviewDetailPath } from './reviewPaths';
import type { FeelframeReviewRow } from './mock/review.mock';
import { MOCK_FEELFRAME_REVIEWS } from './mock/review.mock';

const DATE_PRESET_OPTIONS = [
  { value: '', label: '미선택' },
  { value: '당일', label: '당일' },
  { value: '3일', label: '3일' },
  { value: '1주', label: '1주' },
  { value: '2주', label: '2주' },
  { value: '1개월', label: '1개월' },
  { value: '3개월', label: '3개월' },
  { value: '6개월', label: '6개월' },
] as const;

const SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'name', label: '이름' },
  { value: 'id', label: '아이디' },
  { value: 'phone', label: '전화번호' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
] as const;

const ANSWER_FILTER_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: '답변전', label: '답변전' },
  { value: '답변완료', label: '답변완료' },
] as const;

const RATING_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
] as const;

type SearchScopeValue = (typeof SEARCH_SCOPE_OPTIONS)[number]['value'];
type AnswerFilterValue = (typeof ANSWER_FILTER_OPTIONS)[number]['value'];
type RatingFilterValue = (typeof RATING_FILTER_OPTIONS)[number]['value'];

type AppliedReviewSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  searchScope: SearchScopeValue;
  keyword: string;
  ratingFilter: RatingFilterValue;
  answerFilter: AnswerFilterValue;
};

type AppliedChipKey = 'date' | 'keyword' | 'rating' | 'answer';

type ReviewWeekChartPoint = {
  day: string;
  label: string;
  count: number;
};

const ITEMS_PER_PAGE = 10;

function formatYmd(d: Date | null) {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

function parseCreatedAt(value: string): Date {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function isAppliedSearchEmpty(s: AppliedReviewSearch): boolean {
  return (
    !s.dateRange &&
    s.startDate == null &&
    s.endDate == null &&
    !s.keyword.trim() &&
    !s.ratingFilter &&
    !s.answerFilter
  );
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, idx) =>
    idx < rating ? <FaStar key={`star-fill-${idx}`} aria-hidden /> : <FaRegStar key={`star-empty-${idx}`} aria-hidden />,
  );
}

function RatingStars({ count }: { count: number }) {
  if (count === 0) return <>전체</>;
  return (
    <span className="review-rating-filter-stars" aria-label={`${count}점`}>
      {Array.from({ length: 5 }, (_, idx) =>
        idx < count ? <FaStar key={`fill-${idx}`} aria-hidden /> : <FaRegStar key={`empty-${idx}`} aria-hidden />,
      )}
    </span>
  );
}

function ReviewRatingFilterSelect({
  value,
  onChange,
}: {
  value: RatingFilterValue;
  onChange: (next: RatingFilterValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const selectedCount = value ? Number(value) : 0;

  useEffect(() => {
    if (!open) return;

    const handlePointerDownCapture = (e: MouseEvent | TouchEvent) => {
      const target = e.target;
      if (!(target instanceof Node) || !wrapRef.current || wrapRef.current.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDownCapture, true);
    document.addEventListener('touchstart', handlePointerDownCapture, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownCapture, true);
      document.removeEventListener('touchstart', handlePointerDownCapture, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="listselect listselect--rating-filter">
      <button
        type="button"
        className={`listselect__trigger ${open ? 'is-open' : ''}`}
        aria-label="별점"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="listselect__value">
          <RatingStars count={selectedCount} />
        </span>
        <svg className="listselect__chevron" aria-hidden="true" viewBox="0 0 16 16" width="12" height="12" fill="none">
          <path
            d="M4.5 6.75L8 10.25L11.5 6.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="listselect__menu" role="listbox" aria-label="별점">
          {RATING_FILTER_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            const count = opt.value ? Number(opt.value) : 0;
            return (
              <li
                key={opt.value || 'all'}
                className={`listselect__item ${isSelected ? 'is-selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value as RatingFilterValue);
                  setOpen(false);
                }}
              >
                <RatingStars count={count} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function applyReviewFilters(rows: FeelframeReviewRow[], search: AppliedReviewSearch | null): FeelframeReviewRow[] {
  if (!search) return rows;

  const keywordTrim = search.keyword.trim().toLowerCase();
  const normalizedKeyword = keywordTrim.replace(/[^0-9]/g, '');
  const startBoundary = search.startDate
    ? new Date(search.startDate.getFullYear(), search.startDate.getMonth(), search.startDate.getDate(), 0, 0, 0, 0)
    : null;
  const endBoundary = search.endDate
    ? new Date(search.endDate.getFullYear(), search.endDate.getMonth(), search.endDate.getDate(), 23, 59, 59, 999)
    : null;

  return rows.filter((row) => {
    const createdAt = parseCreatedAt(row.createdAt);
    if (startBoundary && createdAt < startBoundary) return false;
    if (endBoundary && createdAt > endBoundary) return false;

    if (!startBoundary && !endBoundary && search.dateRange) {
      const now = new Date();
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (search.dateRange === '당일' && createdAt.toDateString() !== now.toDateString()) return false;
      if (search.dateRange === '3일' && !(diffDays >= 0 && diffDays < 3)) return false;
      if (search.dateRange === '1주' && !(diffDays >= 0 && diffDays < 7)) return false;
      if (search.dateRange === '2주' && !(diffDays >= 0 && diffDays < 14)) return false;
      if (search.dateRange === '1개월' && !(diffDays >= 0 && diffDays < 30)) return false;
      if (search.dateRange === '3개월' && !(diffDays >= 0 && diffDays < 90)) return false;
      if (search.dateRange === '6개월' && !(diffDays >= 0 && diffDays < 180)) return false;
    }

    if (search.ratingFilter && row.rating !== Number(search.ratingFilter)) return false;

    if (search.answerFilter === '답변전' && row.answeredAt !== null) return false;
    if (search.answerFilter === '답변완료' && row.answeredAt === null) return false;

    if (!keywordTrim) return true;

    if (search.searchScope === 'all') {
      return (
        row.title.toLowerCase().includes(keywordTrim) ||
        row.authorName.toLowerCase().includes(keywordTrim) ||
        row.authorId.toLowerCase().includes(keywordTrim) ||
        row.phone.toLowerCase().includes(keywordTrim) ||
        row.phone.replace(/[^0-9]/g, '').includes(normalizedKeyword) ||
        row.content.toLowerCase().includes(keywordTrim)
      );
    }
    if (search.searchScope === 'name') {
      return row.authorName.toLowerCase().includes(keywordTrim);
    }
    if (search.searchScope === 'id') {
      return row.authorId.toLowerCase().includes(keywordTrim);
    }
    if (search.searchScope === 'phone') {
      return (
        row.phone.toLowerCase().includes(keywordTrim) ||
        (!!normalizedKeyword && row.phone.replace(/[^0-9]/g, '').includes(normalizedKeyword))
      );
    }
    if (search.searchScope === 'title') {
      return row.title.toLowerCase().includes(keywordTrim);
    }
    if (search.searchScope === 'content') {
      return row.content.toLowerCase().includes(keywordTrim);
    }

    return true;
  });
}

export default function ReviewPage() {
  const { subId } = useParams<{ subId?: string }>();

  const [reviewRows, setReviewRows] = useState<FeelframeReviewRow[]>(() => [...MOCK_FEELFRAME_REVIEWS]);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState<SearchScopeValue>('all');
  const [keyword, setKeyword] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>('');
  const [answerFilter, setAnswerFilter] = useState<AnswerFilterValue>('');
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [appliedSearch, setAppliedSearch] = useState<AppliedReviewSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredRows = useMemo(
    () => applyReviewFilters(reviewRows, appliedSearch),
    [reviewRows, appliedSearch],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, displayPage]);

  const deleteTargetRow = useMemo(
    () => (deleteTargetId ? (reviewRows.find((row) => row.id === deleteTargetId) ?? null) : null),
    [deleteTargetId, reviewRows],
  );

  const unansweredCount = useMemo(() => filteredRows.filter((row) => row.answeredAt === null).length, [filteredRows]);
  const averageRating = useMemo(() => {
    if (!filteredRows.length) return 0;
    const total = filteredRows.reduce((sum, row) => sum + row.rating, 0);
    return total / filteredRows.length;
  }, [filteredRows]);
  const ratingDistribution = useMemo(
    () => [5, 4, 3, 2, 1].map((score) => ({ score, count: filteredRows.filter((row) => row.rating === score).length })),
    [filteredRows],
  );
  const maxRatingCount = Math.max(1, ...ratingDistribution.map((r) => r.count));
  const positiveRate = useMemo(() => {
    if (!filteredRows.length) return 0;
    return (filteredRows.filter((row) => row.rating >= 4).length / filteredRows.length) * 100;
  }, [filteredRows]);
  const weeklyNewReviews = useMemo(
    () =>
      filteredRows.filter((row) => {
        const createdAt = parseCreatedAt(row.createdAt);
        const now = new Date();
        return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) < 7;
      }).length,
    [filteredRows],
  );

  const reviewWeekChartData = useMemo<ReviewWeekChartPoint[]>(() => {
    const weekMeta: Array<{ key: string; label: string; jsDay: number }> = [
      { key: 'S6', label: '일', jsDay: 0 },
      { key: 'M0', label: '월', jsDay: 1 },
      { key: 'T1', label: '화', jsDay: 2 },
      { key: 'W2', label: '수', jsDay: 3 },
      { key: 'T3', label: '목', jsDay: 4 },
      { key: 'F4', label: '금', jsDay: 5 },
      { key: 'S5', label: '토', jsDay: 6 },
    ];

    return weekMeta.map((d) => ({
      day: d.key,
      label: d.label,
      count: filteredRows.filter((row) => parseCreatedAt(row.createdAt).getDay() === d.jsDay).length,
    }));
  }, [filteredRows]);

  const activeWeekIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    if (jsDay === 0) return 6;
    return jsDay - 1;
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentPage(1);
    });
  }, [appliedSearch]);

  useEffect(() => {
    if (currentPage > totalPages) {
      queueMicrotask(() => {
        setCurrentPage(totalPages);
      });
    }
  }, [currentPage, totalPages]);

  const scopeLabel = (scope: SearchScopeValue) =>
    SEARCH_SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope;

  const appliedChips = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: { key: AppliedChipKey; label: string }[] = [];

    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `작성일: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `작성일: ${appliedSearch.dateRange}` });
    }

    const kw = appliedSearch.keyword.trim();
    if (kw) {
      chips.push({ key: 'keyword', label: `상세검색: ${scopeLabel(appliedSearch.searchScope)} ${kw}` });
    }

    if (appliedSearch.ratingFilter) {
      chips.push({ key: 'rating', label: `별점: ${appliedSearch.ratingFilter}점` });
    }

    if (appliedSearch.answerFilter) {
      chips.push({ key: 'answer', label: `답변여부: ${appliedSearch.answerFilter}` });
    }

    return chips;
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: AppliedReviewSearch = {
      dateRange,
      startDate,
      endDate,
      searchScope,
      keyword,
      ratingFilter,
      answerFilter,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next: AppliedReviewSearch = { ...appliedSearch };

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
        setSearchScope('all');
        next.keyword = '';
        next.searchScope = 'all';
        break;
      case 'rating':
        setRatingFilter('');
        next.ratingFilter = '';
        break;
      case 'answer':
        setAnswerFilter('');
        next.answerFilter = '';
        break;
      default:
        break;
    }

    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  if (subId) return <ReviewDetailPage />;

  return (
    <div className="admin-list-page admin-list-page--feelframe-review">
      <h1 className="page-title">리뷰 관리</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="리뷰 요약">
        <div className="admin-stat-cards admin-stat-cards--review-summary">
          <div className="admin-stat-card admin-stat-card--rating">
            <div className="admin-stat-card__summary">
              <p className="admin-stat-value admin-stat-value--rating">
                {averageRating.toFixed(2)} <span className="admin-stat-value__suffix">★</span>
              </p>
              <p className="admin-stat-card__desc">총 {filteredRows.length}개 리뷰</p>
              <p className="admin-stat-hint">현재 검색/필터 기준</p>
            </div>
            <div className="admin-stat-card__distribution">
              {ratingDistribution.map((item) => (
                <div key={item.score} className="admin-stat-card__dist-row">
                  <span>{item.score}점</span>
                  <div className="admin-stat-card__dist-track">
                    <span
                      className="admin-stat-card__dist-fill"
                      style={{ width: `${(item.count / maxRatingCount) * 100}%` }}
                    />
                  </div>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-stat-card admin-stat-card--chart">
            <div className="admin-stat-card__body">
              <div className="admin-stat-card__content">
                <p className="admin-stat-label admin-stat-label--title">리뷰 통계</p>
                <p className="admin-stat-card__metric">
                  신규 리뷰 {weeklyNewReviews}건{' '}
                  <span className="admin-stat-card__badge">+{Math.round(positiveRate / 10)}%</span>
                </p>
                <p className="admin-stat-card__metric admin-stat-card__metric--positive">
                  긍정 리뷰 {Math.round(positiveRate)}%
                </p>
                <p className="admin-stat-hint">주간 리포트</p>
              </div>
              <div className="admin-stat-card__chart" aria-label="주간 리뷰 통계 차트">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reviewWeekChartData} barCategoryGap={2} barGap={0}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={6} />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const value = payload[0]?.value ?? 0;
                        return (
                          <div className="admin-stat-card__chart-tooltip">
                            <p className="admin-stat-card__chart-tooltip-day">{label}</p>
                            <p className="admin-stat-card__chart-tooltip-value">
                              <span className="admin-stat-card__chart-tooltip-dot" />
                              series-1: <strong>{value}</strong>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={9}>
                      {reviewWeekChartData.map((item, idx) => (
                        <Cell
                          key={item.day}
                          fill={idx === activeWeekIndex ? '#22c55e' : '#d1fae5'}
                          className="admin-stat-card__chart-bar"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <Clock3 size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">미답변</p>
            <p className="admin-stat-value admin-stat-value--warning">{unansweredCount}</p>
            <p className="admin-stat-hint">답변 대기 건수</p>
          </div>
        </div>
      </section>

      <section className="admin-list-box" aria-label="리뷰 검색 필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">작성일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="작성일 프리셋"
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
                options={[...DATE_PRESET_OPTIONS]}
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
                  maxDate={new Date()}
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
                  maxDate={new Date()}
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
                value={searchScope}
                onChange={(next) => setSearchScope(next as SearchScopeValue)}
                options={[...SEARCH_SCOPE_OPTIONS]}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="리뷰 상세검색"
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
              aria-expanded={filterExpanded}
            >
              <span className="detail-search-toggle__text">상세검색</span>
              <svg className="detail-search-toggle__icon" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
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
            <span className="filter-label">별점</span>
            <ReviewRatingFilterSelect value={ratingFilter} onChange={setRatingFilter} />
          </div>

          <div className="filter-section">
            <span className="filter-label">답변여부</span>
            <ListSelect
              ariaLabel="답변여부"
              value={answerFilter}
              onChange={(next) => setAnswerFilter(next as AnswerFilterValue)}
              options={[...ANSWER_FILTER_OPTIONS]}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="리뷰 목록">
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
          <table className="admin-table admin-table--min-w-800 admin-table--status-col-3">
            <thead>
              <tr>
                <th scope="col" className="col-center">
                  번호
                </th>
                <th scope="col">별점</th>
                <th scope="col">상품</th>
                <th scope="col">제목</th>
                <th scope="col">작성자</th>
                <th scope="col">작성일</th>
                <th scope="col" className="col-center">
                  답변여부
                </th>
                <th scope="col" className="col-center">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const rowNumber = filteredRows.length - ((displayPage - 1) * ITEMS_PER_PAGE + idx);
                  const answered = row.answeredAt !== null;

                  return (
                    <tr key={row.id}>
                      <td className="col-center">{rowNumber}</td>
                      <td className="review-col-rating">
                        <span className="review-col-rating__inner">
                          <span className="review-rating-stars" aria-label={`${row.rating}점`}>
                            {renderStars(row.rating)}
                          </span>
                          <span className="review-rating-value">{row.rating}.0</span>
                        </span>
                      </td>
                      <td className="admin-table-col-title" title={row.productName}>
                        {row.productName}
                      </td>
                      <td className="admin-table-col-title">
                        <Link to={reviewDetailPath(row.id)} className="admin-link admin-table-title-link" title={row.title}>
                          {row.title}
                        </Link>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.authorName}</span>
                          <span className="cell-line admin-list-muted">{row.authorId}</span>
                          <span className="cell-line admin-list-muted">{row.isMember ? '회원' : '비회원'}</span>
                        </div>
                      </td>
                      <td>{row.createdAt}</td>
                      <td className="col-center">
                        <div className="cell-block">
                          <span className="cell-line">
                            <span
                              className={[
                                'admin-status-pill',
                                answered ? 'admin-status-pill--답변완료' : 'admin-status-pill--답변전',
                              ].join(' ')}
                            >
                              {answered ? '답변완료' : '답변전'}
                            </span>
                          </span>
                          {row.answeredAt ? (
                            <span className="cell-line admin-list-muted">{row.answeredAt}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--red" onClick={() => setDeleteTargetId(row.id)}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-list-table-footer">
          <div className="admin-table-pagination">
            <div className="pagination-inner">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => jumpPageBack(p))}
                disabled={displayPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={displayPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => jumpPageForward(p, totalPages))}
                disabled={displayPage >= totalPages}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      <Confirm
        open={Boolean(deleteTargetRow)}
        title="리뷰 삭제"
        message={deleteTargetRow ? `"${deleteTargetRow.title}" 리뷰를 삭제할까요?` : ''}
        confirmText="삭제"
        danger
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (!deleteTargetId) return;
          setReviewRows((prev) => prev.filter((row) => row.id !== deleteTargetId));
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
