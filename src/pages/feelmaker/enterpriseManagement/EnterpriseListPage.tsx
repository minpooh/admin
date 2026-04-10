import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Confirm from '../../../components/Confirm/Confirm';
import '../../../styles/adminPage.css';
import EnterpriseDetailPage from './EnterpriseDetailPage';
import {
  ENTERPRISE_NEW_SUB_ID,
  enterpriseDetailPath,
  enterpriseListPath,
  enterpriseNewPath,
} from './enterprisePaths';
import { MOCK_ENTERPRISE_LIST, type EnterpriseListItem } from './mock/enterpriseList.mock';

const PAGE_SIZE = 10;

export default function EnterpriseListPage() {
  const { subId } = useParams<{ subId?: string }>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<EnterpriseListItem[]>(() => [...MOCK_ENTERPRISE_LIST]);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const confirmRow = useMemo(
    () => (confirmDeleteId ? rows.find((r) => r.id === confirmDeleteId) ?? null : null),
    [rows, confirmDeleteId]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDeleteId) return;
    setRows((prev) => prev.filter((row) => row.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  }, [confirmDeleteId]);

  if (subId) {
    if (subId === ENTERPRISE_NEW_SUB_ID) {
      return (
        <EnterpriseDetailPage
          isCreate
          row={{ id: ENTERPRISE_NEW_SUB_ID, loginId: '', companyName: '' }}
          onCreate={(item) => {
            setRows((prev) => [item, ...prev]);
            setCurrentPage(1);
            navigate(enterpriseListPath);
          }}
        />
      );
    }

    const detailRow = rows.find((row) => row.id === subId);
    if (!detailRow) {
      return (
        <div className="admin-list-page">
          <div className="admin-detail-header">
            <Link to={enterpriseListPath} className="admin-detail-back">
              ← 목록
            </Link>
            <h1 className="page-title">기업 상세</h1>
          </div>
          <section className="admin-list-box">
            <p className="admin-list-result">기업을 찾을 수 없습니다.</p>
          </section>
        </div>
      );
    }
    return (
      <EnterpriseDetailPage
        row={detailRow}
        onUpdate={(next) => {
          setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)));
          navigate(enterpriseListPath);
        }}
      />
    );
  }

  return (
    <div className="admin-list-page">
      <div className="admin-list-page-header">
        <h1 className="page-title">기업 목록</h1>
        <div className="admin-list-page-header__actions">
          <button
            type="button"
            className="admin-list-add-btn"
            onClick={() => navigate(enterpriseNewPath())}
          >
            기업 추가
          </button>
        </div>
      </div>

      <section className="admin-list-box admin-list-box--table" aria-label="기업 목록">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--min-w-800">
            <thead>
              <tr>
                <th>NO</th>
                <th>아이디</th>
                <th>회사명</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={row.id}>
                  <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td>
                    <Link to={enterpriseDetailPath(row.id)} className="admin-link">
                      {row.loginId}
                    </Link>
                  </td>
                  <td className="admin-table-col-title">
                    <Link
                      to={enterpriseDetailPath(row.id)}
                      className="admin-link admin-table-title-link"
                    >
                      {row.companyName}
                    </Link>
                  </td>
                  <td className="col-center">
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      aria-label={`${row.companyName} 삭제`}
                      title="삭제"
                      onClick={() => setConfirmDeleteId(row.id)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
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

      <Confirm
        open={!!confirmRow}
        title="기업 삭제"
        message={
          confirmRow ? (
            <>
              <strong>{confirmRow.companyName}</strong>
              <br />
              이 기업을 삭제하시겠습니까?
            </>
          ) : null
        }
        confirmText="삭제"
        cancelText="취소"
        danger
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
