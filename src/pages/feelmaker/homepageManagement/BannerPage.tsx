import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import Modal from '../../../components/modal';
import '../../../styles/adminListPage.css';
import '../orderManagement/OrderListPage.css';
import ListSelect from '../../../components/ListSelect';
import './BannerPage.css';

type MainBanner = {
  id: string;
  title: string;
  imageUrl: string;
};

type BannerRow = {
  id: string;
  order: number;
  exposed: boolean;
  thumbnailUrl: string;
  createdAt: string;
  createdBy: string;
};

const MAIN_BANNERS_MOCK: MainBanner[] = [
  {
    id: 'main-1',
    title: '메인 배너 1',
    imageUrl: 'https://feelmaker.co.kr/img/visual/main2.png',
  },
  {
    id: 'main-2',
    title: '메인 배너 2',
    imageUrl: 'https://feelmaker.co.kr/img/visual/main_baby3.jpg',
  },
  {
    id: 'main-3',
    title: '메인 배너 3',
    imageUrl: 'https://feelmaker.co.kr/img/visual/test.jpg',
  },
];

const INITIAL_ROWS: BannerRow[] = [
  {
    id: 'row-1',
    order: 1,
    exposed: true,
    thumbnailUrl: MAIN_BANNERS_MOCK[0]?.imageUrl ?? '',
    createdAt: '2026-04-02',
    createdBy: '관리자',
  },
  {
    id: 'row-2',
    order: 2,
    exposed: false,
    thumbnailUrl: MAIN_BANNERS_MOCK[1]?.imageUrl ?? '',
    createdAt: '2026-04-02',
    createdBy: '관리자',
  },
  {
    id: 'row-3',
    order: 3,
    exposed: true,
    thumbnailUrl: MAIN_BANNERS_MOCK[2]?.imageUrl ?? '',
    createdAt: '2026-04-02',
    createdBy: '관리자',
  },
];

