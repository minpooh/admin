import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { BarChart3, Clock3, MessageSquareText } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import './QuestionPage.css';
import type { FeelframeQuestionRow } from './mock/question.mock';
import { MOCK_FEELFRAME_QUESTIONS } from './mock/question.mock';
import QuestionDetailPage from './QuestionDetailPage';
import { questionDetailPath } from './questionPaths';

const SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'name', label: '이름' },
  { value: 'id', label: '아이디' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '작성내용' },
] as const;

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

const CATEGORY_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: '회원문의', label: '회원문의' },
  { value: '주문/결제', label: '주문/결제' },
  { value: '취소/환불', label: '취소/환불' },
  { value: '시안/수정', label: '시안/수정' },
  { value: '배송/제작', label: '배송/제작' },
  { value: '공동구매', label: '공동구매' },
  { value: '기타', label: '기타' },
] as const;

const ANSWER_STATUS_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: '미답변', label: '미답변' },
  { value: '답변완료', label: '답변완료' },
] as const;

type AnswerFilterValue = (typeof ANSWER_STATUS_OPTIONS)[number]['value'];

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  searchScope: (typeof SEARCH_SCOPE_OPTIONS)[number]['value'];
  keyword: string;
  category: string;
  answerStatus: AnswerFilterValue;
};

type AppliedChipKey = 'date' | 'keyword' | 'category' | 'answer';

const ITEMS_PER_PAGE = 10;
const TOOLTIP_TRANSITION_MS = 180;

