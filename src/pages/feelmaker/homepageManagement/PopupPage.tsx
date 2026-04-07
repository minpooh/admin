import { useMemo, useRef, useState } from 'react';
import { Pencil, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import Modal from '../../../components/Modal';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import './PopupPage.css';

type PopupRow = {
  id: string;
  exposed: boolean; // true: 노출, false: 미노출
  screen: '메인' | '리스트';
  category: '전체' | '성장영상' | '영상편지' | '식전영상';
  landingPageAddress: string;
  imageUrl: string;
  updatedAt: string;
  updatedBy: string;
};

const INITIAL_POPUPS: PopupRow[] = [
  {
    id: 'popup-1',
    exposed: true,
    screen: '메인',
    category: '전체',
    landingPageAddress: '/landing/main/all',
    imageUrl: 'https://feelmaker.co.kr//img/popup/pop_coupon.png',
    updatedAt: '2026-04-02',
    updatedBy: '관리자',
  },
  {
    id: 'popup-2',
    exposed: false,
    screen: '메인',
    category: '성장영상',
    landingPageAddress: '/landing/main/growth',
    imageUrl: 'https://dummyimage.com/1200x600/0ea5e9/ffffff&text=Popup+Main+Growth',
    updatedAt: '2026-04-02',
    updatedBy: '관리자',
  },
  {
    id: 'popup-3',
    exposed: true,
    screen: '리스트',
    category: '영상편지',
    landingPageAddress: '/landing/list/video-letter',
    imageUrl: 'https://dummyimage.com/1200x600/10b981/ffffff&text=Popup+List+Video+Letter',
    updatedAt: '2026-04-02',
    updatedBy: '관리자',
  },
  {
    id: 'popup-4',
    exposed: true,
    screen: '리스트',
    category: '식전영상',
    landingPageAddress: '/landing/list/pre-video',
    imageUrl: 'https://dummyimage.com/1200x600/f97316/ffffff&text=Popup+List+Pre-Video',
    updatedAt: '2026-04-02',
    updatedBy: '관리자',
  },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function PopupPage() {
  const [rows, setRows] = useState<PopupRow[]>(INITIAL_POPUPS);
  const [selectedPopupId, setSelectedPopupId] = useState<string>(() => INITIAL_POPUPS[0]?.id ?? '');

  const selectedPopup = useMemo(() => {
    if (!rows.length) return null;
    return rows.find((r) => r.id === selectedPopupId) ?? rows[0];
  }, [rows, selectedPopupId]);

  const activePopupId = selectedPopup?.id ?? '';

  const [editOpen, setEditOpen] = useState(false);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [draftExposed, setDraftExposed] = useState(true);
  const [draftScreen, setDraftScreen] = useState<PopupRow['screen']>('메인');
  const [draftCategory, setDraftCategory] = useState<PopupRow['category']>('전체');
  const [draftLanding, setDraftLanding] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
  const [isImageDragging, setIsImageDragging] = useState(false);
  const popupImageInputRef = useRef<HTMLInputElement | null>(null);
  const closeEdit = () => {
    setEditOpen(false);
    setEditRowId(null);
  };

  const openEdit = (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    setEditRowId(rowId);
    setDraftExposed(row.exposed);
    setDraftScreen(row.screen);
    setDraftCategory(row.category);
    setDraftLanding(row.landingPageAddress);
    setDraftImageUrl(row.imageUrl);
    setIsImageDragging(false);
    if (popupImageInputRef.current) popupImageInputRef.current.value = '';
    setEditOpen(true);
  };

  const openAdd = () => {
    setEditRowId(null);
    setDraftExposed(true);
    setDraftScreen('메인');
    setDraftCategory('전체');
    setDraftLanding('');
    setDraftImageUrl('');
    setIsImageDragging(false);
    if (popupImageInputRef.current) popupImageInputRef.current.value = '';
    setEditOpen(true);
  };

  const saveEdit = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (editRowId) {
      setRows((prev) =>
        prev.map((r) =>
          r.id !== editRowId
            ? r
            : {
                ...r,
                exposed: draftExposed,
                screen: draftScreen,
                category: draftCategory,
                landingPageAddress: draftLanding.trim(),
                imageUrl: draftImageUrl.trim(),
                updatedAt: today,
                updatedBy: '관리자',
              },
        ),
      );
    } else {
      const newRow: PopupRow = {
        id: `popup-${crypto.randomUUID()}`,
        exposed: draftExposed,
        screen: draftScreen,
        category: draftCategory,
        landingPageAddress: draftLanding.trim(),
        imageUrl: draftImageUrl.trim(),
        updatedAt: today,
        updatedBy: '관리자',
      };
      setRows((prev) => [newRow, ...prev]);
      setSelectedPopupId(newRow.id);
    }
    closeEdit();
  };

  const isEditMode = editRowId !== null;
  const modalTitle = isEditMode ? '팝업 수정' : '팝업 추가';

  const handleDeleteRow = (rowId: string) => {
    if (!window.confirm('이 팝업을 삭제하시겠습니까?')) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const triggerImagePick = () => {
    popupImageInputRef.current?.click();
  };

  return (
    <div className="admin-list-page">
      <div className="popup-page-header">
        <h1 className="page-title">팝업관리</h1>
        <button type="button" className="admin-list-add-btn" onClick={openAdd} aria-label="팝업 추가">
          <Plus size={18} aria-hidden="true" />
          팝업 추가
        </button>
      </div>

      <div className="popup-page-layout">
        <section className="popup-preview-section" aria-label="팝업 미리보기">
          <div className="popup-preview-column">
            {selectedPopup ? (
              <div className="popup-preview-box">
                <img className="popup-preview-box__img" src={selectedPopup.imageUrl} alt="선택된 팝업 미리보기" />
              </div>
            ) : (
              <div className="popup-preview-empty">선택된 팝업이 없습니다.</div>
            )}
          </div>
        </section>

        <section className="admin-list-box admin-list-box--table popup-list-box" aria-label="팝업 목록">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>노출</th>
                  <th>노출화면</th>
                  <th>노출카테고리</th>
                  <th>랜딩페이지</th>
                  <th className="col-center">수정</th>
                  <th className="col-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={r.id === activePopupId ? 'popup-row is-selected' : 'popup-row'}
                    onClick={() => setSelectedPopupId(r.id)}
                  >
                    <td>{r.exposed ? '노출' : '미노출'}</td>
                    <td>{r.screen}</td>
                    <td>{r.category}</td>
                    <td>
                      <span className="admin-list-muted">{r.landingPageAddress}</span>
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-primary"
                        aria-label="수정"
                        title="수정"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(r.id);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(r.id);
                        }}
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="admin-list-muted" style={{ textAlign: 'center' }}>
                      등록된 팝업이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Modal open={editOpen} onClose={closeEdit} ariaLabel={modalTitle} variant="option">
        <Modal.Header>
          <Modal.Title>{modalTitle}</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="popup-edit-form">
            <div className="popup-edit-row">
              <div className="popup-edit-col popup-edit-col--thumb">
                <label className="popup-edit-label" htmlFor="popup-image-file">
                  이미지
                </label>
                <input
                  ref={popupImageInputRef}
                  id="popup-image-file"
                  type="file"
                  accept="image/*"
                  className="popup-edit-input popup-edit-file"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await readFileAsDataUrl(file);
                    setDraftImageUrl(url);
                  }}
                />
                <div
                  className={['popup-upload-box', isImageDragging ? 'is-dragging' : '', draftImageUrl ? 'has-image' : '']
                    .join(' ')
                    .trim()}
                  role="button"
                  tabIndex={0}
                  aria-label="팝업 이미지 업로드"
                  onClick={triggerImagePick}
                  onKeyDown={(e) => {
                    if (e.key === ' ') e.preventDefault();
                    if (e.key === 'Enter' || e.key === ' ') triggerImagePick();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsImageDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsImageDragging(true);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget === e.target) setIsImageDragging(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsImageDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    const url = await readFileAsDataUrl(file);
                    setDraftImageUrl(url);
                  }}
                >
                  {draftImageUrl ? (
                    <img className="popup-upload-box__img" src={draftImageUrl} alt="팝업 이미지 미리보기" />
                  ) : (
                    <div className="popup-upload-box__content">
                      <ImageIcon size={26} aria-hidden="true" />
                      <div className="popup-upload-box__text">클릭 또는 드래그로 업로드</div>
                      <div className="popup-upload-box__hint">JPG/PNG 추천</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="popup-edit-col popup-edit-col--meta">
                <div className="popup-edit-field">
                  <label className="popup-edit-label" htmlFor="popup-exposed">
                    노출여부
                  </label>
                  <ListSelect
                    ariaLabel="노출여부"
                    className="listselect--modal"
                    value={draftExposed ? 'exposed' : 'hidden'}
                    onChange={(next) => setDraftExposed(next === 'exposed')}
                    options={[
                      { value: 'exposed', label: '노출' },
                      { value: 'hidden', label: '미노출' },
                    ]}
                  />
                </div>

                <div className="popup-edit-field">
                  <label className="popup-edit-label" htmlFor="popup-screen">
                    노출화면
                  </label>
                  <ListSelect
                    ariaLabel="노출화면"
                    className="listselect--modal"
                    value={draftScreen === '메인' ? 'main' : 'list'}
                    onChange={(next) => setDraftScreen(next === 'main' ? '메인' : '리스트')}
                    options={[
                      { value: 'main', label: '메인' },
                      { value: 'list', label: '리스트' },
                    ]}
                  />
                </div>

                <div className="popup-edit-field">
                  <label className="popup-edit-label" htmlFor="popup-category">
                    노출카테고리
                  </label>
                  <ListSelect
                    ariaLabel="노출카테고리"
                    className="listselect--modal"
                    value={
                      draftCategory === '전체'
                        ? 'all'
                        : draftCategory === '성장영상'
                          ? 'growth'
                          : draftCategory === '영상편지'
                            ? 'video-letter'
                            : 'pre-video'
                    }
                    onChange={(next) => {
                      if (next === 'all') setDraftCategory('전체');
                      else if (next === 'growth') setDraftCategory('성장영상');
                      else if (next === 'video-letter') setDraftCategory('영상편지');
                      else setDraftCategory('식전영상');
                    }}
                    options={[
                      { value: 'all', label: '전체' },
                      { value: 'growth', label: '성장영상' },
                      { value: 'video-letter', label: '영상편지' },
                      { value: 'pre-video', label: '식전영상' },
                    ]}
                  />
                </div>

                <div className="popup-edit-field popup-edit-field--last">
                  <label className="popup-edit-label" htmlFor="popup-landing">
                    랜딩페이지
                  </label>
                  <input
                    id="popup-landing"
                    className="popup-edit-input"
                    type="text"
                    value={draftLanding}
                    onChange={(e) => setDraftLanding(e.target.value)}
                    placeholder="/landing/..."
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

