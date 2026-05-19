import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/Confirm';
import {
  getVisiblePageNumbers,
  jumpPageBack,
  jumpPageForward,
  PAGINATION_JUMP_PAGES,
} from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import './CompanyQuestionPage.css';
import CompanyQuestionDetailPage from './CompanyQuestionDetailPage';
import { companyQuestionDetailPath } from './companyQuestionPaths';
import type { CompanyQuestionRow } from './mock/companyQuestion.mock';
import { MOCK_COMPANY_QUESTIONS } from './mock/companyQuestion.mock';

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
  { value: 'author', label: '작성자' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
] as const;

type SearchScopeValue = (typeof SEARCH_SCOPE_OPTIONS)[number]['value'];

type AppliedCompanyQuestionSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  searchScope: SearchScopeValue;
  keyword: string;
};

type AppliedChipKey = 'date' | 'keyword';

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

function parseRequestedAt(value: string): Date {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function isAppliedSearchEmpty(s: AppliedCompanyQuestionSearch): boolean {
  return !s.dateRange && s.startDate == null && s.endDate == null && !s.keyword.trim();
}

function applyCompanyQuestionFilters(
  rows: CompanyQuestionRow[],
  search: AppliedCompanyQuestionSearch | null,
): CompanyQuestionRow[] {
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
    const requestedAt = parseRequestedAt(row.requestedAt);
    if (startBoundary && requestedAt < startBoundary) return false;
    if (endBoundary && requestedAt > endBoundary) return false;

    if (!keywordTrim) return true;

    if (search.searchScope === 'all') {
      return (
        row.id.toLowerCase().includes(keywordTrim) ||
        row.companyName.toLowerCase().includes(keywordTrim) ||
        row.contactName.toLowerCase().includes(keywordTrim) ||
        row.phone.toLowerCase().includes(keywordTrim) ||
        row.email.toLowerCase().includes(keywordTrim) ||
        row.title.toLowerCase().includes(keywordTrim) ||
        row.content.toLowerCase().includes(keywordTrim)
      );
    }
    if (search.searchScope === 'author') {
      return (
        row.contactName.toLowerCase().includes(keywordTrim) ||
        row.companyName.toLowerCase().includes(keywordTrim)
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

export default function CompanyQuestionPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [rows, setRows] = useState<CompanyQuestionRow[]>(() => [...MOCK_COMPANY_QUESTIONS]);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState<SearchScopeValue>('all');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedCompanyQuestionSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredRows = useMemo(
    () => applyCompanyQuestionFilters(rows, appliedSearch),
    [rows, appliedSearch],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, displayPage]);

  const deleteTargetRow = useMemo(
    () => (deleteTargetId ? (rows.find((row) => row.id === deleteTargetId) ?? null) : null),
    [deleteTargetId, rows],
  );

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
      chips.push({
        key: 'date',
        label: `요청일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `요청일: ${appliedSearch.dateRange}` });
    }

    const kw = appliedSearch.keyword.trim();
    if (kw) {
      chips.push({
        key: 'keyword',
        label: `상세검색: ${scopeLabel(appliedSearch.searchScope)} ${kw}`,
      });
    }

    return chips;
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: AppliedCompanyQuestionSearch = {
      dateRange,
      startDate,
      endDate,
      searchScope,
      keyword,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next: AppliedCompanyQuestionSearch = { ...appliedSearch };

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
      default:
        break;
    }

    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  if (subId) {
    return <CompanyQuestionDetailPage />;
  }

  return (
    <div className="admin-list-page admin-list-page--feelframe-company-question">
      <h1 className="page-title">기업문의</h1>

      <section className="admin-list-box" aria-label="기업문의 검색 필터">
        <div className="filter-top-row admin-filter-row--no-detail">
          <div className="filter-section">
            <span className="filter-label">요청일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="요청일 프리셋"
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
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="기업문의 검색어"
              />
            </div>
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="기업문의 목록">
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
                <th scope="col">접수번호</th>
                <th scope="col">기업명</th>
                <th scope="col">전화번호</th>
                <th scope="col">이메일</th>
                <th scope="col" className="col-center">
                  진행현황
                </th>
                <th scope="col">요청일</th>
                <th scope="col" className="col-center">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        to={companyQuestionDetailPath(row.id)}
                        className="admin-link admin-table-title-link"
                        title={row.id}
                      >
                        {row.id}
                      </Link>
                    </td>
                    <td>{row.companyName}</td>
                    <td>{row.phone}</td>
                    <td>{row.email}</td>
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
                    <td>{row.requestedAt}</td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-btn row-btn--red"
                        onClick={() => setDeleteTargetId(row.id)}
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
        title="기업문의 삭제"
        message={
          deleteTargetRow
            ? `"${deleteTargetRow.companyName}" (${deleteTargetRow.id}) 문의를 삭제할까요?`
            : ''
        }
        confirmText="삭제"
        danger
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (!deleteTargetId) return;
          setRows((prev) => prev.filter((item) => item.id !== deleteTargetId));
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
