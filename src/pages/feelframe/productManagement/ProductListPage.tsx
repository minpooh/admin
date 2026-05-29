import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/Confirm';
import {
  getVisiblePageNumbers,
  jumpPageBack,
  jumpPageForward,
  PAGINATION_JUMP_PAGES,
} from '../../../utils/pagination';
import { pagePath } from '../../../routes';
import '../../../styles/adminPage.css';
import FeelframeProductEditPage from './ProductEditPage';
import FeelframeProductRecommendPage from './ProductRecommendPage';
import {
  formatFeelframeProductSupplier,
  MOCK_FEELFRAME_PRODUCT_LIST,
  type FeelframeProductBadgeKind,
  type FeelframeProductListRow,
} from './mock/productList.mock';

const DISPLAY_OPTIONS = ['전체', '진열', '미진열'] as const;

const SOLD_OUT_OPTIONS = ['전체', '품절', '미품절'] as const;

const PRODUCT_DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '상품명', label: '상품명' },
] as const;

type ProductDetailSearchType = (typeof PRODUCT_DETAIL_SEARCH_OPTIONS)[number]['value'];

type AppliedProductSearch = {
  display: (typeof DISPLAY_OPTIONS)[number];
  soldOut: (typeof SOLD_OUT_OPTIONS)[number];
  detailSearchType: ProductDetailSearchType;
  keyword: string;
};

type AppliedChipKey = 'display' | 'soldOut' | 'keyword';

const LIST_PATH = pagePath({
  navId: 'feelframe',
  sectionId: 'productManagement',
  itemId: 'productList',
});

const OPTION_MANAGEMENT_PATH = pagePath({
  navId: 'feelframe',
  sectionId: 'productManagement',
  itemId: 'optionManagement',
});

function productOptionManagementHref(productId: string, mode: 'add' | 'edit') {
  const q = new URLSearchParams({ productId, mode });
  return `${OPTION_MANAGEMENT_PATH}?${q.toString()}`;
}

function hasProductOptionSummary(row: FeelframeProductListRow) {
  return row.optionSummary.trim().length > 0;
}

function productEditPath(id: string) {
  return pagePath({
    navId: 'feelframe',
    sectionId: 'productManagement',
    itemId: 'productList',
    subId: id,
  });
}

const PRODUCT_CREATE_SUB_ID = 'new';

function productCreatePath() {
  return pagePath({
    navId: 'feelframe',
    sectionId: 'productManagement',
    itemId: 'productList',
    subId: PRODUCT_CREATE_SUB_ID,
  });
}

const RECOMMEND_SUB_PREFIX = 'recommend__';

function productRecommendPath(id: string) {
  return pagePath({
    navId: 'feelframe',
    sectionId: 'productManagement',
    itemId: 'productList',
    subId: `${RECOMMEND_SUB_PREFIX}${id}`,
  });
}

function parseRecommendProductId(subId: string | undefined): string | null {
  if (!subId || !subId.startsWith(RECOMMEND_SUB_PREFIX)) return null;
  const parsed = subId.slice(RECOMMEND_SUB_PREFIX.length).trim();
  return parsed || null;
}

const ITEMS_PER_PAGE = 10;

function isAppliedProductSearchEmpty(s: AppliedProductSearch): boolean {
  return s.display === '전체' && s.soldOut === '전체' && !s.keyword.trim();
}

function applyProductFilters(rows: FeelframeProductListRow[], search: AppliedProductSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();

  return rows.filter((row) => {
    if (search.display === '진열' && row.displayYn !== 'T') return false;
    if (search.display === '미진열' && row.displayYn !== 'F') return false;
    if (search.soldOut === '품절' && row.soldOutYn !== 'T') return false;
    if (search.soldOut === '미품절' && row.soldOutYn !== 'F') return false;

    if (keyword) {
      if (search.detailSearchType === '상품명') {
        if (!row.name.toLowerCase().includes(keyword)) return false;
      } else {
        const hay = [
          row.name,
          formatFeelframeProductSupplier(row.supplier),
          row.productType,
          row.category,
          row.optionSummary,
          row.deliveryLabel,
          String(row.viewCount),
          String(row.saleCount),
          ...row.badges.map((b) => badgePillProps(b).label),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(keyword)) return false;
      }
    }

    return true;
  });
}

function formatWon(n: number) {
  return `${n.toLocaleString()}원`;
}

function badgePillProps(kind: FeelframeProductBadgeKind) {
  if (kind === 'event') {
    return {
      label: 'EVENT',
      className: 'badge-square badge-square--inline badge-square--no-transition badge-square--secondary',
    };
  }
  if (kind === 'new') {
    return {
      label: 'NEW',
      className: 'badge-square badge-square--inline badge-square--no-transition badge-square--warning',
    };
  }
  return {
    label: 'BEST',
    className: 'badge-square badge-square--inline badge-square--no-transition badge-square--danger',
  };
}

