import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../../styles/adminPage.css';
import { formatFeelframeProductSupplier, type FeelframeProductListRow } from './mock/productList.mock';

type Props = {
  row: FeelframeProductListRow;
  candidates: FeelframeProductListRow[];
  listPath: string;
  onSave: (nextRecommendedProductIds: string[]) => void;
};

const PRODUCT_THUMBNAIL_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><rect width='160' height='160' fill='%23f3f4f6'/><rect x='22' y='28' width='116' height='104' rx='10' fill='%23d1d5db'/><circle cx='56' cy='66' r='11' fill='%239ca3af'/><path d='M34 118l34-34 20 20 12-12 26 26z' fill='%239ca3af'/></svg>";

function formatWon(n: number) {
  return `${n.toLocaleString()}원`;
}

export default function FeelframeProductRecommendPage({ row, candidates, listPath, onSave }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [...row.recommendedProductIds]);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');

  const filteredCandidates = useMemo(() => {
    const q = candidateSearchQuery.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const hay = [
        c.name,
        c.category,
        c.productType,
        formatFeelframeProductSupplier(c.supplier),
        c.id,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [candidates, candidateSearchQuery]);

  const selectedRows = useMemo(
    () => selectedIds.map((id) => candidates.find((c) => c.id === id)).filter((v): v is FeelframeProductListRow => !!v),
    [selectedIds, candidates]
  );

  const toggleCandidate = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={listPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">추천상품 관리</h1>
      </div>

      <section className="admin-list-box">
        <div className="admin-product-summary">
          <div className="admin-product-summary__thumb-wrap" aria-hidden="true">
            <img className="admin-product-thumb" src={PRODUCT_THUMBNAIL_FALLBACK} alt={`${row.name} 썸네일`} />
          </div>
          <div className="admin-product-summary__meta">
            <dl className="admin-detail-meta">
              <div className="admin-detail-meta__row">
                <dt>상품명</dt>
                <dd>{row.name}</dd>
              </div>
              <div className="admin-detail-meta__row">
                <dt>공급사</dt>
                <dd>{formatFeelframeProductSupplier(row.supplier)}</dd>
              </div>
              <div className="admin-detail-meta__row">
                <dt>상품타입</dt>
                <dd>{row.productType}</dd>
              </div>
              <div className="admin-detail-meta__row">
                <dt>카테고리</dt>
                <dd>{row.category}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="admin-list-box">
        <h3 className="admin-detail-section-title">추천 상품</h3>
        <div className="filter-section">
          <div className="admin-search-field">
            <input
              type="text"
              placeholder="검색어 입력"
              value={candidateSearchQuery}
              onChange={(e) => setCandidateSearchQuery(e.target.value)}
              aria-label="추천 후보 상품 검색"
            />
          </div>
        </div>

        <div
          className={`admin-table-wrap${
            filteredCandidates.length >= 5 ? ' admin-table-wrap--candidate-scroll' : ''
          }`}
        >
          <table className="admin-table admin-table--min-w-800">
            <thead>
              <tr>
                <th className="col-center">선택</th>
                <th>상품</th>
                <th>카테고리</th>
                <th className="col-center">판매가</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table-empty-cell">
                    설정 가능한 상품이 없습니다.
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table-empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const checked = selectedIds.includes(candidate.id);
                  return (
                    <tr key={candidate.id}>
                      <td className="col-center">
                        <input
                          type="checkbox"
                          className="admin-checkbox"
                          checked={checked}
                          onChange={() => toggleCandidate(candidate.id)}
                          aria-label={`${candidate.name} 추천상품 선택`}
                        />
                      </td>
                      <td>
                        <div className="cell-block cell-block--inline-file-chips">
                          <img
                            src={PRODUCT_THUMBNAIL_FALLBACK}
                            alt={`${candidate.name} 썸네일`}
                            className="admin-product-thumb admin-product-thumb--inline"
                          />
                          <span className="cell-line">{candidate.name}</span>
                        </div>
                      </td>
                      <td>{candidate.category}</td>
                      <td className="col-center">{formatWon(candidate.salePrice)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-list-add-row">
          <button type="button" className="filter-btn filter-btn--primary" onClick={() => onSave(selectedIds)}>
            저장
          </button>
        </div>
      </section>

      <section className="admin-list-box">
        <h3 className="admin-detail-section-title">
          선택된 추천상품
          <span className="admin-list-muted" style={{ marginLeft: '0.75rem' }}>
            {selectedIds.length}건
          </span>
        </h3>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--min-w-800">
            <thead>
              <tr>
                <th>상품</th>
                <th>카테고리</th>
                <th className="col-center">판매가</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {selectedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table-empty-cell">
                    선택된 추천상품이 없습니다.
                  </td>
                </tr>
              ) : (
                selectedRows.map((selected) => (
                  <tr key={`selected-${selected.id}`}>
                    <td>
                      <div className="cell-block cell-block--inline-file-chips">
                        <img
                          src={PRODUCT_THUMBNAIL_FALLBACK}
                          alt={`${selected.name} 썸네일`}
                          className="admin-product-thumb admin-product-thumb--inline"
                        />
                        <span className="cell-line">{selected.name}</span>
                      </div>
                    </td>
                    <td>{selected.category}</td>
                    <td className="col-center">{formatWon(selected.salePrice)}</td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-btn row-btn--red"
                        onClick={() => setSelectedIds((prev) => prev.filter((id) => id !== selected.id))}
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
      </section>
    </div>
  );
}
