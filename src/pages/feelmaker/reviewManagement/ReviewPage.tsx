import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Clock3, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/confirm';
import '../orderManagement/OrderListPage.css';
import './ReviewPage.css';
import { InquiryAnswerStatusCell } from './InquiryAnswerStatusCell';
import { pagePath } from '../../../routes';
import ReviewDetailPage from './ReviewDetailPage';
import { MOCK_REVIEWS } from './mock/review.mock';
import type { ReviewRow } from './mock/review.mock';

const SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'title', label: '제목' },
  { value: 'id', label: '문의번호' },
  { value: 'member', label: '회원' },
];

type AnswerFilterValue = '' | '미답변' | '답변완료';

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, idx) =>
    idx < rating ? <FaStar key={`star-fill-${idx}`} aria-hidden /> : <FaRegStar key={`star-empty-${idx}`} aria-hidden />
  );
}

type ReviewWeekChartPoint = {
  day: string;
  label: string;
  count: number;
};

export default function ReviewPage() {
  const { subId } = useParams<{ subId?: string }>();

  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [answerFilter, setAnswerFilter] = useState<AnswerFilterValue>('');
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>(() => [...MOCK_REVIEWS]);
  const [deleteTargetReviewId, setDeleteTargetReviewId] = useState<string | null>(null);

  const [appliedSearch, setAppliedSearch] = useState<{
    dateRange: string;
    startDate: Date | null;
    endDate: Date | null;
    searchScope: string;
    keyword: string;
    answerFilter: AnswerFilterValue;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return reviewRows;

    const keywordTrim = appliedSearch.keyword.trim().toLowerCase();
    const startBoundary = appliedSearch.startDate
      ? new Date(appliedSearch.startDate.getFullYear(), appliedSearch.startDate.getMonth(), appliedSearch.startDate.getDate(), 0, 0, 0, 0)
      : null;
    const endBoundary = appliedSearch.endDate
      ? new Date(appliedSearch.endDate.getFullYear(), appliedSearch.endDate.getMonth(), appliedSearch.endDate.getDate(), 23, 59, 59, 999)
      : null;

    return reviewRows.filter((row) => {
      const createdAt = new Date(row.createdAt.replace(' ', 'T'));
      if (startBoundary && createdAt < startBoundary) return false;
      if (endBoundary && createdAt > endBoundary) return false;

      if (!startBoundary && !endBoundary && appliedSearch.dateRange) {
        const now = new Date();
        const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (appliedSearch.dateRange === '당일' && createdAt.toDateString() !== now.toDateString()) return false;
        if (appliedSearch.dateRange === '3일' && !(diffDays >= 0 && diffDays < 3)) return false;
        if (appliedSearch.dateRange === '1주' && !(diffDays >= 0 && diffDays < 7)) return false;
        if (appliedSearch.dateRange === '2주' && !(diffDays >= 0 && diffDays < 14)) return false;
        if (appliedSearch.dateRange === '1개월' && !(diffDays >= 0 && diffDays < 30)) return false;
      }

      if (appliedSearch.answerFilter === '미답변' && row.answeredAt !== null) return false;
      if (appliedSearch.answerFilter === '답변완료' && row.answeredAt === null) return false;

      if (keywordTrim) {
        const matchAll =
          row.title.toLowerCase().includes(keywordTrim) ||
          row.id.toLowerCase().includes(keywordTrim) ||
          row.authorName.toLowerCase().includes(keywordTrim) ||
          row.authorId.toLowerCase().includes(keywordTrim) ||
          row.email.toLowerCase().includes(keywordTrim);
        const scope = appliedSearch.searchScope;
        if (scope === 'all') {
          if (!matchAll) return false;
        } else if (scope === 'title') {
          if (!row.title.toLowerCase().includes(keywordTrim)) return false;
        } else if (scope === 'id') {
          if (!row.id.toLowerCase().includes(keywordTrim)) return false;
        } else if (scope === 'member') {
          if (
            !row.authorName.toLowerCase().includes(keywordTrim) &&
            !row.authorId.toLowerCase().includes(keywordTrim) &&
            !row.email.toLowerCase().includes(keywordTrim)
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [appliedSearch, reviewRows]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

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

  const handleSearch = () => {
    setAppliedSearch({
      dateRange,
      startDate,
      endDate,
      searchScope,
      keyword,
      answerFilter,
    });
  };

  const formatYmd = (d: Date | null) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  type AppliedChipKey = 'date' | 'keyword' | 'answer';
  const isAppliedSearchEmpty = (s: typeof appliedSearch) => {
    if (!s) return true;
    return !s.dateRange && s.startDate == null && s.endDate == null && !s.keyword.trim() && !s.answerFilter;
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    if (key === 'date') {
      setDateRange('');
      setStartDate(null);
      setEndDate(null);
      next.dateRange = '';
      next.startDate = null;
      next.endDate = null;
    } else if (key === 'keyword') {
      setKeyword('');
      next.keyword = '';
    } else if (key === 'answer') {
      setAnswerFilter('');
      next.answerFilter = '';
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const scopeLabel = (scope: string) => SEARCH_SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope;

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `작성일: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `작성일: ${appliedSearch.dateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel(appliedSearch.searchScope)} ${appliedSearch.keyword}` });
    }
    if (appliedSearch.answerFilter) {
      chips.push({ key: 'answer', label: `답변여부: ${appliedSearch.answerFilter}` });
    }
    return chips;
  }, [appliedSearch]);

  const unansweredCount = useMemo(() => filteredRows.filter((row) => row.answeredAt === null).length, [filteredRows]);
  const averageRating = useMemo(() => {
    if (!filteredRows.length) return 0;
    const total = filteredRows.reduce((sum, row) => sum + row.rating, 0);
    return total / filteredRows.length;
  }, [filteredRows]);
  const ratingDistribution = useMemo(
    () => [5, 4, 3, 2, 1].map((score) => ({ score, count: filteredRows.filter((row) => row.rating === score).length })),
    [filteredRows]
  );
  const maxRatingCount = Math.max(1, ...ratingDistribution.map((r) => r.count));
  const positiveRate = useMemo(() => {
    if (!filteredRows.length) return 0;
    return (filteredRows.filter((row) => row.rating >= 4).length / filteredRows.length) * 100;
  }, [filteredRows]);
  const weeklyNewReviews = useMemo(
    () =>
      filteredRows.filter((row) => {
        const createdAt = new Date(row.createdAt.replace(' ', 'T'));
        const now = new Date();
        return (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24) < 7;
      }).length,
    [filteredRows]
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
      count: filteredRows.filter((row) => new Date(row.createdAt.replace(' ', 'T')).getDay() === d.jsDay).length,
    }));
  }, [filteredRows]);
  const activeWeekIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    if (jsDay === 0) return 6;
    return jsDay - 1;
  }, []);
  const reviewDetailPath = (id: string) =>
    pagePath({ navId: 'feelmaker', sectionId: 'reviewManagement', itemId: 'review', subId: id });

  const deleteTargetReview = useMemo(
    () => (deleteTargetReviewId ? reviewRows.find((row) => row.id === deleteTargetReviewId) ?? null : null),
    [deleteTargetReviewId, reviewRows]
  );

  if (subId) return <ReviewDetailPage />;

  return (
    <div className="admin-list-page admin-list-page--review">
      <h1 className="page-title">리뷰 관리</h1>

      <section className="review-stat-cards-wrap admin-stat-section">
        <div className="review-stat-grid">
          <div className="review-card">
            <div className="review-card__left">
              <p className="review-card__rating-value">
                {averageRating.toFixed(2)} <span className="review-card__star">★</span>
              </p>
              <p className="review-card__sub">총 {filteredRows.length}개 리뷰</p>
              <p className="review-card__hint">현재 검색/필터 기준</p>
            </div>
            <div className="review-card__distribution">
              {ratingDistribution.map((item) => (
                <div key={item.score} className="review-dist-row">
                  <span>{item.score}점</span>
                  <div className="review-dist-track">
                    <span className="review-dist-fill" style={{ width: `${(item.count / maxRatingCount) * 100}%` }} />
                  </div>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="review-card review-card--stats">
            <div className="review-card__stats-main">
              <div className="review-card__stats-text">
                <h3>리뷰 통계</h3>
                <p className="review-card__metric">
                  신규 리뷰 {weeklyNewReviews}건 <span className="review-badge">+{Math.round(positiveRate / 10)}%</span>
                </p>
                <p className="review-card__metric review-card__metric--positive">긍정 리뷰 {Math.round(positiveRate)}%</p>
                <p className="review-card__sub">주간 리포트</p>
              </div>
              <div className="review-week-chart" aria-label="주간 리뷰 통계 차트">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reviewWeekChartData} barCategoryGap={2} barGap={0}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={6} />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const value = payload[0]?.value ?? 0;
                        return (
                          <div className="review-week-tooltip">
                            <p className="review-week-tooltip__day">{label}</p>
                            <p className="review-week-tooltip__value">
                              <span className="review-week-tooltip__dot" />
                              series-1: <strong>{value}</strong>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={9}>
                      {reviewWeekChartData.map((item, idx) => (
                        <Cell key={item.day} fill={idx === activeWeekIndex ? '#22c55e' : '#d1fae5'} className="review-week-chart__bar" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-stat-card review-unanswered-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <Clock3 size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">미답변</p>
            <p className="admin-stat-value admin-stat-value--warning">{unansweredCount}</p>
            <p className="admin-stat-hint">답변 대기 건수</p>
          </div>
        </div>
      </section>

      <section className="admin-list-box">
        <div className="filter-top-row admin-filter-row--no-detail">
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
                  const today = new Date();
                  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const start = new Date(end);
                  if (next === '3일') start.setDate(start.getDate() - 2);
                  if (next === '1주') start.setDate(start.getDate() - 6);
                  if (next === '2주') start.setDate(start.getDate() - 13);
                  if (next === '1개월') start.setDate(start.getDate() - 29);
                  setStartDate(start);
                  setEndDate(end);
                }}
                options={[
                  { value: '', label: '미선택' },
                  { value: '당일', label: '당일' },
                  { value: '3일', label: '3일' },
                  { value: '1주', label: '1주' },
                  { value: '2주', label: '2주' },
                  { value: '1개월', label: '1개월' },
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
                ariaLabel="검색 조건"
                className="listselect--condition-type"
                value={searchScope}
                onChange={setSearchScope}
                options={SEARCH_SCOPE_OPTIONS}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="리뷰 검색"
              />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">답변여부</span>
            <ListSelect
              ariaLabel="답변여부"
              value={answerFilter}
              onChange={(next) => setAnswerFilter(next as AnswerFilterValue)}
              options={[
                { value: '', label: '전체' },
                { value: '미답변', label: '미답변' },
                { value: '답변완료', label: '답변완료' },
              ]}
            />
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table">
        {appliedChips.length > 0 && (
          <section className="admin-applied-filters">
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
                <th scope="col">작성일</th>
                <th scope="col">별점</th>
                <th scope="col">제목</th>
                <th scope="col">답변 여부</th>
                <th scope="col">작성자</th>
                <th scope="col">이메일</th>
                <th scope="col">답변자</th>
                <th scope="col">답변일</th>
                <th scope="col">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td className="review-col-rating">
                    <span className="review-rating-stars" aria-label={`${row.rating}점`}>
                      {renderStars(row.rating)}
                    </span>
                    <span className="review-rating-value">{row.rating}.0</span>
                  </td>
                  <td className="inquiry-table-col-title">
                    <Link to={reviewDetailPath(row.id)} className="admin-link inquiry-table-title-link">
                      {row.title}
                    </Link>
                  </td>
                  <td>
                    <InquiryAnswerStatusCell answeredAt={row.answeredAt} />
                  </td>
                  <td>{row.authorName}</td>
                  <td>{row.email}</td>
                  <td>{row.answeredBy ?? '—'}</td>
                  <td>{row.answeredAt ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      onClick={() => setDeleteTargetReviewId(row.id)}
                      aria-label={`${row.title} 리뷰 삭제`}
                      title="삭제"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-pagination">
          <div className="pagination-inner">
            <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1} aria-label="첫 페이지">
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

      <Confirm
        open={Boolean(deleteTargetReview)}
        title="리뷰 삭제"
        message={deleteTargetReview ? `"${deleteTargetReview.title}" 리뷰를 삭제할까요?` : ''}
        confirmText="삭제"
        danger
        onClose={() => setDeleteTargetReviewId(null)}
        onConfirm={() => {
          if (!deleteTargetReviewId) return;
          setReviewRows((prev) => prev.filter((row) => row.id !== deleteTargetReviewId));
          setDeleteTargetReviewId(null);
        }}
      />
    </div>
  );
}
