import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import CreatorDetailPage from './CreatorDetailPage';
import { creatorDetailPath, creatorListPath } from './creatorPaths';

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'SUSPENDED', label: 'SUSPENDED' },
];

const APPROVAL_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
];

const SEARCH_SCOPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'id', label: 'ID' },
  { value: 'name', label: '이름' },
  { value: 'email', label: '이메일' },
  { value: 'phone', label: '전화번호' },
];

type CreatorStatus = 'ACTIVE' | 'SUSPENDED';
type CreatorApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type CreatorRow = {
  id: string;
  loginId: string;
  name: string;
  phone: string;
  email: string;
  status: CreatorStatus;
  approvalStatus: CreatorApprovalStatus;
  salesCount: number;
  totalSettlementAmount: number;
  joinedAt: string;
  lastLoginAt: string;
};

const MOCK_CREATORS: CreatorRow[] = Array.from({ length: 37 }, (_, i) => {
  const no = i + 1;
  const status: CreatorStatus = i % 6 === 0 ? 'SUSPENDED' : 'ACTIVE';
  const approvalStatus: CreatorApprovalStatus =
    i % 9 === 0 ? 'REJECTED' : i % 4 === 0 ? 'PENDING' : 'APPROVED';
  const joinedMonth = ((i % 12) + 1).toString().padStart(2, '0');
  const joinedDay = ((i % 27) + 1).toString().padStart(2, '0');
  const loginMonth = (((i + 2) % 12) + 1).toString().padStart(2, '0');
  const loginDay = (((i + 8) % 27) + 1).toString().padStart(2, '0');
  return {
    id: `creator-${String(no).padStart(3, '0')}`,
    loginId: `creator_${String(no).padStart(3, '0')}`,
    name: `크리에이터${no}`,
    phone: `010-${String(1200 + ((i * 37) % 8000)).padStart(4, '0')}-${String(2100 + ((i * 61) % 7000)).padStart(4, '0')}`,
    email: `creator${String(no).padStart(3, '0')}@example.com`,
    status,
    approvalStatus,
    salesCount: 8 + ((i * 7) % 240),
    totalSettlementAmount: 350000 + ((i * 183271) % 43000000),
    joinedAt: `2024-${joinedMonth}-${joinedDay}`,
    lastLoginAt: `2025-${loginMonth}-${loginDay} ${String(9 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 11) % 60).padStart(2, '0')}`,
  };
});

type AppliedSearch = {
  status: string;
  approvalStatus: string;
  searchScope: string;
  keyword: string;
};

type AppliedChipKey = 'status' | 'approvalStatus' | 'keyword';

const ITEMS_PER_PAGE = 10;

function statusButtonClass(status: CreatorStatus): string {
  return status === 'ACTIVE' ? 'row-btn row-btn--status-secondary' : 'row-btn row-btn--status-warning';
}

function approvalButtonClass(status: CreatorApprovalStatus): string {
  if (status === 'APPROVED') return 'row-btn row-btn--status-primary';
  if (status === 'REJECTED') return 'row-btn row-btn--status-danger';
  return 'row-btn row-btn--status-warning';
}