function BadgePill({ kind }: { kind: FeelframeProductBadgeKind }) {
  const cfg = badgePillProps(kind);
  return <span className={cfg.className}>{cfg.label}</span>;
}

function BadgeCell({ badges }: { badges: FeelframeProductBadgeKind[] }) {
  const list = badges.slice(0, 2);
  if (list.length === 0) {
    return <span className="admin-list-muted">—</span>;
  }
  if (list.length === 1) {
    return <BadgePill kind={list[0]} />;
  }
  return (
    <div className="cell-block">
      {list.map((kind, idx) => (
        <span key={`${kind}-${idx}`} className="cell-line">
          <BadgePill kind={kind} />
        </span>
      ))}
    </div>
  );
}

function duplicateProductRow(row: FeelframeProductListRow): FeelframeProductListRow {
  return {
    ...row,
    id: `ff-prod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    badges: [],
    displayYn: 'F',
    name: `${row.name} (사본)`,
    recommendedProductIds: [],
    viewCount: 0,
    saleCount: 0,
  };
}

function createEmptyProductRow(): FeelframeProductListRow {
  const uniqueId = `ff-prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id: uniqueId,
    badges: [],
    displayYn: 'F',
    soldOutYn: 'F',
    supplier: '',
    productType: '액자',
    category: '해당없음',
    name: '',
    listPrice: 0,
    salePrice: 0,
    optionSummary: '',
    deliveryLabel: '미배송',
    recommendedProductIds: [],
    viewCount: 0,
    saleCount: 0,
  };
}