/** 배열 순서를 유지한 채 order만 1…n으로 맞춤 (행 스왑·삭제 등) */
function renumberRowsInPlace(input: BannerRow[]): BannerRow[] {
  return input.map((r, idx) => ({ ...r, order: idx + 1 }));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function BannerPage() {
  const [rows, setRows] = useState<BannerRow[]>(() => renumberRowsInPlace(INITIAL_ROWS));
  const [activeBannerId, setActiveBannerId] = useState<string>(() => INITIAL_ROWS[0]?.id ?? '');
  const [previewExposedOnly, setPreviewExposedOnly] = useState(false);

  const sortedRows = useMemo(() => renumberRowsInPlace(rows), [rows]);

  /** 미리보기: 체크 시 노출만, 해제 시 전체(목록 순서 유지) */
  const previewRows = useMemo(() => {
    if (!previewExposedOnly) return sortedRows;
    return sortedRows.filter((r) => r.exposed);
  }, [sortedRows, previewExposedOnly]);

  /**
   * 목록·노출·순서·썸네일 등 rows 변경, 노출만 보기 토글 시마다 미리보기를 현재 기준 1번(필터 시 노출 목록의 1번)으로 맞춤.
   * 슬라이더 화살표로만 바뀐 activeBannerId는 rows/previewRows 미변경이므로 이 effect는 돌지 않음.
   */
  useEffect(() => {
    if (!previewRows.length) {
      queueMicrotask(() => setActiveBannerId(''));
      return;
    }
    queueMicrotask(() => setActiveBannerId(previewRows[0].id));
  }, [previewRows, previewExposedOnly]);

  const activeIndex = Math.max(0, previewRows.findIndex((r) => r.id === activeBannerId));
  const activeBanner = previewRows[activeIndex];

  const goPrev = () => {
    const total = previewRows.length;
    if (!total) return;
    const next = (activeIndex - 1 + total) % total;
    setActiveBannerId(previewRows[next]?.id ?? '');
  };

  const goNext = () => {
    const total = previewRows.length;
    if (!total) return;
    const next = (activeIndex + 1) % total;
    setActiveBannerId(previewRows[next]?.id ?? '');
  };

  const moveRow = (rowId: string, direction: -1 | 1) => {
    setRows((prev) => {
      const list = renumberRowsInPlace(prev);
      const idx = list.findIndex((r) => r.id === rowId);
      if (idx < 0) return prev;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= list.length) return prev;
      const next = [...list];
      const tmp = next[idx];
      next[idx] = next[nextIdx];
      next[nextIdx] = tmp;
      return renumberRowsInPlace(next);
    });
  };

  const handleDeleteRow = (rowId: string) => {
    if (!window.confirm('이 배너를 삭제하시겠습니까?')) return;
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== rowId);
      return renumberRowsInPlace(filtered);
    });
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [draftThumbnailUrl, setDraftThumbnailUrl] = useState('');
  const [draftExposed, setDraftExposed] = useState(true);
  const [draftOrder, setDraftOrder] = useState(1);
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const thumbFileInputRef = useRef<HTMLInputElement | null>(null);

  const openEdit = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    setEditRowId(rowId);
    setDraftThumbnailUrl(row.thumbnailUrl);
    setDraftExposed(row.exposed);
    setDraftOrder(row.order);
    setIsThumbDragging(false);
    if (thumbFileInputRef.current) thumbFileInputRef.current.value = '';
    setEditOpen(true);
  };

  const openAdd = () => {
    setEditRowId(null);
    setDraftThumbnailUrl('');
    setDraftExposed(true);
    setDraftOrder(rows.length + 1);
    setIsThumbDragging(false);
    if (thumbFileInputRef.current) thumbFileInputRef.current.value = '';
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditRowId(null);
  };

  const saveEdit = () => {
    const order = Number.isFinite(draftOrder) ? draftOrder : 1;

    if (editRowId) {
      setRows((prev) => {
        const list = renumberRowsInPlace(prev);
        const idx = list.findIndex((r) => r.id === editRowId);
        if (idx < 0) return prev;
        const n = list.length;
        const clampedOrder = Math.max(1, Math.min(order, n));
        const updated: BannerRow = {
          ...list[idx],
          thumbnailUrl: draftThumbnailUrl.trim(),
          exposed: draftExposed,
        };
        const without = list.filter((r) => r.id !== editRowId);
        const insertAt = Math.max(0, Math.min(clampedOrder - 1, without.length));
        const next = [...without.slice(0, insertAt), updated, ...without.slice(insertAt)];
        return renumberRowsInPlace(next);
      });
    } else {
      setRows((prev) => {
        const normalized = renumberRowsInPlace(prev);
        const nextLen = normalized.length + 1;
        const clampedOrder = Math.max(1, Math.min(order, nextLen));
        const newRow: BannerRow = {
          id: `row-${crypto.randomUUID()}`,
          order: clampedOrder,
          exposed: draftExposed,
          thumbnailUrl: draftThumbnailUrl.trim(),
          createdAt: new Date().toISOString().slice(0, 10),
          createdBy: '관리자',
        };
        const next = [...normalized];
        next.splice(clampedOrder - 1, 0, newRow);
        return renumberRowsInPlace(next);
      });
    }
    closeEdit();
  };

  const previewTotal = previewRows.length;

  const triggerThumbPick = () => {
    thumbFileInputRef.current?.click();
  };

  const isEditMode = editRowId !== null;
  const modalTitle = isEditMode ? '배너 수정' : '배너 추가';
  const orderInputMax = isEditMode ? Math.max(1, rows.length) : Math.max(1, rows.length + 1);

  return (
    <div className="admin-list-page">
      <div className="banner-page-header">
        <h1 className="page-title">배너관리</h1>
        <button type="button" className="admin-list-add-btn" onClick={openAdd} aria-label="배너 추가">
          <Plus size={18} aria-hidden="true" />
          배너 추가
        </button>
      </div>

      <section className="banner-preview-section" aria-label="메인 배너 미리보기">
        <div className="banner-preview-section__slider-wrap">
          <div className="banner-preview-slider" role="region" aria-label="메인 배너 슬라이더">
            <div className="banner-preview-slider__viewport">
              {previewTotal === 0 ? (
                <div className="banner-preview-slider__empty">노출된 배너가 없습니다.</div>
              ) : (
                <div
                  className="banner-preview-slider__track"
                  style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                  {previewRows.map((r) => (
                    <div
                      key={r.id}
                      className="banner-preview-slider__slide"
                      aria-hidden={r.id !== activeBanner?.id}
                    >
                      <img className="banner-preview-slider__img" src={r.thumbnailUrl} alt="메인 배너 미리보기" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="banner-preview-toolbar">
            <div className="banner-preview-exposed-filter">
              <span className="banner-preview-exposed-filter__label" id="banner-preview-exposed-label">
                노출만 보기
              </span>
              <button
                type="button"
                id="banner-preview-exposed-switch"
                role="switch"
                aria-checked={previewExposedOnly}
                aria-labelledby="banner-preview-exposed-label"
                className={`banner-preview-switch ${previewExposedOnly ? 'is-on' : ''}`}
                onClick={() => setPreviewExposedOnly((v) => !v)}
              >
                <span className="banner-preview-switch__thumb" aria-hidden />
              </button>
            </div>

            <div className="banner-preview-slider__navs" aria-hidden={previewTotal <= 1}>
              <button
                type="button"
                className="banner-preview-slider__nav"
                onClick={goPrev}
                aria-label="이전 슬라이드"
                disabled={previewTotal <= 1}
              >
                ‹
              </button>
              <button
                type="button"
                className="banner-preview-slider__nav"
                onClick={goNext}
                aria-label="다음 슬라이드"
                disabled={previewTotal <= 1}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="배너 목록">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>배너 순서</th>
                <th>노출</th>
                <th>썸네일</th>
                <th>등록일</th>
                <th>등록자</th>
                <th className="col-center">수정</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r, idx) => (
                <tr key={r.id}>
                  <td>
                    <div className="banner-order-cell">
                      <span className="banner-order-value">{r.order}</span>
                      <div className="banner-order-actions" aria-label="배너 순서 정렬">
                        <button
                          type="button"
                          className="row-icon-btn row-icon-btn--compact banner-order-sort-btn"
                          aria-label="위로"
                          title="위로"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveRow(r.id, -1);
                          }}
                        >
                          <ChevronUp size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="row-icon-btn row-icon-btn--compact banner-order-sort-btn"
                          aria-label="아래로"
                          title="아래로"
                          disabled={idx === sortedRows.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveRow(r.id, 1);
                          }}
                        >
                          <ChevronDown size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>{r.exposed ? '노출' : '미노출'}</td>
                  <td>
                    <img className="banner-row__thumb" src={r.thumbnailUrl} alt="배너 썸네일" />
                  </td>
                  <td>{r.createdAt}</td>
                  <td>{r.createdBy}</td>
                  <td className="col-center">
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--tone-primary"
                      aria-label="수정"
                      title="수정"
                      onClick={() => openEdit(r.id)}
                    >
                      <Pencil size={18} aria-hidden="true" />
                    </button>
                  </td>
                  <td className="col-center">
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      aria-label="삭제"
                      title="삭제"
                      onClick={() => handleDeleteRow(r.id)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={editOpen} onClose={closeEdit} ariaLabel={modalTitle} variant="option">
        <Modal.Header>
          <Modal.Title>{modalTitle}</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="banner-edit-form">
            <div className="banner-edit-row">
              <div className="banner-edit-col banner-edit-col--thumb">
                <label className="banner-edit-label" htmlFor="banner-thumbnail-url">
                  썸네일
                </label>
                <input
                  ref={thumbFileInputRef}
                  id="banner-thumbnail-url"
                  type="file"
                  accept="image/*"
                  className="banner-edit-input banner-edit-file"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await readFileAsDataUrl(file);
                    setDraftThumbnailUrl(url);
                  }}
                />

                <div
                  className={[
                    'banner-upload-box',
                    isThumbDragging ? 'is-dragging' : '',
                    draftThumbnailUrl.trim() ? 'has-image' : '',
                  ].join(' ')}
                  role="button"
                  tabIndex={0}
                  aria-label="썸네일 업로드"
                  onClick={triggerThumbPick}
                  onKeyDown={(e) => {
                    if (e.key === ' ') e.preventDefault();
                    if (e.key === 'Enter' || e.key === ' ') triggerThumbPick();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsThumbDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsThumbDragging(true);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget === e.target) setIsThumbDragging(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsThumbDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    const url = await readFileAsDataUrl(file);
                    setDraftThumbnailUrl(url);
                  }}
                >
                  {draftThumbnailUrl.trim() ? (
                    <img className="banner-upload-box__img" src={draftThumbnailUrl.trim()} alt="썸네일 미리보기" />
                  ) : (
                    <div className="banner-upload-box__content">
                      <ImageIcon size={26} aria-hidden="true" />
                      <div className="banner-upload-box__text">클릭 또는 드래그로 업로드</div>
                      <div className="banner-upload-box__hint">JPG/PNG 추천</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="banner-edit-col banner-edit-col--meta">
                <div className="banner-edit-field">
                  <label className="banner-edit-label" htmlFor="banner-exposed">
                    노출여부
                  </label>
                  <ListSelect
                    ariaLabel="노출여부"
                    value={draftExposed ? 'exposed' : 'hidden'}
                    onChange={(next) => setDraftExposed(next === 'exposed')}
                    options={[
                      { value: 'exposed', label: '노출' },
                      { value: 'hidden', label: '미노출' },
                    ]}
                  />
                </div>

                <div className="banner-edit-field banner-edit-field--last">
                  <label className="banner-edit-label" htmlFor="banner-order">
                    순서
                  </label>
                  <input
                    id="banner-order"
                    className="banner-edit-input"
                    type="number"
                    min={1}
                    max={orderInputMax}
                    value={draftOrder}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setDraftOrder(Number.isFinite(n) ? n : 1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeEdit}>
            취소
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={saveEdit}>
            저장
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

