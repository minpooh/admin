import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { CircleAlert, CircleCheck, Clock3, Trash2, TriangleAlert } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import Confirm from '../../../components/Confirm';
import './InquiryPage.css';
import {
  getFeelaiAiErrorStatus,
  MOCK_FEELAI_AI_ERRORS,
  type FeelaiAiErrorRow,
  type FeelaiAiErrorStatus,
} from './mock/aiErrorCheck.mock';
import AiErrorCheckDetailPage from './AiErrorCheckDetailPage';
import { aiErrorCheckDetailPath } from './aiErrorCheckPaths';

const SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'name', label: '이름' },
  { value: 'phone', label: '전화번호' },
  { value: 'title', label: '제목' },
];

type StatusFilterValue = '' | FeelaiAiErrorStatus;

function AiErrorStatusCell({ status }: { status: FeelaiAiErrorStatus }) {
  return <span className={['admin-status-pill', `admin-status-pill--${status}`].join(' ')}>{status}</span>;
}

export default function AiErrorCheckPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('');
  const [errorRows, setErrorRows] = useState<FeelaiAiErrorRow[]>(() => [...MOCK_FEELAI_AI_ERRORS]);
  const [deleteTargetErrorId, setDeleteTargetErrorId] = useState<string | null>(null);

  const [appliedSearch, setAppliedSearch] = useState<{
    dateRange: string;
    startDate: Date | null;
    endDate: Date | null;
    searchScope: string;
    keyword: string;
    statusFilter: StatusFilterValue;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return errorRows;

    const keywordTrim = appliedSearch.keyword.trim().toLowerCase();
    const startBoundary = appliedSearch.startDate
      ? new Date(
          appliedSearch.startDate.getFullYear(),
          appliedSearch.startDate.getMonth(),
          appliedSearch.startDate.getDate(),
          0,
          0,
          0,
          0,
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
          999,
        )
      : null;

    return errorRows.filter((row) => {
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

      const status = getFeelaiAiErrorStatus(row);
      if (appliedSearch.statusFilter === '대기중' && status !== '대기중') return false;
      if (appliedSearch.statusFilter === '처리완료' && status !== '처리완료') return false;

      if (keywordTrim) {
        const normalizedKeyword = keywordTrim.replace(/[^0-9]/g, '');
        const matchAll =
          row.title.toLowerCase().includes(keywordTrim) ||
          row.authorName.toLowerCase().includes(keywordTrim) ||
          row.memberId.toLowerCase().includes(keywordTrim) ||
          row.phone.toLowerCase().includes(keywordTrim) ||
          row.email.toLowerCase().includes(keywordTrim) ||
          row.content.toLowerCase().includes(keywordTrim);
        const scope = appliedSearch.searchScope;
        if (scope === 'all') {
          if (!matchAll) return false;
        } else if (scope === 'name') {
          if (!row.authorName.toLowerCase().includes(keywordTrim)) return false;
        } else if (scope === 'phone') {
          const phoneHaystack = [row.title, row.content, row.memberId, row.phone, row.email].join(' ');
          const normalizedPhoneHaystack = phoneHaystack.replace(/[^0-9]/g, '');
          if (!normalizedKeyword || !normalizedPhoneHaystack.includes(normalizedKeyword)) return false;
        } else if (scope === 'title') {
          if (!row.title.toLowerCase().includes(keywordTrim)) return false;
        }
      }

      return true;
    });
  }, [appliedSearch, errorRows]);

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
      statusFilter,
    });
  };

  const formatYmd = (d: Date | null) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  type AppliedChipKey = 'date' | 'keyword' | 'status';
  const isAppliedSearchEmpty = (s: typeof appliedSearch) => {
    if (!s) return true;
    return !s.dateRange && s.startDate == null && s.endDate == null && !s.keyword.trim() && !s.statusFilter;
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
    } else if (key === 'status') {
      setStatusFilter('');
      next.statusFilter = '';
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
      chips.push({
        key: 'keyword',
        label: `검색: ${scopeLabel(appliedSearch.searchScope)} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.statusFilter) {
      chips.push({ key: 'status', label: `처리여부: ${appliedSearch.statusFilter}` });
    }
    return chips;
  }, [appliedSearch]);

  const summary = useMemo(() => {
    let urgentCount = 0;
    let doneCount = 0;
    let waitingCount = 0;
    for (const row of filteredRows) {
      if (row.urgent) urgentCount += 1;
      if (getFeelaiAiErrorStatus(row) === '처리완료') doneCount += 1;
      else waitingCount += 1;
    }
    return {
      totalCount: filteredRows.length,
      urgentCount,
      doneCount,
      waitingCount,
    };
  }, [filteredRows]);

  const deleteTargetError = useMemo(
    () => (deleteTargetErrorId ? (errorRows.find((row) => row.id === deleteTargetErrorId) ?? null) : null),
    [deleteTargetErrorId, errorRows],
  );

  if (subId) return <AiErrorCheckDetailPage />;

  return (
    <div className="admin-list-page admin-list-page--inquiry admin-list-page--feelai-ai-error">
      <h1 className="page-title">AI 오류확인</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="AI 오류확인 요약">
        <div className="admin-stat-cards admin-stat-cards--4">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <CircleAlert size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">오류확인 수</p>
            <p className="admin-stat-value">{summary.totalCount}</p>
            <p className="admin-stat-hint">현재 필터 기준</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <TriangleAlert size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">긴급오류 수</p>
            <p className="admin-stat-value admin-stat-value--warning">{summary.urgentCount}</p>
            <p className="admin-stat-hint">긴급 처리 대상</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <CircleCheck size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">처리완료</p>
            <p className="admin-stat-value">{summary.doneCount}</p>
            <p className="admin-stat-hint">처리가 끝난 건수</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--gray" aria-hidden>
              <Clock3 size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">대기중</p>
            <p className="admin-stat-value">{summary.waitingCount}</p>
            <p className="admin-stat-hint">처리 대기 건수</p>
          </div>
        </div>
      </section>

      <section className="admin-list-box">
        <div className="filter-top-row admin-filter-row--equal-4">
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
                  if (next === '3개월') start.setDate(start.getDate() - 89);
                  if (next === '6개월') start.setDate(start.getDate() - 179);
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
                  { value: '3개월', label: '3개월' },
                  { value: '6개월', label: '6개월' },
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
                aria-label="오류 검색"
              />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">처리여부</span>
            <ListSelect
              ariaLabel="처리여부"
              value={statusFilter}
              onChange={(next) => setStatusFilter(next as StatusFilterValue)}
              options={[
                { value: '', label: '전체' },
                { value: '대기중', label: '대기중' },
                { value: '처리완료', label: '처리완료' },
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
                <th scope="col" className="col-center">
                  번호
                </th>
                <th scope="col">작성일</th>
                <th scope="col">제목</th>
                <th scope="col">처리여부</th>
                <th scope="col">작성자</th>
                <th scope="col">아이디</th>
                <th scope="col">연락처</th>
                <th scope="col">처리자</th>
                <th scope="col">처리일</th>
                <th scope="col">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td className="col-center">#{row.no}</td>
                  <td>{row.createdAt}</td>
                  <td className="admin-table-col-title">
                    <span className="ai-error-title">
                      {row.urgent ? (
                        <span className="badge-square badge-square--inline badge-square--danger badge-square--no-transition badge-square--no-margin">
                          긴급
                        </span>
                      ) : null}
                      <Link to={aiErrorCheckDetailPath(row.id)} className="admin-link admin-table-title-link">
                        {row.title}
                      </Link>
                    </span>
                  </td>
                  <td>
                    <AiErrorStatusCell status={getFeelaiAiErrorStatus(row)} />
                  </td>
                  <td>{row.authorName}</td>
                  <td>{row.memberId}</td>
                  <td>{row.phone}</td>
                  <td>{row.processedBy ?? '—'}</td>
                  <td>{row.processedAt ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      onClick={() => setDeleteTargetErrorId(row.id)}
                      aria-label={`${row.title} 오류 삭제`}
                      title="삭제"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="admin-table-empty-cell">
                    데이터가 없습니다.
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
        open={Boolean(deleteTargetError)}
        title="오류 삭제"
        message={deleteTargetError ? `"${deleteTargetError.title}" 오류를 삭제할까요?` : ''}
        confirmText="삭제"
        danger
        onClose={() => setDeleteTargetErrorId(null)}
        onConfirm={() => {
          if (!deleteTargetErrorId) return;
          setErrorRows((prev) => prev.filter((row) => row.id !== deleteTargetErrorId));
          setDeleteTargetErrorId(null);
        }}
      />
    </div>
  );
}
