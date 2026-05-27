import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import ListRowCopyButton from '../../../components/ListRowCopyButton';
import Confirm from '../../../components/Confirm';
import {
  getVisiblePageNumbers,
  jumpPageBack,
  jumpPageForward,
  PAGINATION_JUMP_PAGES,
} from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import PersonalPaymentDetailPage from './PersonalPaymentDetailPage';
import {
  formatFeelframeProductSupplier,
  MOCK_FEELFRAME_PERSONAL_PAYMENT_LIST,
  type FeelframePersonalPaymentRow,
} from './mock/personalPayment.mock';
import {
  personalPaymentDetailPath,
  personalPaymentListPath,
  personalPaymentPublicUrl,
} from './personalPaymentPaths';

const PRODUCT_DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '상품명', label: '상품명' },
] as const;

type ProductDetailSearchType = (typeof PRODUCT_DETAIL_SEARCH_OPTIONS)[number]['value'];

type AppliedProductSearch = {
  detailSearchType: ProductDetailSearchType;
  keyword: string;
};

type AppliedChipKey = 'keyword';

const ITEMS_PER_PAGE = 10;

function isAppliedProductSearchEmpty(s: AppliedProductSearch): boolean {
  return !s.keyword.trim();
}

function formatWon(n: number) {
  return `${n.toLocaleString()}원`;
}

function applyPersonalPaymentFilters(
  rows: FeelframePersonalPaymentRow[],
  search: AppliedProductSearch | null,
): FeelframePersonalPaymentRow[] {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();
  if (!keyword) return rows;

  return rows.filter((row) => {
    if (search.detailSearchType === '상품명') {
      return row.name.toLowerCase().includes(keyword);
    }

    const hay = [
      row.name,
      formatFeelframeProductSupplier(row.supplier),
      row.category,
      row.deliveryLabel,
      String(row.paymentAmount),
    ]
      .join(' ')
      .toLowerCase();

    return hay.includes(keyword);
  });
}

export default function FeelframePersonalPaymentPage() {
  const navigate = useNavigate();
  const { subId } = useParams<{ subId?: string }>();
  const [rows, setRows] = useState<FeelframePersonalPaymentRow[]>(() => [...MOCK_FEELFRAME_PERSONAL_PAYMENT_LIST]);
  const [detailSearchType, setDetailSearchType] = useState<ProductDetailSearchType>('전체');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedProductSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredRows = useMemo(() => applyPersonalPaymentFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, displayPage]);

  const handleSearch = useCallback(() => {
    const next: AppliedProductSearch = {
      detailSearchType,
      keyword,
    };
    if (isAppliedProductSearchEmpty(next)) {
      setAppliedSearch(null);
      setCurrentPage(1);
      return;
    }
    setAppliedSearch(next);
    setCurrentPage(1);
  }, [detailSearchType, keyword]);

  const clearAppliedFilter = useCallback(
    (key: AppliedChipKey) => {
      if (!appliedSearch || key !== 'keyword') return;
      setKeyword('');
      setDetailSearchType('전체');
      setAppliedSearch(null);
      setCurrentPage(1);
    },
    [appliedSearch],
  );

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch?.keyword.trim()) return [];
    return [
      {
        key: 'keyword',
        label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}`,
      },
    ];
  }, [appliedSearch]);

  const confirmDeleteRow = useCallback(() => {
    if (!deleteTargetId) return;
    setRows((prev) => prev.filter((row) => row.id !== deleteTargetId));
    setDeleteTargetId(null);
    setCurrentPage(1);
  }, [deleteTargetId]);

  const deleteTarget = useMemo(
    () => (deleteTargetId ? rows.find((row) => row.id === deleteTargetId) ?? null : null),
    [deleteTargetId, rows],
  );

  if (subId) {
    const detailRow = rows.find((row) => row.id === subId);
    if (!detailRow) {
      return (
        <div className="admin-list-page">
          <div className="admin-detail-header">
            <Link to={personalPaymentListPath} className="admin-detail-back">
              ← 목록
            </Link>
            <h1 className="page-title">개인결제 상세</h1>
          </div>
          <section className="admin-list-box">
            <p className="admin-list-result">개인결제 상품을 찾을 수 없습니다.</p>
          </section>
        </div>
      );
    }

    return (
      <PersonalPaymentDetailPage
        key={detailRow.id}
        row={detailRow}
        onSave={(nextRow) => {
          setRows((prev) => prev.map((row) => (row.id === nextRow.id ? nextRow : row)));
          navigate(personalPaymentListPath);
        }}
      />
    );
  }

  return (
    <div className="admin-list-page">
      <h1 className="page-title">개인결제관리</h1>

      <section className="admin-list-box" aria-label="개인결제 검색 필터">
        <div className="filter-top-row admin-filter-row--single-keyword">
          <div className="filter-section">
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={detailSearchType}
                onChange={(next) => setDetailSearchType(next as ProductDetailSearchType)}
                options={[...PRODUCT_DETAIL_SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
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

      <section className="admin-list-box admin-list-box--table" aria-label="개인결제 목록">
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
                <th className="col-center">주소복사</th>
                <th className="col-center">공급사</th>
                <th>카테고리</th>
                <th>상품명</th>
                <th className="col-center">결제금액</th>
                <th>배송여부</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty-cell">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="col-center">
                      <ListRowCopyButton
                        text={personalPaymentPublicUrl(row.id)}
                        ariaLabel="개인결제 주소 복사"
                      />
                    </td>
                    <td className="col-center">{formatFeelframeProductSupplier(row.supplier)}</td>
                    <td>{row.category}</td>
                    <td className="admin-table-col-title">
                      <Link
                        to={personalPaymentDetailPath(row.id)}
                        className="admin-link admin-table-title-link"
                        title={row.name}
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="col-center">{formatWon(row.paymentAmount)}</td>
                    <td>{row.deliveryLabel}</td>
                    <td className="col-center">
                      <button type="button" className="row-btn row-btn--red" onClick={() => setDeleteTargetId(row.id)}>
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

      <Confirm
        open={!!deleteTarget}
        title="개인결제 삭제"
        message={
          deleteTarget ? (
            <>
              <strong>{deleteTarget.name}</strong> 개인결제 상품을 삭제하시겠습니까?
            </>
          ) : (
            ''
          )
        }
        confirmText="삭제"
        cancelText="취소"
        danger
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteRow}
      />
    </div>
  );
}
