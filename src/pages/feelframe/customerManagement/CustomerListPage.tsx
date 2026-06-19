import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import { pagePath } from '../../../routes';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import {
  MOCK_FEELFRAME_CUSTOMER_LIST,
  SNS_LABELS,
  type FeelframeCustomerRow,
} from './mock/customerList.mock';
import CustomerDetailPage from './CustomerDetailPage';

const LIST_PATH = pagePath({
  navId: 'feelframe',
  sectionId: 'customerManagement',
  itemId: 'customerList',
});

const DATE_PRESET_OPTIONS = [
  { value: '', label: '미선택' },
  { value: '당일', label: '당일' },
  { value: '3일', label: '3일' },
  { value: '1주', label: '1주' },
  { value: '2주', label: '2주' },
  { value: '1개월', label: '1개월' },
  { value: '3개월', label: '3개월' },
  { value: '6개월', label: '6개월' },
];

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'name', label: '이름' },
  { value: 'id', label: '아이디' },
  { value: 'phone', label: '전화번호' },
];

const MARKETING_CONSENT_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'agree', label: '동의' },
  { value: 'disagree', label: '미동의' },
];

const PET_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'yes', label: '있음' },
  { value: 'no', label: '없음' },
];

const ITEMS_PER_PAGE = 10;

type CustomerAppliedSearch = {
  joinDateRange: string;
  joinStartDate: Date | null;
  joinEndDate: Date | null;
  weddingDateRange: string;
  weddingStartDate: Date | null;
  weddingEndDate: Date | null;
  searchScope: string;
  keyword: string;
  marketingConsent: string;
  hasPet: string;
};

type AppliedChipKey = 'joinDate' | 'weddingDate' | 'keyword' | 'marketing' | 'hasPet';

