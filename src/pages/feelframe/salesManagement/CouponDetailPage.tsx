import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import ListRowCopyButton from '../../../components/ListRowCopyButton';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import '../../../styles/adminPage.css';

type Props = {
  couponName: string | null;
  listPath: string;
};

const REGISTRATION_STATUS_OPTIONS = ['전체', '등록완료', '미등록'] as const;
const USAGE_STATUS_OPTIONS = ['전체', '사용완료', '미사용'] as const;
const DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '쿠폰이름', label: '쿠폰이름' },
  { value: '쿠폰번호', label: '쿠폰번호' },
  { value: '고객정보', label: '고객정보' },
] as const;

const ITEMS_PER_PAGE = 10;

type RegistrationStatus = (typeof REGISTRATION_STATUS_OPTIONS)[number];
type UsageStatus = (typeof USAGE_STATUS_OPTIONS)[number];
type DetailSearchType = (typeof DETAIL_SEARCH_OPTIONS)[number]['value'];
type AppliedChipKey = 'registrationStatus' | 'usageStatus' | 'keyword';

type CouponIssueRow = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  couponName: string;
  benefitLabel: string;
  couponNo: string;
  registrationStatus: Exclude<RegistrationStatus, '전체'>;
  usageStatus: Exclude<UsageStatus, '전체'>;
  registeredAt?: string;
  usedAt?: string;
};

type AppliedSearch = {
  registrationStatus: RegistrationStatus;
  usageStatus: UsageStatus;
  detailSearchType: DetailSearchType;
  keyword: string;
};

const MOCK_COUPON_ISSUES: CouponIssueRow[] = [
  {
    id: 'issue-001',
    customerId: 'minji01',
    customerName: '김민지',
    customerPhone: '010-1234-5678',
    couponName: '공동구매 10% 할인쿠폰',
    benefitLabel: '10%',
    couponNo: 'GN-1745941-001',
    registrationStatus: '등록완료',
    usageStatus: '미사용',
    registeredAt: '2026-05-01 09:30:12',
  },
  {
    id: 'issue-002',
    customerId: 'seoyeon02',
    customerName: '이서연',
    customerPhone: '010-2345-6789',
    couponName: '공동구매 10% 할인쿠폰',
    benefitLabel: '10%',
    couponNo: 'GN-1745941-002',
    registrationStatus: '등록완료',
    usageStatus: '사용완료',
    registeredAt: '2026-05-01 10:42:08',
    usedAt: '2026-05-03 14:18:55',
  },
  {
    id: 'issue-003',
    customerId: 'guest-003',
    customerName: '박지훈',
    customerPhone: '010-3456-7890',
    couponName: '공동구매 10% 할인쿠폰',
    benefitLabel: '10%',
    couponNo: 'GN-1745941-003',
    registrationStatus: '미등록',
    usageStatus: '미사용',
  },
  {
    id: 'issue-004',
    customerId: 'yujin04',
    customerName: '최유진',
    customerPhone: '010-4567-8901',
    couponName: '적립금 전환 쿠폰',
    benefitLabel: '5,000원',
    couponNo: 'PT-2837065-001',
    registrationStatus: '등록완료',
    usageStatus: '사용완료',
    registeredAt: '2026-04-20 11:05:34',
    usedAt: '2026-04-25 16:27:19',
  },
  {
    id: 'issue-005',
    customerId: 'guest-005',
    customerName: '정다은',
    customerPhone: '010-5678-9012',
    couponName: '적립금 전환 쿠폰',
    benefitLabel: '5,000원',
    couponNo: 'PT-2837065-002',
    registrationStatus: '미등록',
    usageStatus: '미사용',
  },
];

function isAppliedSearchEmpty(search: AppliedSearch) {
  return search.registrationStatus === '전체' && search.usageStatus === '전체' && !search.keyword.trim();
}

function applyCouponIssueFilters(rows: CouponIssueRow[], search: AppliedSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();
  return rows.filter((row) => {
    if (search.registrationStatus !== '전체' && row.registrationStatus !== search.registrationStatus) return false;
    if (search.usageStatus !== '전체' && row.usageStatus !== search.usageStatus) return false;

    if (keyword) {
      const customerInfo = `${row.customerId} ${row.customerName} ${row.customerPhone}`;
      const target =
        search.detailSearchType === '쿠폰이름'
          ? row.couponName
          : search.detailSearchType === '쿠폰번호'
            ? row.couponNo
            : search.detailSearchType === '고객정보'
              ? customerInfo
              : `${row.couponName} ${row.couponNo} ${customerInfo}`;
      if (!target.toLowerCase().includes(keyword)) return false;
    }

    return true;
  });
}