export default function CreatorListPage() {
  const navigate = useNavigate();
  const { subId } = useParams<{ subId?: string }>();
  const [creatorRows, setCreatorRows] = useState<CreatorRow[]>(MOCK_CREATORS);
  const [status, setStatus] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [searchScope, setSearchScope] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = (() => {
    if (!appliedSearch) return creatorRows;
    const kw = appliedSearch.keyword.trim().toLowerCase();
    return creatorRows.filter((row) => {
      if (appliedSearch.status && row.status !== appliedSearch.status) return false;
      if (appliedSearch.approvalStatus && row.approvalStatus !== appliedSearch.approvalStatus) return false;
      if (kw) {
        if (appliedSearch.searchScope === 'id') return row.loginId.toLowerCase().includes(kw);
        if (appliedSearch.searchScope === 'name') return row.name.toLowerCase().includes(kw);
        if (appliedSearch.searchScope === 'email') return row.email.toLowerCase().includes(kw);
        if (appliedSearch.searchScope === 'phone') return row.phone.replace(/[^0-9]/g, '').includes(kw.replace(/[^0-9]/g, ''));
        return (
          row.loginId.toLowerCase().includes(kw) ||
          row.name.toLowerCase().includes(kw) ||
          row.email.toLowerCase().includes(kw) ||
          row.phone.replace(/[^0-9]/g, '').includes(kw.replace(/[^0-9]/g, ''))
        );
      }
      return true;
    });
  })();

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = () => {
    const next: AppliedSearch = { status, approvalStatus, searchScope, keyword };
    const isEmpty = !next.status && !next.approvalStatus && !next.keyword.trim();
    setAppliedSearch(isEmpty ? null : next);
    setCurrentPage(1);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = (() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.status) chips.push({ key: 'status', label: `상태: ${appliedSearch.status}` });
    if (appliedSearch.approvalStatus) chips.push({ key: 'approvalStatus', label: `승인상태: ${appliedSearch.approvalStatus}` });
    if (appliedSearch.keyword.trim()) {
      const scopeLabel = SEARCH_SCOPE_OPTIONS.find((o) => o.value === appliedSearch.searchScope)?.label ?? '전체';
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel} ${appliedSearch.keyword}` });
    }
    return chips;
  })();

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    if (key === 'status') {
      setStatus('');
      next.status = '';
    } else if (key === 'approvalStatus') {
      setApprovalStatus('');
      next.approvalStatus = '';
    } else {
      setSearchScope('');
      setKeyword('');
      next.searchScope = '';
      next.keyword = '';
    }
    const isEmpty = !next.status && !next.approvalStatus && !next.keyword.trim();
    setAppliedSearch(isEmpty ? null : next);
    setCurrentPage(1);
  };

  if (subId) {
    const detailRow = creatorRows.find((row) => row.id === subId);
    if (!detailRow) {
      return (
        <div className="admin-list-page">
          <div className="admin-detail-header">
            <Link to={creatorListPath} className="admin-detail-back">
              ← 목록
            </Link>
            <h1 className="page-title">크리에이터 상세</h1>
          </div>
          <section className="admin-list-box">
            <p className="admin-list-result">크리에이터를 찾을 수 없습니다.</p>
          </section>
        </div>
      );
    }
    return (
      <CreatorDetailPage
        row={detailRow}
        onSave={(next) => {
          setCreatorRows((prev) => prev.map((row) => (row.id === next.id ? next : row)));
          navigate(creatorListPath);
        }}
      />
    );
  }

  return (
    <div className="admin-list-page">
      <h1 className="page-title">크리에이터 목록</h1>

      <section className="admin-list-box" aria-label="크리에이터 검색 필터">
        <div className="filter-top-row admin-filter-row--equal-4">
          <div className="filter-section">
            <span className="filter-label">상태</span>
            <ListSelect ariaLabel="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          </div>

          <div className="filter-section">
            <span className="filter-label">승인상태</span>
            <ListSelect
              ariaLabel="승인상태"
              value={approvalStatus}
              onChange={setApprovalStatus}
              options={APPROVAL_STATUS_OPTIONS}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">조건검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="조건검색"
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
                aria-label="크리에이터 검색어"
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

      <section className="admin-list-box admin-list-box--table" aria-label="크리에이터 목록">
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
          <table className="admin-table admin-table--creator-list">
            <thead>
              <tr>
                <th>아이디</th>
                <th>이름</th>
                <th>전화번호</th>
                <th>상태</th>
                <th>승인상태</th>
                <th>판매건수</th>
                <th>총 정산금액</th>
                <th>가입일</th>
                <th>최근 로그인</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.loginId}</td>
                  <td>
                    <Link to={creatorDetailPath(row.id)} className="admin-link">
                      {row.name}
                    </Link>
                  </td>
                  <td>{row.phone}</td>
                  <td>
                    <span className={statusButtonClass(row.status)}>{row.status}</span>
                  </td>
                  <td>
                    <span className={approvalButtonClass(row.approvalStatus)}>{row.approvalStatus}</span>
                  </td>
                  <td>{row.salesCount.toLocaleString()}</td>
                  <td>{row.totalSettlementAmount.toLocaleString()}원</td>
                  <td>{row.joinedAt}</td>
                  <td>{row.lastLoginAt}</td>
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