function formatYmd(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isAppliedSearchEmpty(s: CustomerAppliedSearch): boolean {
  const noJoin = !s.joinDateRange && !s.joinStartDate && !s.joinEndDate;
  const noWed = !s.weddingDateRange && !s.weddingStartDate && !s.weddingEndDate;
  const noKw = !s.keyword.trim();
  const noMkt = !s.marketingConsent;
  const noPet = !s.hasPet;
  return noJoin && noWed && noKw && noMkt && noPet;
}

function applyDatePreset(next: string, setStart: (d: Date | null) => void, setEnd: (d: Date | null) => void) {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  if (next === '당일') {
    setStart(start);
    setEnd(end);
    return;
  }
  if (next === '3일') start.setDate(start.getDate() - 2);
  if (next === '1주') start.setDate(start.getDate() - 6);
  if (next === '2주') start.setDate(start.getDate() - 13);
  if (next === '1개월') start.setDate(start.getDate() - 29);
  if (next === '3개월') start.setDate(start.getDate() - 89);
  if (next === '6개월') start.setDate(start.getDate() - 179);
  setStart(start);
  setEnd(end);
}

function parseDateOnly(value: string): Date | null {
  if (!value || value === '-') return null;
  const head = value.split(' ')[0];
  const [y, m, d] = head.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isWithinRange(value: string, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const d = parseDateOnly(value);
  if (!d) return false;
  if (start && d < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
  if (end && d > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return false;
  return true;
}

function customerDetailPath(id: string) {
  return pagePath({
    navId: 'feelframe',
    sectionId: 'customerManagement',
    itemId: 'customerList',
    subId: id,
  });
}

export default function CustomerListPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [joinDateRange, setJoinDateRange] = useState('');
  const [joinStartDate, setJoinStartDate] = useState<Date | null>(null);
  const [joinEndDate, setJoinEndDate] = useState<Date | null>(null);

  const [weddingDateRange, setWeddingDateRange] = useState('');
  const [weddingStartDate, setWeddingStartDate] = useState<Date | null>(null);
  const [weddingEndDate, setWeddingEndDate] = useState<Date | null>(null);

  const [searchScope, setSearchScope] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [marketingConsent, setMarketingConsent] = useState('');
  const [hasPet, setHasPet] = useState('');
  const [detailOpen, setDetailOpen] = useState(true);

  const [appliedSearch, setAppliedSearch] = useState<CustomerAppliedSearch | null>(null);

  const [rows] = useState<FeelframeCustomerRow[]>(() => [...MOCK_FEELFRAME_CUSTOMER_LIST]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return rows;
    const a = appliedSearch;
    const kw = a.keyword.trim().toLowerCase();
    const normalizedKw = kw.replace(/[^0-9]/g, '');

    return rows.filter((row) => {
      if (!isWithinRange(row.joinDate, a.joinStartDate, a.joinEndDate)) return false;
      if (!isWithinRange(row.weddingDate, a.weddingStartDate, a.weddingEndDate)) return false;

      if (kw) {
        if (a.searchScope === 'all') {
          const phoneDigits = row.phone.replace(/[^0-9]/g, '');
          if (
            !row.name.toLowerCase().includes(kw) &&
            !row.loginId.toLowerCase().includes(kw) &&
            !(normalizedKw && phoneDigits.includes(normalizedKw))
          ) {
            return false;
          }
        } else if (a.searchScope === 'name') {
          if (!row.name.toLowerCase().includes(kw)) return false;
        } else if (a.searchScope === 'id') {
          if (!row.loginId.toLowerCase().includes(kw)) return false;
        } else if (a.searchScope === 'phone') {
          const phoneDigits = row.phone.replace(/[^0-9]/g, '');
          if (!normalizedKw || !phoneDigits.includes(normalizedKw)) return false;
        }
      }

      if (a.marketingConsent && row.marketingConsent !== a.marketingConsent) return false;
      if (a.hasPet && row.hasPet !== a.hasPet) return false;

      return true;
    });
  }, [rows, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, displayPage]);

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const a = appliedSearch;
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];

    if (a.joinStartDate || a.joinEndDate) {
      const s = formatYmd(a.joinStartDate);
      const e = formatYmd(a.joinEndDate);
      chips.push({ key: 'joinDate', label: `가입일: ${s}${s && e ? ' ~ ' : ''}${e}` });
    } else if (a.joinDateRange) {
      chips.push({ key: 'joinDate', label: `가입일: ${a.joinDateRange}` });
    }

    if (a.weddingStartDate || a.weddingEndDate) {
      const s = formatYmd(a.weddingStartDate);
      const e = formatYmd(a.weddingEndDate);
      chips.push({ key: 'weddingDate', label: `예식일: ${s}${s && e ? ' ~ ' : ''}${e}` });
    } else if (a.weddingDateRange) {
      chips.push({ key: 'weddingDate', label: `예식일: ${a.weddingDateRange}` });
    }

    if (a.keyword.trim()) {
      const scopeLabel =
        DETAIL_SEARCH_SCOPE_OPTIONS.find((o) => o.value === a.searchScope)?.label ?? '전체';
      chips.push({ key: 'keyword', label: `상세검색: ${scopeLabel} ${a.keyword.trim()}` });
    }

    if (a.marketingConsent) {
      const label =
        a.marketingConsent === 'agree' ? '동의' : a.marketingConsent === 'disagree' ? '미동의' : a.marketingConsent;
      chips.push({ key: 'marketing', label: `마케팅동의: ${label}` });
    }

    if (a.hasPet) {
      const label = a.hasPet === 'yes' ? '있음' : a.hasPet === 'no' ? '없음' : a.hasPet;
      chips.push({ key: 'hasPet', label: `반려동물: ${label}` });
    }

    return chips;
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: CustomerAppliedSearch = {
      joinDateRange,
      joinStartDate,
      joinEndDate,
      weddingDateRange,
      weddingStartDate,
      weddingEndDate,
      searchScope,
      keyword,
      marketingConsent,
      hasPet,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next: CustomerAppliedSearch = { ...appliedSearch };
    switch (key) {
      case 'joinDate':
        next.joinDateRange = '';
        next.joinStartDate = null;
        next.joinEndDate = null;
        setJoinDateRange('');
        setJoinStartDate(null);
        setJoinEndDate(null);
        break;
      case 'weddingDate':
        next.weddingDateRange = '';
        next.weddingStartDate = null;
        next.weddingEndDate = null;
        setWeddingDateRange('');
        setWeddingStartDate(null);
        setWeddingEndDate(null);
        break;
      case 'keyword':
        next.keyword = '';
        next.searchScope = 'all';
        setKeyword('');
        setSearchScope('all');
        break;
      case 'marketing':
        next.marketingConsent = '';
        setMarketingConsent('');
        break;
      case 'hasPet':
        next.hasPet = '';
        setHasPet('');
        break;
      default:
        break;
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      queueMicrotask(() => {
        setCurrentPage(totalPages);
      });
    }
  }, [currentPage, totalPages]);

  if (subId) {
    const target = rows.find((row) => row.id === subId);
    return <CustomerDetailPage row={target ?? null} listPath={LIST_PATH} />;
  }

  return (
    <div className="admin-list-page">
      <h1 className="page-title">회원관리</h1>

      <section className="admin-list-box admin-list-box--filter" aria-label="검색·필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">가입일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="가입일 프리셋"
                className="listselect--date-range"
                value={joinDateRange}
                onChange={(next) => {
                  if (!next) {
                    setJoinDateRange('');
                    setJoinStartDate(null);
                    setJoinEndDate(null);
                    return;
                  }
                  setJoinDateRange(next);
                  applyDatePreset(next, setJoinStartDate, setJoinEndDate);
                }}
                options={DATE_PRESET_OPTIONS}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={joinStartDate}
                  onChange={(date: Date | null) => {
                    setJoinStartDate(date);
                    setJoinDateRange('');
                  }}
                  selectsStart
                  startDate={joinStartDate}
                  endDate={joinEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!joinStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  maxDate={new Date()}
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={joinEndDate}
                  onChange={(date: Date | null) => {
                    setJoinEndDate(date);
                    setJoinDateRange('');
                  }}
                  selectsEnd
                  startDate={joinStartDate}
                  endDate={joinEndDate}
                  minDate={joinStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!joinEndDate}
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
                options={DETAIL_SEARCH_SCOPE_OPTIONS}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="회원 상세검색"
              />
            </div>
          </div>

          <div className="filter-top-actions">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
            <button
              type="button"
              className={`detail-search-toggle ${detailOpen ? 'is-open' : ''}`}
              onClick={() => setDetailOpen((v) => !v)}
              aria-expanded={detailOpen}
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

        <div className={`filter-detail ${detailOpen ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">예식일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="예식일 프리셋"
                className="listselect--date-range"
                value={weddingDateRange}
                onChange={(next) => {
                  if (!next) {
                    setWeddingDateRange('');
                    setWeddingStartDate(null);
                    setWeddingEndDate(null);
                    return;
                  }
                  setWeddingDateRange(next);
                  applyDatePreset(next, setWeddingStartDate, setWeddingEndDate);
                }}
                options={DATE_PRESET_OPTIONS}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={weddingStartDate}
                  onChange={(date: Date | null) => {
                    setWeddingStartDate(date);
                    setWeddingDateRange('');
                  }}
                  selectsStart
                  startDate={weddingStartDate}
                  endDate={weddingEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!weddingStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={weddingEndDate}
                  onChange={(date: Date | null) => {
                    setWeddingEndDate(date);
                    setWeddingDateRange('');
                  }}
                  selectsEnd
                  startDate={weddingStartDate}
                  endDate={weddingEndDate}
                  minDate={weddingStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!weddingEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">마케팅동의</span>
            <ListSelect
              ariaLabel="마케팅동의"
              value={marketingConsent}
              onChange={setMarketingConsent}
              options={MARKETING_CONSENT_OPTIONS}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">반려동물 여부</span>
            <ListSelect
              ariaLabel="반려동물 여부"
              value={hasPet}
              onChange={setHasPet}
              options={PET_OPTIONS}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box">
        <p className="admin-list-result">
          가입자 수 {filteredRows.length.toLocaleString()}명입니다.
        </p>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="회원 리스트">
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
                <th>가입일</th>
                <th>예식일</th>
                <th className="col-center">SNS</th>
                <th>아이디</th>
                <th>이름</th>
                <th>전화번호</th>
                <th className="col-center">포인트내역</th>
                <th className="col-center">마케팅동의</th>
                <th className="col-center">반려동물</th>
                <th>첫주문일자</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="admin-table-empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.joinDate}</td>
                    <td>{row.weddingDate}</td>
                    <td className="col-center">{SNS_LABELS[row.sns]}</td>
                    <td>
                      <Link
                        to={customerDetailPath(row.id)}
                        className="admin-link admin-table-title-link"
                        title={row.loginId}
                      >
                        {row.loginId}
                      </Link>
                    </td>
                    <td>{row.name}</td>
                    <td>{row.phone}</td>
                    <td className="col-center">{row.points.toLocaleString()} P</td>
                    <td className="col-center">{row.marketingConsent === 'agree' ? '동의' : '미동의'}</td>
                    <td className="col-center">{row.hasPet === 'yes' ? '있음' : '없음'}</td>
                    <td>{row.firstOrderDate}</td>
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
                onClick={() => setCurrentPage(jumpPageBack(displayPage))}
                disabled={displayPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, displayPage - 1))}
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
                onClick={() => setCurrentPage(Math.min(totalPages, displayPage + 1))}
                disabled={displayPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(jumpPageForward(displayPage, totalPages))}
                disabled={displayPage >= totalPages}
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
