import { useCallback, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Confirm from '../../../components/Confirm';
import Modal, { ModalInput } from '../../../components/Modal';
import {
  getVisiblePageNumbers,
  jumpPageBack,
  jumpPageForward,
  PAGINATION_JUMP_PAGES,
} from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import {
  MOCK_FEELFRAME_OPTION_LIST,
  type FeelframeOptionRow,
} from './mock/optionList.mock';

type AppliedOptionSearch = {
  keyword: string;
};

type OptionDraft = {
  id: string | null;
  name: string;
  description: string;
  items: string[];
};

const ITEMS_PER_PAGE = 10;

const EMPTY_DRAFT: OptionDraft = {
  id: null,
  name: '',
  description: '',
  items: [''],
};

function generateOptionId() {
  return `ff-opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyOptionFilters(
  rows: FeelframeOptionRow[],
  search: AppliedOptionSearch | null
): FeelframeOptionRow[] {
  if (!search) return rows;
  const keyword = search.keyword.trim().toLowerCase();
  if (!keyword) return rows;
  return rows.filter((row) => row.name.toLowerCase().includes(keyword));
}

export default function FeelframeOptionManagementPage() {
  const [rows, setRows] = useState<FeelframeOptionRow[]>(() => [...MOCK_FEELFRAME_OPTION_LIST]);
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedOptionSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add');
  const [draft, setDraft] = useState<OptionDraft>(EMPTY_DRAFT);

  const filteredRows = useMemo(() => applyOptionFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, displayPage]);

  const handleSearch = useCallback(() => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setAppliedSearch(null);
      setCurrentPage(1);
      return;
    }
    setAppliedSearch({ keyword: trimmed });
    setCurrentPage(1);
  }, [keyword]);

  const clearKeywordChip = useCallback(() => {
    setKeyword('');
    setAppliedSearch(null);
    setCurrentPage(1);
  }, []);

  const appliedChips = useMemo(() => {
    if (!appliedSearch?.keyword.trim()) return [];
    return [{ key: 'keyword' as const, label: `옵션명: ${appliedSearch.keyword}` }];
  }, [appliedSearch]);

  const openAddEditor = useCallback(() => {
    setEditorMode('add');
    setDraft({ ...EMPTY_DRAFT, items: [''] });
    setEditorOpen(true);
  }, []);

  const openEditEditor = useCallback((row: FeelframeOptionRow) => {
    setEditorMode('edit');
    setDraft({
      id: row.id,
      name: row.name,
      description: row.description,
      items: row.items.length > 0 ? [...row.items] : [''],
    });
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
  }, []);

  const updateDraftItem = (idx: number, value: string) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIdx) => (itemIdx === idx ? value : item)),
    }));
  };

  const addDraftItem = () => {
    setDraft((prev) => ({ ...prev, items: [...prev.items, ''] }));
  };

  const removeDraftItem = (idx: number) => {
    setDraft((prev) => {
      const next = prev.items.filter((_, itemIdx) => itemIdx !== idx);
      return { ...prev, items: next.length > 0 ? next : [''] };
    });
  };

  const handleSaveDraft = () => {
    const name = draft.name.trim();
    if (!name) {
      window.alert('옵션명을 입력해 주세요.');
      return;
    }
    const items = draft.items.map((item) => item.trim()).filter(Boolean);
    if (items.length === 0) {
      window.alert('옵션 항목을 1개 이상 입력해 주세요.');
      return;
    }
    const description = draft.description.trim();

    if (editorMode === 'add') {
      const today = new Date();
      const createdAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`;
      const nextRow: FeelframeOptionRow = {
        id: generateOptionId(),
        name,
        description,
        items,
        createdAt,
      };
      setRows((prev) => [nextRow, ...prev]);
      setCurrentPage(1);
    } else if (draft.id) {
      const targetId = draft.id;
      setRows((prev) =>
        prev.map((row) => (row.id === targetId ? { ...row, name, description, items } : row))
      );
    }
    setEditorOpen(false);
  };

  const confirmDeleteRow = useCallback(() => {
    if (!deleteTargetId) return;
    setRows((prev) => prev.filter((row) => row.id !== deleteTargetId));
    setDeleteTargetId(null);
  }, [deleteTargetId]);

  const deleteTarget = useMemo(
    () => (deleteTargetId ? rows.find((row) => row.id === deleteTargetId) ?? null : null),
    [deleteTargetId, rows]
  );

  const editorTitle = editorMode === 'add' ? '옵션 추가' : '옵션 수정';

  return (
    <div className="admin-list-page">
      <div className="admin-list-page-header">
        <h1 className="page-title">옵션관리</h1>
        <button
          type="button"
          className="admin-list-add-btn"
          onClick={openAddEditor}
          aria-label="옵션 추가"
        >
          <Plus size={18} aria-hidden="true" />
          옵션 추가
        </button>
      </div>

      <section className="admin-list-box" aria-label="옵션 검색 필터">
        <div className="filter-top-row admin-filter-row--single-keyword">
          <div className="filter-section">
            <span className="filter-label">옵션명</span>
            <div className="admin-search-field">
              <input
                type="text"
                placeholder="옵션명을 입력해 주세요."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                aria-label="옵션명 검색"
              />
            </div>
          </div>

          <div className="filter-section filter-section--search-btn">
            <button
              type="button"
              className="filter-btn filter-btn--primary"
              onClick={handleSearch}
            >
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="옵션 목록">
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
                      onClick={clearKeywordChip}
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
                <th>옵션명</th>
                <th>옵션설명</th>
                <th>옵션항목</th>
                <th className="col-center">수정</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty-cell">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-table-col-title">{row.name}</td>
                    <td>{row.description || <span className="admin-list-muted">—</span>}</td>
                    <td>
                      {row.items.length > 0 ? (
                        <span>
                          {row.items.join(', ')}
                          <span className="admin-list-muted" style={{ marginLeft: '0.5rem' }}>
                            ({row.items.length}개)
                          </span>
                        </span>
                      ) : (
                        <span className="admin-list-muted">—</span>
                      )}
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-btn row-btn--primary"
                        onClick={() => openEditEditor(row)}
                      >
                        수정
                      </button>
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-btn row-btn--red"
                        onClick={() => setDeleteTargetId(row.id)}
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

      <Modal open={editorOpen} onClose={closeEditor} ariaLabel={editorTitle} variant="option">
        <Modal.Header>
          <Modal.Title>{editorTitle}</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-field-grid">
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">옵션명</span>
              <ModalInput
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="예: 색상"
                autoComplete="off"
                aria-label="옵션명"
              />
            </div>
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">옵션설명</span>
              <ModalInput
                type="text"
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="관리자용 옵션 설명을 입력해 주세요."
                autoComplete="off"
                aria-label="옵션설명"
              />
            </div>
          </div>

          <div className="admin-modal-field-grid" style={{ marginTop: 14 }}>
            <div
              className="admin-modal-field-row"
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <span className="admin-modal-field-label">옵션항목</span>
                <button
                  type="button"
                  className="filter-btn filter-btn--outline"
                  onClick={addDraftItem}
                  style={{ height: 32, padding: '0 12px' }}
                >
                  <Plus size={14} aria-hidden="true" style={{ marginRight: 4 }} />
                  항목 추가
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {draft.items.map((item, idx) => (
                  <div
                    key={`opt-item-${idx}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <ModalInput
                      type="text"
                      value={item}
                      onChange={(e) => updateDraftItem(idx, e.target.value)}
                      placeholder={`항목 ${idx + 1}`}
                      autoComplete="off"
                      aria-label={`옵션 항목 ${idx + 1}`}
                      style={{ maxWidth: 'none', flex: 1 }}
                    />
                    <button
                      type="button"
                      className="row-btn row-btn--default"
                      onClick={() => removeDraftItem(idx)}
                      aria-label={`옵션 항목 ${idx + 1} 삭제`}
                      style={{ padding: '6px 8px', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="option-modal__btn option-modal__btn--ghost"
            onClick={closeEditor}
          >
            취소
          </button>
          <button
            type="button"
            className="option-modal__btn option-modal__btn--primary"
            onClick={handleSaveDraft}
          >
            저장
          </button>
        </Modal.Footer>
      </Modal>

      <Confirm
        open={!!deleteTarget}
        title="옵션 삭제"
        message={
          deleteTarget ? (
            <>
              <strong>{deleteTarget.name}</strong> 옵션을 삭제하시겠습니까?
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
