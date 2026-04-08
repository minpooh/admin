import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Confirm from '../../../components/Confirm/Confirm';
import { pagePath } from '../../../routes';
import ProductDetailPage, { type ProductRow } from './ProductDetailPage';
import '../../../styles/adminPage.css';
import './ProductListPage.css';

const PRODUCT_CATEGORY_TABS = [
  { id: 'all', label: '전체' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'letter', label: 'Letter' },
  { id: 'baby', label: 'Baby' },
  { id: 'thanks', label: 'Thanks' },
  { id: 'invi', label: 'Invi' },
  { id: 'event', label: 'Event' },
  { id: 'opening', label: 'Opening' },
] as const;

const INITIAL_ROWS: ProductRow[] = [
  {
    id: 'p-001',
    productNo: '001',
    order: 1,
    thumbnailUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1280&q=80',
    name: '웨딩 무비 프리미엄',
    exposed: true,
    serviceUrl: 'https://feelmaker.co.kr/',
    category: 'wedding',
  },
  {
    id: 'p-002',
    productNo: '002',
    order: 2,
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1280&q=80',
    name: '돌잔치 초대장 영상',
    exposed: true,
    serviceUrl: 'https://feelmaker.co.kr/',
    category: 'baby',
  },
  {
    id: 'p-003',
    productNo: '003',
    order: 3,
    thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1280&q=80',
    name: '커플 하이라이트 필름',
    exposed: false,
    serviceUrl: 'https://feelmaker.co.kr/',
    category: 'wedding',
  },
  {
    id: 'p-004',
    productNo: '004',
    order: 4,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1280&q=80',
    name: '감성 모바일 청첩장',
    exposed: true,
    serviceUrl: 'https://feelmaker.co.kr/',
    category: 'letter',
  },
  {
    id: 'p-005',
    productNo: '005',
    order: 5,
    thumbnailUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1280&q=80',
    name: '베이비 포토 슬라이드',
    exposed: false,
    serviceUrl: 'https://feelmaker.co.kr/',
    category: 'baby',
  },
];

function renumberRowsInPlace(input: ProductRow[]): ProductRow[] {
  return input.map((row, idx) => ({ ...row, order: idx + 1 }));
}

const LIST_PATH = pagePath({
  navId: 'feelmaker',
  sectionId: 'productManagement',
  itemId: 'productList',
});

function productDetailPath(id: string) {
  return pagePath({
    navId: 'feelmaker',
    sectionId: 'productManagement',
    itemId: 'productList',
    subId: id,
  });
}

const PRODUCT_NEW_SUB_ID = 'new';

