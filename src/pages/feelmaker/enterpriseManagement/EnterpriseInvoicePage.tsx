import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../orderManagement/OrderListPage.css';
import { Link } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import type { EnterpriseInvoiceRow } from './mock/enterpriseInvoiceList.mock';
import { MOCK_ENTERPRISE_INVOICES } from './mock/enterpriseInvoiceList.mock';
import { enterpriseDetailPath } from './enterprisePaths';

const SEARCH_SCOPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'companyName', label: '업체명' },
  { value: 'applicantName', label: '신청자명' },
];

export default function EnterpriseInvoicePage() {
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState('');
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState<EnterpriseInvoiceRow[]>(() => [...MOCK_ENTERPRISE_INVOICES]);
  const [appliedSearch, setAppliedSearch] = useState<{
    dateRange: string;
    startDate: Date | null;
    endDate: Date | null;
    searchScope: string;
    keyword: string;
  } | null>(null);
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

    return rows.filter((row) => {
      const appliedAt = new Date(row.appliedAt.replace(' ', 'T'));
      if (startBoundary && appliedAt < startBoundary) return false;
      if (endBoundary && appliedAt > endBoundary) return false;

      if (keywordTrim) {
        if (appliedSearch.searchScope === 'companyName' && !row.companyName.toLowerCase().includes(keywordTrim)) return false;
        if (appliedSearch.searchScope === 'applicantName' && !row.applicantName.toLowerCase().includes(keywordTrim)) return false;
        if (!appliedSearch.searchScope) {
          if (!row.companyName.toLowerCase().includes(keywordTrim) && !row.applicantName.toLowerCase().includes(keywordTrim)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [rows, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / 10));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredRows.slice(start, start + 10);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  const handleSearch = () => {
    const next = { dateRange, startDate, endDate, searchScope, keyword };
    const isEmpty = !next.dateRange && !next.startDate && !next.endDate && !next.keyword.trim();
    setAppliedSearch(isEmpty ? null : next);
  };

  const handleIssueInvoice = (id: string) => {
    const now = new Date();
    const issuedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, issuedAt } : row)));
  };

  const appliedChips = useMemo(() => {
    if (!appliedSearch) return [] as Array<{ key: 'date' | 'keyword'; label: string }>;
    const chips: Array<{ key: 'date' | 'keyword'; label: string }> = [];
    const formatYmd = (d: Date | null) => {
      if (!d) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `신청일: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `신청일: ${appliedSearch.dateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      const scopeLabel = SEARCH_SCOPE_OPTIONS.find((o) => o.value === appliedSearch.searchScope)?.label ?? '전체';
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel} ${appliedSearch.keyword}` });
    }
    return chips;
  }, [appliedSearch]);

  const clearAppliedFilter = (key: 'date' | 'keyword') => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    if (key === 'date') {
      setDateRange('');
      setStartDate(null);
      setEndDate(null);
      next.dateRange = '';
      next.startDate = null;
      next.endDate = null;
    } else {
      setSearchScope('');
      setKeyword('');
      next.searchScope = '';
      next.keyword = '';
    }
    const isEmpty = !next.dateRange && !next.startDate && !next.endDate && !next.keyword.trim();
    setAppliedSearch(isEmpty ? null : next);
  };

  const summaryCount = appliedSearch ? filteredRows.length : 706;
  const unpaidCount = appliedSearch ? Math.max(0, Math.floor(filteredRows.length * 0.007)) : 5;

  return (
    <div className="admin-list-page">
      <h1 className="page-title">세금계산서 신청 목록</h1>

      <section className="admin-list-box" aria-label="검색 결과 요약">
        <p className="admin-list-result">
          총 {summaryCount.toLocaleString()}개의 주문이 검색되었습니다. 미결제건은 {unpaidCount}개 입니다.
        </p>
      </section>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row admin-filter-row--no-detail">
          <div className="filter-section">
            <span className="filter-label">신청일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="신청일 프리셋"
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
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
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
                aria-label="세금계산서 신청 검색"
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

      <section className="admin-list-box admin-list-box--table" aria-label="세금계산서 신청 목록 테이블">
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
          <table className="admin-table admin-table--enterprise-invoices">
            <thead>
              <tr>
                <th>NO</th>
                <th>신청자</th>
                <th>전화번호</th>
                <th>이메일</th>
                <th>신청일</th>
                <th>발행일</th>
                <th>업체명</th>
                <th>금액</th>
                <th>사업자번호</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.displayNo}</td>
                  <td>{row.applicantName}</td>
                  <td>{row.phone}</td>
                  <td>{row.email}</td>
                  <td>{row.appliedAt}</td>
                  <td>
                    {row.issuedAt ? (
                      row.issuedAt
                    ) : (
                      <span className="cell-line--with-action">
                        발행안됨
                        <button
                          type="button"
                          className="badge-square badge-square--inline badge-square--private"
                          onClick={() => handleIssueInvoice(row.id)}
                        >
                          발행
                        </button>
                      </span>
                    )}
                  </td>
                  <td className="admin-table-col-title">
                    <Link to={enterpriseDetailPath(row.enterpriseId)} className="admin-link admin-table-title-link">
                      {row.companyName}
                    </Link>
                  </td>
                  <td>{row.amount.toLocaleString()}원</td>
                  <td>{row.businessNo}</td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
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
    </div>
  );
}
