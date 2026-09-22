import { useState } from 'react';
import { Plus } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import Modal, { ModalInput } from '../../../components/Modal';
import '../../../styles/adminPage.css';
import './TokenPricePage.css';
import {
  MOCK_TOKEN_PRICE_ITEMS,
  TOKEN_PRICE_KINDS,
  type TokenPriceItem,
  type TokenPriceKind,
} from './mock/tokenPrice.mock';

const CURRENT_EDITOR = 'admin';

const KIND_OPTIONS = TOKEN_PRICE_KINDS.map((kind) => ({ value: kind, label: kind }));

const EMPTY_ADD_FORM = {
  label: '',
  description: '',
  kind: '차감' as TokenPriceKind,
  tokens: '0',
};

function clonePriceItems(items: TokenPriceItem[]): TokenPriceItem[] {
  return items.map((item) => ({ ...item }));
}

function formatDateTime(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function parseTokenAmount(raw: string) {
  if (raw.trim() === '') return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function kindBadgeClass(kind: TokenPriceKind) {
  return kind === '지급' ? 'badge-square--secondary' : 'badge-square--danger';
}

function isTokenPriceKind(value: string): value is TokenPriceKind {
  return (TOKEN_PRICE_KINDS as readonly string[]).includes(value);
}

function createItemId(seed: string, existing: TokenPriceItem[]) {
  const latin = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  const stem = latin || seed.trim() || 'item';
  const used = new Set(existing.map((row) => row.id));
  if (!used.has(stem)) return stem;
  let index = 2;
  let next = `${stem}_${index}`;
  while (used.has(next)) {
    index += 1;
    next = `${stem}_${index}`;
  }
  return next;
}

export default function TokenPricePage() {
  const [rows, setRows] = useState<TokenPriceItem[]>(() => clonePriceItems(MOCK_TOKEN_PRICE_ITEMS));
  const [savedRows, setSavedRows] = useState<TokenPriceItem[]>(() => clonePriceItems(MOCK_TOKEN_PRICE_ITEMS));
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddForm(EMPTY_ADD_FORM);
  };

  const handleTokenChange = (id: string, nextTokens: number) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, tokens: nextTokens } : row)));
  };

  const handleAddItem = () => {
    const label = addForm.label.trim();
    if (!label) return;
    const description = addForm.description.trim();
    const nextItem: TokenPriceItem = {
      id: createItemId(description || label, rows),
      label,
      description,
      kind: addForm.kind,
      tokens: parseTokenAmount(addForm.tokens),
      updatedBy: CURRENT_EDITOR,
      updatedAt: formatDateTime(new Date()),
    };
    setRows((prev) => [...prev, nextItem]);
    closeAddModal();
  };

  const handleSave = () => {
    const now = formatDateTime(new Date());
    const next = rows.map((row) => {
      const saved = savedRows.find((item) => item.id === row.id);
      if (!saved || saved.tokens === row.tokens) return row;
      return { ...row, updatedBy: CURRENT_EDITOR, updatedAt: now };
    });
    setRows(next);
    setSavedRows(clonePriceItems(next));
  };

  return (
    <div className="admin-list-page admin-list-page--token-price">
      <div className="admin-list-page-header">
        <h1 className="page-title">토큰 단가 관리</h1>
        <button
          type="button"
          className="admin-list-add-btn"
          onClick={() => setAddModalOpen(true)}
          aria-label="항목 추가"
        >
          <Plus size={18} aria-hidden="true" />
          항목 추가
        </button>
      </div>
      <p className="token-price-page__hint">
        저장 즉시 모든 차감/지급 시점에 반영돼요. 0 = 무료 (차감 없음 + 사용자 화면 확인 알럿도 안 뜸)
      </p>

      <section className="admin-list-box admin-list-box--table" aria-label="토큰 단가 목록">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>항목</th>
                <th className="col-center">구분</th>
                <th className="col-center">토큰</th>
                <th>마지막 수정</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isFree = row.tokens === 0;
                return (
                  <tr key={row.id}>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.label}</span>
                        {row.description ? <span className="cell-line admin-list-muted">{row.description}</span> : null}
                      </div>
                    </td>
                    <td className="col-center">
                      <span
                        className={`badge-square badge-square--inline badge-square--no-transition badge-square--no-margin ${kindBadgeClass(row.kind)}`}
                      >
                        {row.kind}
                      </span>
                    </td>
                    <td className="col-center">
                      <div className="token-price-input-wrap">
                        <input
                          id={`token-price-${row.id}`}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          className={`admin-inline-input admin-accordion-input token-price-input${isFree ? ' token-price-input--free' : ''}`}
                          value={row.tokens}
                          onChange={(e) => handleTokenChange(row.id, parseTokenAmount(e.target.value))}
                          aria-label={`${row.label} 토큰 단가`}
                        />
                        {isFree ? <span className="token-price-free-label text-success">무료</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.updatedBy}</span>
                        <span className="cell-line admin-list-muted">{row.updatedAt}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <div className="admin-detail-actions">
        <button type="button" className="filter-btn filter-btn--primary" onClick={handleSave}>
          저장 (즉시 반영)
        </button>
      </div>

      <Modal open={addModalOpen} onClose={closeAddModal} ariaLabel="항목 추가" variant="option">
        <Modal.Header>
          <Modal.Title>항목 추가</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-field-grid">
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="token-price-add-label">
                항목 이름
              </label>
              <ModalInput
                id="token-price-add-label"
                type="text"
                value={addForm.label}
                onChange={(e) => setAddForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="항목 이름 입력"
                autoComplete="off"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="token-price-add-description">
                항목 설명
              </label>
              <ModalInput
                id="token-price-add-description"
                type="text"
                value={addForm.description}
                onChange={(e) => setAddForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="항목 설명 입력"
                autoComplete="off"
              />
            </div>
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">구분</span>
              <ListSelect
                ariaLabel="구분"
                className="listselect--modal"
                value={addForm.kind}
                onChange={(next) => {
                  if (!isTokenPriceKind(next)) return;
                  setAddForm((prev) => ({ ...prev, kind: next }));
                }}
                options={[...KIND_OPTIONS]}
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="token-price-add-tokens">
                토큰
              </label>
              <ModalInput
                id="token-price-add-tokens"
                type="number"
                min={0}
                inputMode="numeric"
                value={addForm.tokens}
                onChange={(e) => setAddForm((prev) => ({ ...prev, tokens: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeAddModal}>
            닫기
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={handleAddItem}>
            추가
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