export default function ProductListPage() {
  const { subId } = useParams<{ subId?: string }>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProductRow[]>(() => renumberRowsInPlace(INITIAL_ROWS));
  const [confirmTarget, setConfirmTarget] = useState<ProductRow | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  const sortedRows = useMemo(() => renumberRowsInPlace(rows), [rows]);

  const filteredRows = useMemo(() => {
    if (activeCategoryTab === 'all') return sortedRows;
    return sortedRows.filter((row) => row.category === activeCategoryTab);
  }, [sortedRows, activeCategoryTab]);

  const moveRow = (rowId: string, direction: -1 | 1) => {
    setRows((prev) => {
      const list = renumberRowsInPlace(prev);
      const idx = list.findIndex((r) => r.id === rowId);
      if (idx < 0) return prev;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= list.length) return prev;
      const next = [...list];
      const temp = next[idx];
      next[idx] = next[nextIdx];
      next[nextIdx] = temp;
      return renumberRowsInPlace(next);
    });
  };

  const toggleExposed = () => {
    if (!confirmTarget) return;
    const targetId = confirmTarget.id;
    setRows((prev) => prev.map((row) => (row.id === targetId ? { ...row, exposed: !row.exposed } : row)));
    setConfirmTarget(null);
  };

  if (subId) {
    const isCreate = subId === PRODUCT_NEW_SUB_ID;
    const target = rows.find((row) => row.id === subId);

    if (!isCreate && !target) {
      return (
        <div className="admin-list-page">
          <section className="admin-list-box">
            <p className="admin-list-result">상품 정보를 찾을 수 없습니다.</p>
            <div className="product-detail-actions">
              <button type="button" className="filter-btn filter-btn--primary" onClick={() => navigate(LIST_PATH)}>
                목록으로
              </button>
            </div>
          </section>
        </div>
      );
    }

    return (
      <ProductDetailPage
        listPath={LIST_PATH}
        isCreate={isCreate}
        onSave={() => {
          if (isCreate) {
            const nextNo = String(rows.length + 1).padStart(3, '0');
            const created: ProductRow = {
              id: `p-${crypto.randomUUID()}`,
              productNo: nextNo,
              order: rows.length + 1,
              thumbnailUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1280&q=80',
              name: '신규 상품',
              exposed: true,
              serviceUrl: 'https://feelmaker.co.kr/',
              category: 'wedding',
            };
            setRows((prev) => renumberRowsInPlace([...prev, created]));
            navigate(LIST_PATH);
            return;
          }

          if (!target) return;
          navigate(LIST_PATH);
        }}
      />
    );
  }

  return (
    <div className="admin-list-page admin-list-page--product-list">
      <div className="admin-list-page-header">
        <h1 className="page-title">상품 목록</h1>
        <button
          type="button"
          className="admin-list-add-btn"
          onClick={() => navigate(productDetailPath(PRODUCT_NEW_SUB_ID))}
          aria-label="상품 등록"
        >
          <Plus size={18} aria-hidden="true" />
          상품 등록
        </button>
      </div>

      <nav className="admin-tabs" aria-label="상품 카테고리">
        <div className="admin-tabs__list" role="tablist">
          {PRODUCT_CATEGORY_TABS.map((tab) => {
            const isActive = activeCategoryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`product-category-tab-${tab.id}`}
                className={`admin-tabs__tab${isActive ? ' admin-tabs__tab--active' : ''}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveCategoryTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="admin-list-box admin-list-box--table" aria-label="상품 리스트">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>순서</th>
                <th>썸네일</th>
                <th>상품명</th>
                <th>노출</th>
                <th className="col-center">수정</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty-cell">
                    {sortedRows.length === 0
                      ? '데이터가 없습니다.'
                      : '해당 카테고리에 등록된 상품이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const globalIdx = sortedRows.findIndex((r) => r.id === row.id);
                  return (
                  <tr key={row.id}>
                    <td>{row.productNo}</td>
                    <td>
                      <div className="banner-order-cell">
                        <span className="banner-order-value">{row.order}</span>
                        <div className="banner-order-actions" aria-label="상품 순서 정렬">
                          <button
                            type="button"
                            className="row-icon-btn row-icon-btn--compact banner-order-sort-btn"
                            aria-label="위로"
                            title="위로"
                            disabled={globalIdx <= 0}
                            onClick={() => moveRow(row.id, -1)}
                          >
                            <ChevronUp size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="row-icon-btn row-icon-btn--compact banner-order-sort-btn"
                            aria-label="아래로"
                            title="아래로"
                            disabled={globalIdx < 0 || globalIdx >= sortedRows.length - 1}
                            onClick={() => moveRow(row.id, 1)}
                          >
                            <ChevronDown size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <img className="product-row__thumb" src={row.thumbnailUrl} alt={`${row.name} 썸네일`} />
                    </td>
                    <td className="admin-table-col-title">
                      <a
                        href={row.serviceUrl}
                        className="admin-link admin-table-title-link"
                        target="_blank"
                        rel="noreferrer noopener"
                        title={row.name}
                      >
                        {row.name}
                      </a>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`row-btn ${row.exposed ? 'row-btn--green' : 'row-btn--gray'}`}
                        onClick={() => setConfirmTarget(row)}
                      >
                        {row.exposed ? '노출' : '미노출'}
                      </button>
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-primary"
                        aria-label="수정"
                        title="수정"
                        onClick={() => navigate(productDetailPath(row.id))}
                      >
                        <Pencil size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Confirm
        open={!!confirmTarget}
        title="노출 상태 변경"
        message={
          confirmTarget ? (
            <>
              <strong>{confirmTarget.name}</strong> 상품을
              <br />
              {confirmTarget.exposed ? '미노출' : '노출'} 상태로 변경하시겠습니까?
            </>
          ) : (
            ''
          )
        }
        confirmText="변경"
        cancelText="취소"
        onClose={() => setConfirmTarget(null)}
        onConfirm={toggleExposed}
      />
    </div>
  );
}
