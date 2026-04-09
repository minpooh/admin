import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import NoticeDetailPage from './NoticeDetailPage';
import { NOTICE_NEW_SUB_ID, noticeDetailPath, noticeListPath, noticeNewPath } from './noticePaths';
import type { NoticeRow } from './mock/notice.mock';
import { NOTICE_ROWS_MOCK } from './mock/notice.mock';

const SEARCH_SCOPE_OPTIONS = [
  { value: 'title', label: '제목' },
  { value: 'content', label: '내용' },
  { value: 'author', label: '작성자' },
];

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  searchScope: string;
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

function isAppliedSearchEmpty(s: AppliedSearch) {
  return !s.dateRange && s.startDate == null && s.endDate == null && !s.keyword.trim();
}

function buildNewNoticeDraftRow(): NoticeRow {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: NOTICE_NEW_SUB_ID,
    pinned: false,
    title: '',
    createdAt: today,
    createdBy: '관리자',
    content: '',
  };
}

export default function NoticePage() {
  const { subId } = useParams<{ subId?: string }>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<NoticeRow[]>(() => [...NOTICE_ROWS_MOCK]);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState('title');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return rows;

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

    return rows.filter((row) => {
      const createdAt = new Date(`${row.createdAt}T12:00:00`);
      if (startBoundary && createdAt < startBoundary) return false;
      if (endBoundary && createdAt > endBoundary) return false;

      if (keywordTrim) {
        if (appliedSearch.searchScope === 'title') {
          if (!row.title.toLowerCase().includes(keywordTrim)) return false;
        } else if (appliedSearch.searchScope === 'content') {
          if (!row.content.toLowerCase().includes(keywordTrim)) return false;
        } else if (appliedSearch.searchScope === 'author') {
          if (!row.createdBy.toLowerCase().includes(keywordTrim)) return false;
        }
      }
      return true;
    });
  }, [rows, appliedSearch]);

  const resultCount = filteredRows.length;
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
      const scopeLabel = SEARCH_SCOPE_OPTIONS.find((o) => o.value === appliedSearch.searchScope)?.label ?? '제목';
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel} ${appliedSearch.keyword}` });
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
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
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
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const handleDeleteRow = (id: string) => {
    if (!window.confirm('이 공지를 삭제하시겠습니까?')) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddNotice = () => {
    navigate(noticeNewPath());
  };

  if (subId) {
    if (subId === NOTICE_NEW_SUB_ID) {
      const draftRow = buildNewNoticeDraftRow();
      return (
        <NoticeDetailPage
          key={NOTICE_NEW_SUB_ID}
          row={draftRow}
          isCreate
          onCancelCreate={() => navigate(noticeListPath)}
          onSave={(next) => {
            const id = `notice-${crypto.randomUUID()}`;
            const today = new Date().toISOString().slice(0, 10);
            const created: NoticeRow = {
              ...next,
              id,
              createdAt: today,
              createdBy: next.createdBy || '관리자',
            };
            setRows((prev) => [created, ...prev]);
            setCurrentPage(1);
            navigate(noticeDetailPath(id), { replace: true });
          }}
        />
      );
    }

    const detailRow = rows.find((row) => row.id === subId);
    if (!detailRow) {
      return (
        <div className="admin-list-page">
          <div className="admin-detail-header">
            <Link to={noticeListPath} className="admin-detail-back">
              ← 목록
            </Link>
            <h1 className="page-title">공지사항 상세</h1>
          </div>
          <section className="admin-list-box">
            <p className="admin-list-result">공지를 찾을 수 없습니다.</p>
          </section>
        </div>
      );
    }

    return (
      <NoticeDetailPage
        key={detailRow.id}
        row={detailRow}
        onSave={(next) => {
          setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)));
        }}
      />
    );
  }

  return (
    <div className="admin-list-page">
      <h1 className="page-title">공지사항관리</h1>

      <section className="admin-list-box">
        <p className="admin-list-result">검색 결과 {resultCount}건</p>
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
                  if (next === '당일') {
                    setStartDate(start);
                    setEndDate(end);
                    return;
                  }
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
            <span className="filter-label">조건검색</span>
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
                aria-label="공지 검색"
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

      <section className="admin-list-box admin-list-box--table" aria-label="공지 목록">
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
          <table className="admin-table">
            <thead>
              <tr>
                <th>상단고정</th>
                <th>제목</th>
                <th>작성일</th>
                <th>작성자</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.pinned ? '고정' : '미고정'}</td>
                  <td className="admin-table-col-title">
                    <Link to={noticeDetailPath(row.id)} className="admin-link admin-table-title-link">
                      {row.title}
                    </Link>
                  </td>
                  <td>{row.createdAt}</td>
                  <td>{row.createdBy}</td>
                  <td className="col-center">
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      aria-label={`${row.title} 삭제`}
                      title="삭제"
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
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
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                aria-label="마지막 페이지"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-list-add-row">
        <button type="button" className="admin-list-add-btn" onClick={handleAddNotice} aria-label="공지 추가">
          <Plus size={18} aria-hidden="true" />
          공지 추가
        </button>
      </div>
    </div>
  );
}