/** 검색 결과 제목·카테고리에서 빈도 상위 키워드 (목업 분석) */
function keywordStatsFromRows(rows: FeelframeQuestionRow[]) {
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

function formatYmd(d: Date | null) {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isAppliedSearchEmpty(s: AppliedSearch) {
  return (
    !s.dateRange &&
    s.startDate == null &&
    s.endDate == null &&
    !s.keyword.trim() &&
    !s.category &&
    !s.answerStatus
  );
}

function applyQuestionFilters(rows: FeelframeQuestionRow[], search: AppliedSearch | null) {
  if (!search) return rows;

  const keywordTrim = search.keyword.trim().toLowerCase();

  const startBoundary = search.startDate
    ? new Date(
        search.startDate.getFullYear(),
        search.startDate.getMonth(),
        search.startDate.getDate(),
        0,
        0,
        0,
        0,
      )
    : null;
  const endBoundary = search.endDate
    ? new Date(
        search.endDate.getFullYear(),
        search.endDate.getMonth(),
        search.endDate.getDate(),
        23,
        59,
        59,
        999,
      )
    : null;

  return rows.filter((row) => {
    const createdAt = new Date(row.createdAt.replace(' ', 'T'));
    if (startBoundary && createdAt < startBoundary) return false;
    if (endBoundary && createdAt > endBoundary) return false;

    if (search.category && row.category !== search.category) return false;

    if (search.answerStatus === '미답변' && row.answeredAt !== null) return false;
    if (search.answerStatus === '답변완료' && row.answeredAt === null) return false;

    if (keywordTrim) {
      const phoneKeyword = keywordTrim.replace(/[^0-9]/g, '');
      const matchAll =
        row.title.toLowerCase().includes(keywordTrim) ||
        row.content.toLowerCase().includes(keywordTrim) ||
        row.authorName.toLowerCase().includes(keywordTrim) ||
        row.memberId.toLowerCase().includes(keywordTrim) ||
        (phoneKeyword.length > 0 && row.authorPhone.replace(/[^0-9]/g, '').includes(phoneKeyword));

      if (search.searchScope === 'all') {
        if (!matchAll) return false;
      } else if (search.searchScope === 'name') {
        if (!row.authorName.toLowerCase().includes(keywordTrim)) return false;
      } else if (search.searchScope === 'id') {
        if (!row.memberId.toLowerCase().includes(keywordTrim)) return false;
      } else if (search.searchScope === 'title') {
        if (!row.title.toLowerCase().includes(keywordTrim)) return false;
      } else if (search.searchScope === 'content') {
        if (!row.content.toLowerCase().includes(keywordTrim)) return false;
      }
    }

    return true;
  });
}

export default function QuestionPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [rows, setRows] = useState<FeelframeQuestionRow[]>(() => [...MOCK_FEELFRAME_QUESTIONS]);
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState<(typeof SEARCH_SCOPE_OPTIONS)[number]['value']>('all');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [answerStatus, setAnswerStatus] = useState<AnswerFilterValue>('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetQuestionId, setDeleteTargetQuestionId] = useState<string | null>(null);

  const filteredRows = useMemo(
    () => applyQuestionFilters(rows, appliedSearch),
    [rows, appliedSearch],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const deleteTargetQuestion = useMemo(
    () =>
      deleteTargetQuestionId
        ? (rows.find((row) => row.id === deleteTargetQuestionId) ?? null)
        : null,
    [deleteTargetQuestionId, rows],
  );

  const unansweredCount = useMemo(
    () => filteredRows.filter((row) => row.answeredAt === null).length,
    [filteredRows],
  );

  const keywordStats = useMemo(() => keywordStatsFromRows(filteredRows), [filteredRows]);

  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const keywordPanelRef = useRef<HTMLDivElement | null>(null);
  const [keywordArrowX, setKeywordArrowX] = useState(0);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipCloseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedKeyword((prev) => {
      if (!prev) return prev;
      if (keywordStats.some((k) => k.word === prev)) return prev;

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
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [tooltipOpen]);

  useEffect(() => {
    if (!selectedKeyword) return;
    const panel = keywordPanelRef.current;
    if (!panel) return;

    const escaped = selectedKeyword.replace(/"/g, '\\"');
    const btn = panel.querySelector(`.admin-stat-keyword-button[data-keyword="${escaped}"]`) as HTMLElement | null;
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

  const scopeLabel = (scope: string) =>
    SEARCH_SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope;

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
        label: `상세검색: ${scopeLabel(appliedSearch.searchScope)} ${appliedSearch.keyword.trim()}`,
      });
    }

    if (appliedSearch.category) {
      chips.push({ key: 'category', label: `카테고리: ${appliedSearch.category}` });
    }

    if (appliedSearch.answerStatus) {
      chips.push({ key: 'answer', label: `답변상황: ${appliedSearch.answerStatus}` });
    }

    return chips;
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      searchScope,
      keyword,
      category,
      answerStatus,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
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
        setSearchScope('all');
        next.keyword = '';
        next.searchScope = 'all';
        break;
      case 'category':
        setCategory('');
        next.category = '';
        break;
      case 'answer':
        setAnswerStatus('');
        next.answerStatus = '';
        break;
      default:
        break;
    }

    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const handleDeleteRow = (id: string) => {
    setDeleteTargetQuestionId(id);
  };

  if (subId) {
    return <QuestionDetailPage />;
  }

  return (
    <div className="admin-list-page admin-list-page--feelframe-question">
      <h1 className="page-title">1:1 문의</h1>


      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="문의 요약">
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
                <div className="admin-stat-keyword-panel" ref={keywordPanelRef}>
                  <div className="admin-stat-keyword-buttons" role="list">
                    {keywordStats.map(({ word, count }) => (
                      <button
                        key={word}
                        type="button"
                        data-keyword={word}
                        className={[
                          'admin-stat-keyword-button',
                          selectedKeyword === word ? 'admin-stat-keyword-button--active' : '',
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
                          requestAnimationFrame(() => setTooltipOpen(true));
                        }}
                        aria-pressed={selectedKeyword === word}
                      >
                        {word}
                        <span className="admin-stat-keyword-button__count">{count}</span>
                      </button>
                    ))}
                  </div>

                  {selectedKeyword ? (
                    <div
                      className={['admin-stat-keyword-tooltip', tooltipOpen ? 'admin-stat-keyword-tooltip--open' : ''].join(' ')}
                      role="status"
                      aria-live="polite"
                      style={
                        {
                          ['--admin-stat-keyword-arrow-x' as string]: `${keywordArrowX}px`,
                        } as CSSProperties
                      }
                    >
                      <div className="admin-stat-keyword-tooltip__head">
                        <span className="admin-stat-keyword-tooltip__label">"{selectedKeyword}" 포함 내용</span>
                        <button
                          type="button"
                          className="admin-stat-keyword-tooltip__close"
                          onClick={() => {
                            if (tooltipCloseTimerRef.current) window.clearTimeout(tooltipCloseTimerRef.current);
                            setTooltipOpen(false);
                            tooltipCloseTimerRef.current = window.setTimeout(
                              () => setSelectedKeyword(null),
                              TOOLTIP_TRANSITION_MS,
                            );
                          }}
                          aria-label="툴팁 닫기"
                        >
                          닫기
                        </button>
                      </div>

                      {selectedKeywordDetails.length === 0 ? (
                        <p className="admin-stat-keyword-tooltip__empty">해당 키워드를 포함한 내용이 없습니다.</p>
                      ) : (
                        <ul className="admin-stat-keyword-tooltip__list">
                          {selectedKeywordDetails.map((item) => (
                            <li key={item.id} className="admin-stat-keyword-tooltip__item">
                              <div className="admin-stat-keyword-tooltip__item-title">{item.title}</div>
                              <div className="admin-stat-keyword-tooltip__item-snippet">{item.snippet}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="admin-stat-keyword-helper">키워드를 클릭하면 해당 내용이 표시됩니다.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      <section className="admin-list-box admin-list-box--filter" aria-label="검색·필터">
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
                onChange={(next) =>
                  setSearchScope(next as (typeof SEARCH_SCOPE_OPTIONS)[number]['value'])
                }
                options={[...SEARCH_SCOPE_OPTIONS]}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="문의 상세검색"
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
            <span className="filter-label">카테고리</span>
            <ListSelect
              ariaLabel="카테고리"
              value={category}
              onChange={setCategory}
              options={[...CATEGORY_OPTIONS]}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">답변상황</span>
            <ListSelect
              ariaLabel="답변상황"
              value={answerStatus}
              onChange={(next) => setAnswerStatus(next as AnswerFilterValue)}
              options={[...ANSWER_STATUS_OPTIONS]}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="문의 목록">
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
          <table className="admin-table admin-table--min-w-800">
            <thead>
              <tr>
                <th scope="col">카테고리</th>
                <th scope="col">제목</th>
                <th scope="col">내용</th>
                <th scope="col">작성일</th>
                <th scope="col">작성자</th>
                <th scope="col" className="col-center">답변자</th>
                <th scope="col" className="col-center">
                  답변상태
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
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.category}</td>
                    <td className="admin-table-col-title">
                      <Link
                        to={questionDetailPath(row.id)}
                        className="admin-link admin-table-title-link"
                        title={row.title}
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="admin-table-col-content" title={row.content}>
                      {row.content}
                    </td>
                    <td>{row.createdAt}</td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.authorName}</span>
                        <span className="cell-line admin-list-muted">{row.memberId}</span>
                        <span className="cell-line admin-list-muted">{row.authorPhone}</span>
                      </div>
                    </td>
                    <td className="col-center">{row.answeredBy ?? '—'}</td>
                    <td className="col-center">
                      <div className="cell-block">
                        <span className="cell-line">
                          <span
                            className={[
                              'admin-status-pill',
                              row.answeredAt !== null
                                ? 'admin-status-pill--답변완료'
                                : 'admin-status-pill--미답변',
                            ].join(' ')}
                          >
                            {row.answeredAt !== null ? '답변완료' : '미답변'}
                          </span>
                        </span>
                        {row.answeredAt ? (
                          <span className="cell-line admin-list-muted">{row.answeredAt}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-btn row-btn--red"
                        onClick={() => handleDeleteRow(row.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
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
                disabled={currentPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => jumpPageForward(p, totalPages))}
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
        open={Boolean(deleteTargetQuestion)}
        title="문의 삭제"
        message={
          deleteTargetQuestion ? `"${deleteTargetQuestion.title}" 문의를 삭제할까요?` : ''
        }
        confirmText="삭제"
        danger
        onClose={() => setDeleteTargetQuestionId(null)}
        onConfirm={() => {
          if (!deleteTargetQuestionId) return;
          setRows((prev) => prev.filter((item) => item.id !== deleteTargetQuestionId));
          setDeleteTargetQuestionId(null);
        }}
      />
    </div>
  );
}
