import { useCallback, useMemo, useState } from 'react';
import Confirm from '../../../components/Confirm/Confirm';
import '../../../styles/adminPage.css';
import './RenderingPcPage.css';

const PAGE_SIZE = 10;

type PcKind = 'real' | 'free' | 'mobile';

type RenderingPcRow = {
  id: string;
  no: number;
  kind: PcKind;
  pcName: string;
  path: string;
  useCount: number;
  inUse: 'Y' | 'N';
};

function buildMockRows(): RenderingPcRow[] {
  const kinds: PcKind[] = ['real', 'free', 'mobile'];
  return Array.from({ length: 19 }, (_, i) => {
    const no = i + 1;
    const kind = kinds[i % kinds.length];
    const suffix = 10 + (i % 10);
    const pcName = `${kind}_${suffix}`;
    const path = `\\${kind}_maker\\${suffix}\\`;
    const useCount = 10000 + ((i * 3713) % 90000);
    const inUse: 'Y' | 'N' = i % 5 === 2 ? 'N' : 'Y';
    return {
      id: `rpc-${no}`,
      no,
      kind,
      pcName,
      path,
      useCount,
      inUse,
    };
  });
}

export default function RenderingPcPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<RenderingPcRow[]>(() => buildMockRows());
  const [confirmRowId, setConfirmRowId] = useState<string | null>(null);

  const confirmRow = useMemo(
    () => (confirmRowId ? rows.find((r) => r.id === confirmRowId) ?? null : null),
    [rows, confirmRowId]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  const applyInUseToggle = useCallback((id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, inUse: r.inUse === 'Y' ? 'N' : 'Y' } : r))
    );
  }, []);

  const handleConfirmToggle = useCallback(() => {
    if (!confirmRowId) return;
    applyInUseToggle(confirmRowId);
    setConfirmRowId(null);
  }, [confirmRowId, applyInUseToggle]);

  return (
    <div className="admin-list-page admin-list-page--rendering-pc">
      <h1 className="page-title">랜더링 PC 관리</h1>

      <section className="admin-list-box admin-list-box--table" aria-label="랜더링 PC 목록">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>종류</th>
                <th>PC명</th>
                <th>경로</th>
                <th>사용횟수</th>
                <th>사용여부</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.no}</td>
                  <td>{row.kind}</td>
                  <td>{row.pcName}</td>
                  <td>
                    <span className="admin-table-cell--path">{row.path}</span>
                  </td>
                  <td>{String(row.useCount).padStart(5, '0')}</td>
                  <td>
                    <button
                      type="button"
                      className={`row-btn ${row.inUse === 'Y' ? 'row-btn--green' : 'row-btn--gray'}`}
                      onClick={() => setConfirmRowId(row.id)}
                      aria-label="상태변경"
                    >
                      {row.inUse}
                    </button>
                  </td>
                </tr>
              ))}
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

      <Confirm
        open={!!confirmRow}
        title="사용여부 변경"
        message={
          confirmRow ? (
            <>
              <strong>{confirmRow.pcName}</strong>
              <br />
              사용여부를 변경하시겠습니까?
            </>
          ) : null
        }
        confirmText="변경"
        cancelText="취소"
        onClose={() => setConfirmRowId(null)}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
