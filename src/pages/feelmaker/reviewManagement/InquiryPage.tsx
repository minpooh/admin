import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { BarChart3, Clock3, MessageSquareText } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import { pagePath } from '../../../routes';
import '../orderManagement/OrderListPage.css';
import './InquiryPage.css';
import { InquiryAnswerStatusCell } from './InquiryAnswerStatusCell';
import InquiryDetailPage from './InquiryDetailPage';
import type { InquiryRow } from './mock/inquiry.mock';
import { MOCK_INQUIRIES } from './mock/inquiry.mock';

/** 검색 결과 제목·카테고리에서 빈도 상위 키워드 (목업 분석) */
function keywordStatsFromRows(rows: InquiryRow[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const cat = row.category?.trim();
    if (cat) map.set(cat, (map.get(cat) ?? 0) + 1);
    for (const part of row.title.split(/[\s,，]+/)) {
      const w = part.trim();
      if (w.length < 2) continue;
      map.set(w, (map.get(w) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => ({ word, count }));
}

function extractSnippet(text: string, keyword: string, radius = 45) {
  const safeKeyword = keyword.trim();
  if (!safeKeyword) return '';

  const lowerText = text.toLowerCase();
  const lowerKeyword = safeKeyword.toLowerCase();
  const idx = lowerText.indexOf(lowerKeyword);
  if (idx < 0) return text.length > radius * 2 ? `${text.slice(0, radius * 2)}...` : text;

  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + lowerKeyword.length + radius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

const SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'title', label: '제목' },
  { value: 'id', label: '문의번호' },
  { value: 'member', label: '회원' },
];

type AnswerFilterValue = '' | '미답변' | '답변완료';

const inquiryDetailPath = (id: string) =>
  pagePath({ navId: 'feelmaker', sectionId: 'reviewManagement', itemId: 'inquiry', subId: id });

export default function InquiryPage() {
  const { subId } = useParams<{ subId?: string }>();
  if (subId) return <InquiryDetailPage />;

  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [answerFilter, setAnswerFilter] = useState<AnswerFilterValue>('');

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
    if (!appliedSearch) return MOCK_INQUIRIES;

    const keywordTrim = appliedSearch.keyword.trim().toLowerCase();
    const startBoundary = appliedSearch.startDate
      ? new Date(
          appliedSearch.startDate.getFullYear(),
          appliedSearch.startDate.getMonth(),
          appliedSearch.startDate.getDate(),
          0,
          0,
          0,
          0
        )
      : null;
    const endBoundary = appliedSearch.endDate
      ? new Date(
          appliedSearch.endDate.getFullYear(),
          appliedSearch.endDate.getMonth(),
          appliedSearch.endDate.getDate(),
          23,
          59,
          59,
          999
        )
      : null;

    return MOCK_INQUIRIES.filter((row) => {
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
  }, [appliedSearch]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
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
    return (
      !s.dateRange &&
      s.startDate == null &&
      s.endDate == null &&
      !s.keyword.trim() &&
      !s.answerFilter
    );
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

  const scopeLabel = (scope: string) =>
    SEARCH_SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope;

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
      chips.push({
        key: 'keyword',
        label: `검색: ${scopeLabel(appliedSearch.searchScope)} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.answerFilter) {
      chips.push({ key: 'answer', label: `답변여부: ${appliedSearch.answerFilter}` });
    }
    return chips;
  }, [appliedSearch]);

  const unansweredCount = useMemo(
    () => filteredRows.filter((row) => row.answeredAt === null).length,
    [filteredRows]
  );

  const keywordStats = useMemo(() => keywordStatsFromRows(filteredRows), [filteredRows]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const keywordPanelRef = useRef<HTMLDivElement | null>(null);
  const [keywordArrowX, setKeywordArrowX] = useState<number>(0);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipCloseTimerRef = useRef<number | null>(null);
  const TOOLTIP_TRANSITION_MS = 180;

  // 키워드 목록이 바뀌면(필터/검색 결과 변경) 선택 상태도 동기화
  useEffect(() => {
    setSelectedKeyword((prev) => {
      if (!prev) return prev;
      if (keywordStats.some((k) => k.word === prev)) return prev;

      // 목록에서 사라진 키워드는 툴팁 닫기 애니메이션 후 해제
      setTooltipOpen(false);
      if (tooltipCloseTimerRef.current) window.clearTimeout(tooltipCloseTimerRef.current);
      tooltipCloseTimerRef.current = window.setTimeout(() => setSelectedKeyword(null), TOOLTIP_TRANSITION_MS);
      return prev;
    });
  }, [keywordStats]);

  useEffect(() => {
    return () => {
      if (tooltipCloseTimerRef.current) window.clearTimeout(tooltipCloseTimerRef.current);
    };
  }, []);

  // 툴팁이 열려있을 때, 패널(버튼/툴팁) 밖을 클릭하면 닫기
  useEffect(() => {
    if (!tooltipOpen) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const panel = keywordPanelRef.current;
      if (!panel) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (!panel.contains(target)) {
        setTooltipOpen(false);
        if (tooltipCloseTimerRef.current) window.clearTimeout(tooltipCloseTimerRef.current);
        tooltipCloseTimerRef.current = window.setTimeout(() => setSelectedKeyword(null), TOOLTIP_TRANSITION_MS);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
    };
  }, [tooltipOpen]);

  useEffect(() => {
    if (!selectedKeyword) return;
    const panel = keywordPanelRef.current;
    if (!panel) return;

    const escaped = selectedKeyword.replace(/"/g, '\\"');
    const btn = panel.querySelector(`.inquiry-keyword-button[data-keyword="${escaped}"]`) as HTMLElement | null;
    if (!btn) return;

    const panelRect = panel.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setKeywordArrowX(btnRect.left - panelRect.left + btnRect.width / 2);
  }, [selectedKeyword, keywordStats]);

  const selectedKeywordDetails = useMemo(() => {
    if (!selectedKeyword) return [];
    const lower = selectedKeyword.toLowerCase();

    return filteredRows
      .filter((row) => {
        return (
          row.title.toLowerCase().includes(lower) ||
          row.category.toLowerCase().includes(lower) ||
          row.content.toLowerCase().includes(lower)
        );
      })
      .slice(0, 6)
      .map((row) => {
        const source = row.content.toLowerCase().includes(lower)
          ? row.content
          : row.title.toLowerCase().includes(lower)
            ? row.title
            : `${row.category} ${row.title}`;
        return {
          id: row.id,
          title: row.title,
          snippet: extractSnippet(source, selectedKeyword),
        };
      });
  }, [filteredRows, selectedKeyword]);

  return (
    <div className="admin-list-page admin-list-page--inquiry">
      <h1 className="page-title">1:1 문의</h1>

      <section className="inquiry-stat-cards-wrap">
        <div className="admin-stat-cards admin-stat-cards--1-1-2">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <MessageSquareText size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">총 문의 수</p>
            <p className="admin-stat-value">{filteredRows.length}</p>
            <p className="admin-stat-hint">현재 필터 기준</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <Clock3 size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">미답변</p>
            <p className="admin-stat-value admin-stat-value--warning">{unansweredCount}</p>
            <p className="admin-stat-hint">답변 대기 건수</p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <BarChart3 size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">키워드 분석</p>
            {keywordStats.length === 0 ? (
              <p className="admin-stat-empty">표시할 키워드가 없습니다.</p>
            ) : (
              <>
                <div className="inquiry-keyword-panel" ref={keywordPanelRef}>
                  <div className="inquiry-keyword-buttons" role="list">
                    {keywordStats.map(({ word, count }) => (
                      <button
                        key={word}
                        type="button"
                        data-keyword={word}
                        className={[
                          'inquiry-keyword-button',
                          selectedKeyword === word ? 'inquiry-keyword-button--active' : '',
                        ].join(' ')}
                          onClick={(e) => {
                            const panel = keywordPanelRef.current;
                            const currentTarget = e.currentTarget as HTMLElement;
                            if (panel) {
                              const panelRect = panel.getBoundingClientRect();
                              const btnRect = currentTarget.getBoundingClientRect();
                              setKeywordArrowX(btnRect.left - panelRect.left + btnRect.width / 2);
                            }
                          if (tooltipCloseTimerRef.current) window.clearTimeout(tooltipCloseTimerRef.current);
                          setTooltipOpen(false);
                          setSelectedKeyword(word);
                          // 다음 프레임에 open 상태를 켜서 transition이 보이게 함
                          requestAnimationFrame(() => setTooltipOpen(true));
                          }}
                        aria-pressed={selectedKeyword === word}
                      >
                        {word}
                        <span className="inquiry-keyword-button__count">{count}</span>
                      </button>
                    ))}
                  </div>

                  {selectedKeyword ? (
                    <div
                      className={['inquiry-keyword-tooltip', tooltipOpen ? 'inquiry-keyword-tooltip--open' : ''].join(' ')}
                      role="status"
                      aria-live="polite"
                      style={{ ['--inquiry-keyword-arrow-x' as any]: `${keywordArrowX}px` }}
                    >
                      <div className="inquiry-keyword-tooltip__head">
                        <span className="inquiry-keyword-tooltip__label">"{selectedKeyword}" 포함 내용</span>
                        <button
                          type="button"
                          className="inquiry-keyword-tooltip__close"
                          onClick={() => {
                            if (tooltipCloseTimerRef.current) window.clearTimeout(tooltipCloseTimerRef.current);
                            setTooltipOpen(false);
                            tooltipCloseTimerRef.current = window.setTimeout(() => setSelectedKeyword(null), TOOLTIP_TRANSITION_MS);
                          }}
                          aria-label="툴팁 닫기"
                        >
                          닫기
                        </button>
                      </div>

                      {selectedKeywordDetails.length === 0 ? (
                        <p className="inquiry-keyword-tooltip__empty">해당 키워드를 포함한 내용이 없습니다.</p>
                      ) : (
                        <ul className="inquiry-keyword-tooltip__list">
                          {selectedKeywordDetails.map((item) => (
                            <li key={item.id} className="inquiry-keyword-tooltip__item">
                              <div className="inquiry-keyword-tooltip__item-title">{item.title}</div>
                              <div className="inquiry-keyword-tooltip__item-snippet">{item.snippet}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="inquiry-keyword-helper">키워드를 클릭하면 해당 내용이 표시됩니다.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="admin-list-box">
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
                aria-label="문의 검색"
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
                <th scope="col">제목</th>
                <th scope="col">답변 여부</th>
                <th scope="col">작성자</th>
                <th scope="col">이메일</th>
                <th scope="col">답변자</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td>
                    <Link to={inquiryDetailPath(row.id)} className="admin-link">
                      {row.title}
                    </Link>
                  </td>
                  <td>
                    <InquiryAnswerStatusCell answeredAt={row.answeredAt} />
                  </td>
                  <td>{row.authorName}</td>
                  <td>{row.email}</td>
                  <td>{row.answeredBy ?? '—'}</td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
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
    </div>
  );
}