function getRegistrationClassName(status: CouponIssueRow['registrationStatus']) {
  return `row-btn ${status === '등록완료' ? 'row-btn--status-secondary' : 'row-btn--status-danger'}`;
}

function getUsageClassName(status: CouponIssueRow['usageStatus']) {
  return `row-btn ${status === '사용완료' ? 'row-btn--status-secondary' : 'row-btn--status-warning'}`;
}

export default function CouponDetailPage({ couponName, listPath }: Props) {
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('전체');
  const [usageStatus, setUsageStatus] = useState<UsageStatus>('전체');
  const [detailSearchType, setDetailSearchType] = useState<DetailSearchType>('전체');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => applyCouponIssueFilters(MOCK_COUPON_ISSUES, appliedSearch), [appliedSearch]);
  const usedCouponCount = filteredRows.filter((row) => row.usageStatus === '사용완료').length;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, displayPage]);

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];

    if (appliedSearch.registrationStatus !== '전체') {
      chips.push({ key: 'registrationStatus', label: `등록여부: ${appliedSearch.registrationStatus}` });
    }
    if (appliedSearch.usageStatus !== '전체') {
      chips.push({ key: 'usageStatus', label: `사용여부: ${appliedSearch.usageStatus}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({ key: 'keyword', label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}` });
    }

    return chips;
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: AppliedSearch = {
      registrationStatus,
      usageStatus,
      detailSearchType,
      keyword,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };

    if (key === 'registrationStatus') {
      setRegistrationStatus('전체');
      next.registrationStatus = '전체';
    }
    if (key === 'usageStatus') {
      setUsageStatus('전체');
      next.usageStatus = '전체';
    }
    if (key === 'keyword') {
      setDetailSearchType('전체');
      setKeyword('');
      next.detailSearchType = '전체';
      next.keyword = '';
    }

    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={listPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{couponName ?? '쿠폰 상세'}</h1>
      </div>

      <section className="admin-list-box admin-list-box--filter" aria-label="쿠폰 발급 내역 검색 필터">
        <div className="filter-top-row admin-filter-row--equal-4">
          <div className="filter-section">
            <span className="filter-label">등록여부</span>
            <ListSelect
              ariaLabel="등록여부"
              value={registrationStatus}
              onChange={(next) => setRegistrationStatus(next as RegistrationStatus)}
              options={REGISTRATION_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">사용여부</span>
            <ListSelect
              ariaLabel="사용여부"
              value={usageStatus}
              onChange={(next) => setUsageStatus(next as UsageStatus)}
              options={USAGE_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={detailSearchType}
                onChange={(next) => setDetailSearchType(next as DetailSearchType)}
                options={[...DETAIL_SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="쿠폰 발급 내역 상세검색어"
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

      <section className="admin-list-box">
        <p className="admin-list-result">
          {filteredRows.length.toLocaleString()}장 중 {usedCouponCount.toLocaleString()}장 사용되었습니다
        </p>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="쿠폰 발급 내역 목록">
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
          <table className="admin-table admin-table--min-w-1024">
            <thead>
              <tr>
                <th>고객정보</th>
                <th>쿠폰이름</th>
                <th className="col-center">할인율 또는 변환금액</th>
                <th>쿠폰번호</th>
                <th className="col-center">등록여부</th>
                <th className="col-center">사용여부</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.customerId}</span>
                        <span className="cell-line">{row.customerName}</span>
                        <span className="cell-line admin-list-muted">{row.customerPhone}</span>
                      </div>
                    </td>
                    <td>{couponName ?? row.couponName}</td>
                    <td className="col-center">{row.benefitLabel}</td>
                    <td>
                      <div className="cell-block cell-block--inline-field">
                        <span className="cell-line">{row.couponNo}</span>
                        <ListRowCopyButton text={row.couponNo} onCopied={() => undefined} ariaLabel="쿠폰번호 복사" />
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <span className={getRegistrationClassName(row.registrationStatus)}>{row.registrationStatus}</span>
                        {row.registrationStatus === '등록완료' && row.registeredAt && (
                          <span className="cell-line admin-list-muted">{row.registeredAt}</span>
                        )}
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <span className={getUsageClassName(row.usageStatus)}>{row.usageStatus}</span>
                        {row.usageStatus === '사용완료' && row.usedAt && (
                          <span className="cell-line admin-list-muted">{row.usedAt}</span>
                        )}
                      </div>
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