export default function FeelframeProductListPage() {
  const navigate = useNavigate();
  const { subId } = useParams<{ subId?: string }>();
  const [rows, setRows] = useState<FeelframeProductListRow[]>(() => [...MOCK_FEELFRAME_PRODUCT_LIST]);
  const [displayStatus, setDisplayStatus] = useState<(typeof DISPLAY_OPTIONS)[number]>('전체');
  const [soldOutStatus, setSoldOutStatus] = useState<(typeof SOLD_OUT_OPTIONS)[number]>('전체');
  const [detailSearchType, setDetailSearchType] = useState<ProductDetailSearchType>('전체');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedProductSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredRows = useMemo(() => applyProductFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, displayPage]);

  const handleProductListSearch = () => {
    const next: AppliedProductSearch = {
      display: displayStatus,
      soldOut: soldOutStatus,
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
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    switch (key) {
      case 'display':
        setDisplayStatus('전체');
        next.display = '전체';
        break;
      case 'soldOut':
        setSoldOutStatus('전체');
        next.soldOut = '전체';
        break;
      case 'keyword':
        setKeyword('');
        setDetailSearchType('전체');
        next.keyword = '';
        next.detailSearchType = '전체';
        break;
      default:
        break;
    }
    setAppliedSearch(isAppliedProductSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.display !== '전체') {
      chips.push({ key: 'display', label: `진열여부: ${appliedSearch.display}` });
    }
    if (appliedSearch.soldOut !== '전체') {
      chips.push({ key: 'soldOut', label: `품절여부: ${appliedSearch.soldOut}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}`,
      });
    }
    return chips;
  }, [appliedSearch]);

  const handleCopy = useCallback((row: FeelframeProductListRow) => {
    setRows((prev) => [duplicateProductRow(row), ...prev]);
    setCurrentPage(1);
  }, []);

  const confirmDeleteRow = useCallback(() => {
    if (!deleteTargetId) return;
    setRows((prev) => prev.filter((r) => r.id !== deleteTargetId));
    setDeleteTargetId(null);
  }, [deleteTargetId]);

  const deleteTarget = useMemo(
    () => (deleteTargetId ? rows.find((r) => r.id === deleteTargetId) ?? null : null),
    [deleteTargetId, rows]
  );

  if (subId) {
    if (subId === PRODUCT_CREATE_SUB_ID) {
      const newRow = createEmptyProductRow();
      return (
        <FeelframeProductEditPage
          row={newRow}
          listPath={LIST_PATH}
          mode="create"
          onSave={(nextRow) => {
            setRows((prev) => [nextRow, ...prev]);
            navigate(LIST_PATH);
          }}
        />
      );
    }

    const recommendProductId = parseRecommendProductId(subId);
    const row = rows.find((r) => r.id === (recommendProductId ?? subId));
    if (!row) {
      return (
        <div className="admin-list-page">
          <div className="admin-detail-header">
            <Link to={LIST_PATH} className="admin-detail-back">
              ← 목록
            </Link>
            <h1 className="page-title">상품 상세 · 수정</h1>
          </div>
          <section className="admin-list-box">
            <p className="admin-list-result">상품을 찾을 수 없습니다.</p>
          </section>
        </div>
      );
    }
    if (recommendProductId) {
      const recommendCandidates = rows.filter((r) => r.id !== row.id);
      return (
        <FeelframeProductRecommendPage
          row={row}
          candidates={recommendCandidates}
          listPath={LIST_PATH}
          onSave={(nextRecommendedProductIds) => {
            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, recommendedProductIds: nextRecommendedProductIds } : r))
            );
            navigate(LIST_PATH);
          }}
        />
      );
    }
    return (
      <FeelframeProductEditPage
        row={row}
        listPath={LIST_PATH}
        mode="edit"
        onSave={(nextRow) => {
          setRows((prev) => prev.map((r) => (r.id === nextRow.id ? nextRow : r)));
          navigate(LIST_PATH);
        }}
      />
    );
  }

  return (
    <div className="admin-list-page">
      <div className="admin-list-page-header">
        <h1 className="page-title">상품관리</h1>
        <div className="admin-list-page-header__actions">
          <button type="button" className="admin-list-add-btn" onClick={() => navigate(productCreatePath())}>
            <Plus size={18} aria-hidden="true" />
            상품추가
          </button>
        </div>
      </div>

      <section className="admin-list-box" aria-label="상품 검색 필터">
        <div className="filter-top-row admin-filter-row--equal-4">
          <div className="filter-section">
            <span className="filter-label">진열여부</span>
            <ListSelect
              ariaLabel="진열여부"
              value={displayStatus}
              onChange={(next) => setDisplayStatus(next as (typeof DISPLAY_OPTIONS)[number])}
              options={DISPLAY_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">품절여부</span>
            <ListSelect
              ariaLabel="품절여부"
              value={soldOutStatus}
              onChange={(next) => setSoldOutStatus(next as (typeof SOLD_OUT_OPTIONS)[number])}
              options={SOLD_OUT_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

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
              />
            </div>
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleProductListSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="상품 목록">
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
          <table className="admin-table admin-table--feelframe-product-list">
            <thead>
              <tr>
                <th className="col-center">뱃지</th>
                <th className="col-center">진열/품절</th>
                <th className="col-center">공급사</th>
                <th className="col-center">상품타입</th>
                <th>카테고리</th>
                <th>상품명</th>
                <th className="col-center">상품가</th>
                <th className="col-center">판매가</th>
                <th>옵션</th>
                <th>배송여부</th>
                <th className="col-center">추천상품</th>
                <th className="col-center">복사</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="admin-table-empty-cell">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="col-center">
                      <BadgeCell badges={row.badges} />
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <span className={`row-btn ${row.displayYn === 'T' ? 'row-btn--blue' : 'row-btn--red'}`}>
                          {row.displayYn === 'T' ? '진열중' : '미진열'}
                        </span>
                        <span className={`row-btn ${row.soldOutYn === 'T' ? 'row-btn--red' : 'row-btn--blue'}`}>
                          {row.soldOutYn === 'T' ? '품절' : '판매중'}
                        </span>
                      </div>
                    </td>
                    <td className="col-center">{formatFeelframeProductSupplier(row.supplier)}</td>
                    <td className="col-center">{row.productType}</td>
                    <td>{row.category}</td>
                    <td className="admin-table-col-title">
                      <div className="cell-block">
                        <span className="cell-line">
                          <Link
                            to={productEditPath(row.id)}
                            className="admin-link admin-table-title-link"
                            title={row.name}
                          >
                            {row.name}
                          </Link>
                        </span>
                        <span className="cell-line admin-list-muted">
                          조회수 {row.viewCount.toLocaleString()} · 판매수 {row.saleCount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="col-center">{formatWon(row.listPrice)}</td>
                    <td className="col-center">{formatWon(row.salePrice)}</td>
                    <td>
                      {hasProductOptionSummary(row) ? (
                        <div className="cell-block">
                          <span className="cell-line">{row.optionSummary}</span>
                          <span className="cell-line">
                            <button
                              type="button"
                              className="row-btn row-btn--default"
                              onClick={() => navigate(productOptionManagementHref(row.id, 'edit'))}
                            >
                              옵션 수정
                            </button>
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="row-btn row-btn--primary"
                          onClick={() => navigate(productOptionManagementHref(row.id, 'add'))}
                        >
                          옵션추가
                        </button>
                      )}
                    </td>
                    <td>{row.deliveryLabel}</td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-btn row-btn--primary"
                        onClick={() => navigate(productRecommendPath(row.id))}
                      >
                        수정
                      </button>
                    </td>
                    <td className="col-center">
                      <button type="button" className="row-btn row-btn--default" onClick={() => handleCopy(row)}>
                        복사
                      </button>
                    </td>
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
        title="상품 삭제"
        message={
          deleteTarget ? (
            <>
              <strong>{deleteTarget.name}</strong> 상품을 삭제하시겠습니까?
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
