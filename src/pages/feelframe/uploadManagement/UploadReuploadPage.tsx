import { useEffect, useMemo, useState } from 'react';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import {
  MOCK_FEELFRAME_REUPLOAD_LIST,
  type FeelframeReuploadRow,
  type FeelframeReuploadStatus,
} from './mock/uploadReupload.mock';

const DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '담당자', label: '담당자' },
  { value: '이름', label: '이름' },
  { value: '아이디', label: '아이디' },
  { value: '전화번호', label: '전화번호' },
  { value: '주문번호', label: '주문번호' },
] as const;

const ANSWER_STATUS_OPTIONS = ['전체', '답변전', '답변완료'] as const;

const ITEMS_PER_PAGE = 10;

type AppliedSearch = {
  detailSearchType: string;
  keyword: string;
  answerStatus: string;
};

type AppliedChipKey = 'keyword' | 'answerStatus';

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

function isAppliedSearchEmpty(search: AppliedSearch | null) {
  if (!search) return true;
  return !search.keyword.trim() && search.answerStatus === '전체';
}

function applyFilters(rows: FeelframeReuploadRow[], search: AppliedSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();
  return rows.filter((row) => {
    if (keyword) {
      if (search.detailSearchType === '전체') {
        const allFields = [
          row.manager,
          row.customerName,
          row.customerId,
          row.orderNo,
        ]
          .map((f) => f.toLowerCase())
          .join(' ');
        if (!allFields.includes(keyword)) return false;
      } else {
        const fieldMap: Record<string, string> = {
          담당자: row.manager.toLowerCase(),
          이름: row.customerName.toLowerCase(),
          아이디: row.customerId.toLowerCase(),
          전화번호: '',
          주문번호: row.orderNo.toLowerCase(),
        };
        if (!fieldMap[search.detailSearchType].includes(keyword)) return false;
      }
    }

    if (search.answerStatus !== '전체' && row.status !== search.answerStatus) return false;
    return true;
  });
}

function getStatusClassName(status: FeelframeReuploadStatus) {
  if (status === '답변전') return 'progress-status progress-status--warning';
  return 'progress-status progress-status--secondary';
}

export default function FeelframeUploadReuploadPage() {
  const [rows, setRows] = useState<FeelframeReuploadRow[]>(() => [...MOCK_FEELFRAME_REUPLOAD_LIST]);
  const [detailSearchType, setDetailSearchType] = useState<string>('전체');
  const [keyword, setKeyword] = useState('');
  const [answerStatus, setAnswerStatus] = useState('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const filteredRows = useMemo(() => applyFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSearch = () => {
    const next: AppliedSearch = {
      detailSearchType,
      keyword,
      answerStatus,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    switch (key) {
      case 'keyword':
        setKeyword('');
        setDetailSearchType('전체');
        next.keyword = '';
        next.detailSearchType = '전체';
        break;
      case 'answerStatus':
        setAnswerStatus('전체');
        next.answerStatus = '전체';
        break;
      default:
        break;
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.answerStatus !== '전체') {
      chips.push({ key: 'answerStatus', label: `답변상태: ${appliedSearch.answerStatus}` });
    }
    return chips;
  }, [appliedSearch]);

  const closeConfirmDialog = () => setConfirmDialog(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      title: '재수정요청 항목 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        setRows((prev) => prev.filter((row) => row.id !== id));
      },
    });
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">재수정요청 관리</h1>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row admin-filter-row--equal-3">
          <div className="filter-section">
            <span className="filter-label">답변상태</span>
            <ListSelect
              ariaLabel="답변상태"
              value={answerStatus}
              onChange={setAnswerStatus}
              options={ANSWER_STATUS_OPTIONS.map((o) => ({ value: o, label: o }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={detailSearchType}
                onChange={(next) => setDetailSearchType(next)}
                options={[...DETAIL_SEARCH_OPTIONS]}
              />
              <input type="text" placeholder="검색어 입력" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="재수정요청 목록">
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
          <table className="admin-table admin-table--feelframe-reupload">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>담당자</th>
                <th>제목</th>
                <th>고객정보</th>
                <th>요청일</th>
                <th className="col-center">상태</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.orderNo}</td>
                  <td>{row.manager}</td>
                  <td>
                    <button type="button" className="admin-link">
                      {row.title}
                    </button>
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">{row.customerName}</span>
                      <span className="cell-line">{row.customerId}</span>
                    </div>
                  </td>
                  <td>{row.requestedAt}</td>
                  <td className="col-center">
                    <div className="cell-block" style={{ alignItems: 'center' }}>
                      <span className={getStatusClassName(row.status)}>
                        <span className="progress-status__dot" aria-hidden="true" />
                        <span className="progress-status__text">{row.status}</span>
                      </span>
                      {row.status === '답변완료' && row.answeredAt && (
                        <span className="cell-line" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {row.answeredAt}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="col-center">
                    <button type="button" className="row-btn row-btn--red" onClick={() => handleDelete(row.id)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                    검색 결과가 없습니다.
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
                <button key={page} type="button" className={currentPage === page ? 'active' : ''} onClick={() => setCurrentPage(page)}>
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
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} aria-label="마지막 페이지">
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      <Confirm
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message ?? ''}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        danger={confirmDialog?.danger}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
      />
    </div>
  );
}
