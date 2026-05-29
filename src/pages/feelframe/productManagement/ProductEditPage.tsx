import { ChevronDown, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Suspense, lazy, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import SwitchField from '../../../components/SwitchField';
import '../../../styles/adminPage.css';
import type { FeelframeProductListRow } from './mock/productList.mock';

type Props = {
  row: FeelframeProductListRow;
  listPath: string;
  onSave: (nextRow: FeelframeProductListRow) => void;
  mode?: 'create' | 'edit';
};

type BottomThumbnailSlot = {
  id: string;
  preview: string;
  isDragging: boolean;
};

const RichTextEditor = lazy(async () => {
  const mod = await import('../../../components/RichTextEditor');
  return { default: mod.RichTextEditor };
});

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function isSupportedThumbImage(file: File): boolean {
  return file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
}

export default function FeelframeProductEditPage({ row, listPath, onSave, mode = 'edit' }: Props) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [manufacturer, setManufacturer] = useState('해당없음');
  const [manufacturerUnitPrice, setManufacturerUnitPrice] = useState('액자 12R 19,000원');
  const [mainNewProduct, setMainNewProduct] = useState(false);
  const [badgeLabels, setBadgeLabels] = useState<string[]>([]);
  const [secretSale, setSecretSale] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [secretDiscountRate, setSecretDiscountRate] = useState('');
  const [promotionSale, setPromotionSale] = useState(false);
  const [promotionDiscountRate, setPromotionDiscountRate] = useState('');
  const [promotionTitle, setPromotionTitle] = useState('');
  const [influencerDiscountRate, setInfluencerDiscountRate] = useState('');
  const [instantPurchase, setInstantPurchase] = useState(false);
  const [displayState, setDisplayState] = useState<'미진열' | '진열'>(row.displayYn === 'T' ? '진열' : '미진열');
  const [soldOutState, setSoldOutState] = useState<'판매중' | '품절'>(row.soldOutYn === 'T' ? '품절' : '판매중');
  const [mdPick, setMdPick] = useState(false);
  const [surfaceType, setSurfaceType] = useState<'무광' | '유광' | '유/무광' | '해당없음'>('해당없음');
  const [categoryMain, setCategoryMain] = useState('해당없음');
  const [categorySub, setCategorySub] = useState('');
  const [productName, setProductName] = useState(row.name);
  const [productPrice, setProductPrice] = useState(String(row.listPrice));
  const [salePrice, setSalePrice] = useState(String(row.salePrice));
  const [deliveryEnabled, setDeliveryEnabled] = useState(row.deliveryLabel === '배송');
  const [recommendedEnabled, setRecommendedEnabled] = useState(row.recommendedProductIds.length > 0);
  const [snsReviewEnabled, setSnsReviewEnabled] = useState(false);
  const [couponEnabled, setCouponEnabled] = useState(true);
  const [mainThumbnailPreview, setMainThumbnailPreview] = useState('');
  const [mainGifPreview, setMainGifPreview] = useState('');
  const [isMainThumbnailDragging, setIsMainThumbnailDragging] = useState(false);
  const [isMainGifDragging, setIsMainGifDragging] = useState(false);
  const [bottomThumbnailSlots, setBottomThumbnailSlots] = useState<BottomThumbnailSlot[]>([
    { id: 'bottom-thumb-1', preview: '', isDragging: false },
    { id: 'bottom-thumb-2', preview: '', isDragging: false },
    { id: 'bottom-thumb-3', preview: '', isDragging: false },
  ]);
  const mainThumbnailInputRef = useRef<HTMLInputElement>(null);
  const mainGifInputRef = useRef<HTMLInputElement>(null);
  const bottomThumbnailInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const accordionTitles = useMemo(
    () => ['제조사 설정', '노출 설정', '카테고리 설정', '썸네일 설정', '상품 정보', '상세설정'],
    []
  );

  const categoryOptions = useMemo(
    () => ['이벤트액자', '아크릴액자', '우드액자', '원판액자', '포토테이블', '디자인액자', '해당없음'],
    []
  );

  const subCategoryMap = useMemo<Record<string, string[]>>(
    () => ({
      이벤트액자: ['생일', '기념일', '시즌한정'],
      아크릴액자: ['투명', '컬러', '미니'],
      우드액자: ['내추럴', '월넛', '화이트오크'],
      원판액자: ['LP원형', '대형원판', '미니원판'],
      포토테이블: ['3구 세트', '5구 세트', '스탠딩'],
      디자인액자: ['모던', '빈티지', '프리미엄'],
      해당없음: ['해당없음'],
    }),
    []
  );

  const subCategoryOptions = subCategoryMap[categoryMain] ?? ['해당없음'];

  const toggleBadge = (label: string) => {
    setBadgeLabels((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  };

  const generateSecretCode = () => {
    const seed = Math.random().toString(36).slice(2, 10).toUpperCase();
    setSecretCode(seed);
  };

  const setBottomSlotDragging = (id: string, dragging: boolean) => {
    setBottomThumbnailSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, isDragging: dragging } : slot)));
  };

  const clearBottomSlotPreview = (id: string) => {
    setBottomThumbnailSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, preview: '' } : slot)));
  };

  const updateBottomSlotPreview = async (id: string, file: File) => {
    if (!isSupportedThumbImage(file)) {
      window.alert('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.');
      return;
    }
    const nextPreview = await readFileAsDataUrl(file);
    setBottomThumbnailSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, preview: nextPreview } : slot)));
  };

  const addBottomThumbnailSlot = () => {
    const nextId = `bottom-thumb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setBottomThumbnailSlots((prev) => [...prev, { id: nextId, preview: '', isDragging: false }]);
  };

  const buildSavePayload = () => {
    const displayYn: 'T' | 'F' = displayState === '진열' ? 'T' : 'F';
    const soldOutYn: 'T' | 'F' = soldOutState === '품절' ? 'T' : 'F';
    return {
      productId: row.id,
      displayYn,
      soldOutYn,
      manufacturer,
      manufacturerUnitPrice,
      mainNewProductYn: mainNewProduct ? 'T' : 'F',
      secretSaleYn: secretSale ? 'T' : 'F',
      promotionSaleYn: promotionSale ? 'T' : 'F',
      instantPurchaseYn: instantPurchase ? 'T' : 'F',
      mdPickYn: mdPick ? 'T' : 'F',
      secretCode,
      secretDiscountRate,
      promotionDiscountRate,
      promotionTitle,
      influencerDiscountRate,
      productName,
      productPrice,
      salePrice,
      deliveryYn: deliveryEnabled ? 'T' : 'F',
      recommendedYn: recommendedEnabled ? 'T' : 'F',
      snsReviewYn: snsReviewEnabled ? 'T' : 'F',
      couponYn: couponEnabled ? 'T' : 'F',
    };
  };

  const handleSave = () => {
    const payload = buildSavePayload();
    const nextListPrice = Number(payload.productPrice.replace(/[^0-9.-]/g, ''));
    const nextSalePrice = Number(payload.salePrice.replace(/[^0-9.-]/g, ''));
    const nextRow: FeelframeProductListRow = {
      ...row,
      name: payload.productName,
      listPrice: Number.isFinite(nextListPrice) ? nextListPrice : row.listPrice,
      salePrice: Number.isFinite(nextSalePrice) ? nextSalePrice : row.salePrice,
      displayYn: payload.displayYn,
      soldOutYn: payload.soldOutYn,
      deliveryLabel: payload.deliveryYn === 'T' ? '배송' : '미배송',
      recommendedProductIds: payload.recommendedYn === 'T' ? row.recommendedProductIds : [],
    };
    onSave(nextRow);
  };

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={listPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{mode === 'create' ? '상품 추가' : '상품 상세 · 수정'}</h1>
      </div>

      {accordionTitles.map((title, idx) => {
        const isOpen = openIndexes.includes(idx);
        return (
          <section
            key={title}
            className={`admin-list-box admin-accordion admin-accordion--unclipped${isOpen ? ' is-open' : ''}`}
          >
            <button
              type="button"
              className="admin-accordion__trigger"
              onClick={() =>
                setOpenIndexes((prev) =>
                  prev.includes(idx) ? prev.filter((openIdx) => openIdx !== idx) : [...prev, idx]
                )
              }
              aria-expanded={isOpen}
            >
              <span>{title}</span>
              <span className={`admin-accordion__chevron ${isOpen ? 'is-open' : ''}`} aria-hidden>
                <ChevronDown size={18} strokeWidth={1.8} />
              </span>
            </button>
            <div className={`admin-accordion__panel ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
              <div className="admin-accordion__inner">
                <div className="admin-accordion__body">
                  {idx === 0 ? (
                    <div className="admin-accordion-form-grid admin-accordion-form-grid--2">
                      <div className="admin-accordion-field">
                        <span className="admin-accordion-field__label">제조사</span>
                        <ListSelect
                          ariaLabel="제조사"
                          value={manufacturer}
                          onChange={setManufacturer}
                          options={[
                            { value: '아트데코', label: '아트데코' },
                            { value: '아트룩스', label: '아트룩스' },
                            { value: '해당없음', label: '해당없음' },
                          ]}
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <span className="admin-accordion-field__label">제조사 단가</span>
                        <ListSelect
                          ariaLabel="제조사 단가"
                          value={manufacturerUnitPrice}
                          onChange={setManufacturerUnitPrice}
                          options={[
                            { value: '액자 12R 19,000원', label: '액자 12R 19,000원' },
                            { value: '액자 8R 14,000원', label: '액자 8R 14,000원' },
                            { value: '캔버스 10x10 22,000원', label: '캔버스 10x10 22,000원' },
                            { value: '패키지 기본 35,000원', label: '패키지 기본 35,000원' },
                          ]}
                        />
                      </div>
                    </div>
                  ) : idx === 2 ? (
                    <div className="admin-accordion-form-grid admin-accordion-form-grid--2">
                      <div className="admin-accordion-field">
                        <span className="admin-accordion-field__label">카테고리</span>
                        <ListSelect
                          ariaLabel="카테고리"
                          value={categoryMain}
                          onChange={(next) => {
                            setCategoryMain(next);
                            setCategorySub('');
                          }}
                          options={categoryOptions.map((item) => ({ value: item, label: item }))}
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <span className="admin-accordion-field__label">서브카테고리</span>
                        <ListSelect
                          ariaLabel="서브카테고리"
                          value={categorySub}
                          onChange={setCategorySub}
                          options={[
                            { value: '', label: '선택' },
                            ...subCategoryOptions.map((item) => ({ value: item, label: item })),
                          ]}
                        />
                      </div>
                    </div>
                  ) : idx === 1 ? (
                    <>
                      <div className="admin-accordion-check-row">
                        
                        <div className="admin-accordion-check-group admin-accordion-check-group--no-top-margin">
                          <span className="admin-accordion-field__label">뱃지</span>
                          <div className="admin-accordion-check-list" role="group" aria-label="뱃지">
                            {['NEW', 'BEST', 'EVENT'].map((label) => {
                              const checked = badgeLabels.includes(label);
                              return (
                                <label key={label} className="admin-accordion-check-item">
                                  <input
                                    type="checkbox"
                                    className="admin-checkbox"
                                    checked={checked}
                                    onChange={() => toggleBadge(label)}
                                  />
                                  <span>{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="admin-accordion-check-group admin-accordion-check-group--no-top-margin">
                          <span className="admin-accordion-field__label">유/무광</span>
                          <div className="admin-accordion-check-list" role="group" aria-label="유/무광">
                            <label className="admin-accordion-check-item">
                              <input
                                type="checkbox"
                                className="admin-checkbox"
                                checked={surfaceType === '무광'}
                                onChange={() => setSurfaceType('무광')}
                              />
                              <span>무광</span>
                            </label>
                            <label className="admin-accordion-check-item">
                              <input
                                type="checkbox"
                                className="admin-checkbox"
                                checked={surfaceType === '유광'}
                                onChange={() => setSurfaceType('유광')}
                              />
                              <span>유광</span>
                            </label>
                            <label className="admin-accordion-check-item">
                              <input
                                type="checkbox"
                                className="admin-checkbox"
                                checked={surfaceType === '유/무광'}
                                onChange={() => setSurfaceType('유/무광')}
                              />
                              <span>유/무광</span>
                            </label>
                            <label className="admin-accordion-check-item">
                              <input
                                type="checkbox"
                                className="admin-checkbox"
                                checked={surfaceType === '해당없음'}
                                onChange={() => setSurfaceType('해당없음')}
                              />
                              <span>해당없음</span>
                            </label>
                          </div>
                        </div>
                        <SwitchField
                          label="시크릿세일"
                          checked={secretSale}
                          onChange={setSecretSale}
                          checkedText="해당"
                          uncheckedText="미해당"
                        />
                      </div>

                      <div className="admin-accordion-form-grid">
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="ff-secret-code">
                            시크릿코드
                          </label>
                          <div className="filter-row admin-inline-action-row">
                            <input
                              id="ff-secret-code"
                              type="text"
                              className="admin-inline-input admin-accordion-input"
                              value={secretCode}
                              onChange={(e) => setSecretCode(e.target.value)}
                              autoComplete="off"
                            />
                            <button type="button" className="filter-btn filter-btn--outline" onClick={generateSecretCode}>
                              생성
                            </button>
                          </div>
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="ff-secret-discount">
                            시크릿 할인율
                          </label>
                          <input
                            id="ff-secret-discount"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={secretDiscountRate}
                            onChange={(e) => setSecretDiscountRate(e.target.value)}
                            placeholder="예: 10"
                          />
                        </div>
                      </div>

                      <div className="admin-accordion-check-row">
                        <SwitchField
                          label="프로모션 세일"
                          checked={promotionSale}
                          onChange={setPromotionSale}
                          checkedText="해당"
                          uncheckedText="미해당"
                        />
                        <SwitchField
                          label="즉시구매"
                          checked={instantPurchase}
                          onChange={setInstantPurchase}
                          checkedText="해당"
                          uncheckedText="미해당"
                        />
                        <SwitchField
                          label="MD PICK"
                          checked={mdPick}
                          onChange={setMdPick}
                          checkedText="해당"
                          uncheckedText="미해당"
                        />
                      </div>

                      <div className="admin-accordion-form-grid">
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="ff-promo-discount">
                            프로모션 할인율
                          </label>
                          <input
                            id="ff-promo-discount"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={promotionDiscountRate}
                            onChange={(e) => setPromotionDiscountRate(e.target.value)}
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="ff-promo-title">
                            프로모션 타이틀
                          </label>
                          <input
                            id="ff-promo-title"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={promotionTitle}
                            onChange={(e) => setPromotionTitle(e.target.value)}
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="ff-influencer-discount">
                            인플루언서 할인율
                          </label>
                          <input
                            id="ff-influencer-discount"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={influencerDiscountRate}
                            onChange={(e) => setInfluencerDiscountRate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="admin-accordion-check-row">
                        <SwitchField
                          label="진열여부"
                          checked={displayState === '진열'}
                          onChange={(next) => setDisplayState(next ? '진열' : '미진열')}
                          checkedText="진열"
                          uncheckedText="미진열"
                        />
                        <SwitchField
                          label="품절여부"
                          checked={soldOutState === '품절'}
                          onChange={(next) => setSoldOutState(next ? '품절' : '판매중')}
                          checkedText="품절"
                          uncheckedText="판매중"
                        />
                        <SwitchField
                          label="메인신상품"
                          checked={mainNewProduct}
                          onChange={setMainNewProduct}
                          checkedText="해당"
                          uncheckedText="미해당"
                        />
                      </div>
                    </>
                  ) : idx === 3 ? (
                    <>
                      <div className="admin-thumbnail-square-grid">
                        <div className="admin-accordion-field admin-thumbnail-square-field">
                          <span className="admin-accordion-field__label">대표썸네일</span>
                          <input
                            ref={mainThumbnailInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!isSupportedThumbImage(file)) {
                                window.alert('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.');
                                e.target.value = '';
                                return;
                              }
                              setMainThumbnailPreview(await readFileAsDataUrl(file));
                            }}
                          />
                          <div
                            className={[
                              'admin-accordion-upload-box',
                              'admin-accordion-upload-box--square',
                              isMainThumbnailDragging ? 'is-dragging' : '',
                              mainThumbnailPreview ? 'has-image' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            role="button"
                            tabIndex={0}
                            aria-label="대표썸네일 업로드"
                            onClick={() => mainThumbnailInputRef.current?.click()}
                            onKeyDown={(e) => {
                              if (e.key === ' ') e.preventDefault();
                              if (e.key === 'Enter' || e.key === ' ') mainThumbnailInputRef.current?.click();
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setIsMainThumbnailDragging(true);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsMainThumbnailDragging(true);
                            }}
                            onDragLeave={(e) => {
                              if (e.currentTarget === e.target) setIsMainThumbnailDragging(false);
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              setIsMainThumbnailDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (!file) return;
                              if (!isSupportedThumbImage(file)) {
                                window.alert('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.');
                                return;
                              }
                              setMainThumbnailPreview(await readFileAsDataUrl(file));
                            }}
                          >
                            {mainThumbnailPreview ? (
                              <>
                                <img className="admin-accordion-upload-box__img" src={mainThumbnailPreview} alt="대표썸네일 미리보기" />
                                <button
                                  type="button"
                                  className="admin-accordion-upload-box__remove-btn"
                                  aria-label="대표썸네일 삭제"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMainThumbnailPreview('');
                                    if (mainThumbnailInputRef.current) {
                                      mainThumbnailInputRef.current.value = '';
                                    }
                                  }}
                                >
                                  <Trash2 size={16} aria-hidden="true" />
                                </button>
                              </>
                            ) : (
                              <div className="admin-accordion-upload-box__content">
                                <ImageIcon size={26} aria-hidden="true" />
                                <div className="admin-accordion-upload-box__text">클릭 또는 드래그로 업로드</div>
                                <div className="admin-accordion-upload-box__hint">JPG/PNG/WebP</div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="admin-accordion-field admin-thumbnail-square-field">
                          <span className="admin-accordion-field__label">대표 GIF</span>
                          <input
                            ref={mainGifInputRef}
                            type="file"
                            accept="image/gif,.gif"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.type !== 'image/gif') {
                                window.alert('GIF 파일만 업로드할 수 있습니다.');
                                e.target.value = '';
                                return;
                              }
                              setMainGifPreview(await readFileAsDataUrl(file));
                            }}
                          />
                          <div
                            className={[
                              'admin-accordion-upload-box',
                              'admin-accordion-upload-box--square',
                              isMainGifDragging ? 'is-dragging' : '',
                              mainGifPreview ? 'has-image' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            role="button"
                            tabIndex={0}
                            aria-label="대표 GIF 업로드"
                            onClick={() => mainGifInputRef.current?.click()}
                            onKeyDown={(e) => {
                              if (e.key === ' ') e.preventDefault();
                              if (e.key === 'Enter' || e.key === ' ') mainGifInputRef.current?.click();
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setIsMainGifDragging(true);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsMainGifDragging(true);
                            }}
                            onDragLeave={(e) => {
                              if (e.currentTarget === e.target) setIsMainGifDragging(false);
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              setIsMainGifDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (!file) return;
                              if (file.type !== 'image/gif') {
                                window.alert('GIF 파일만 업로드할 수 있습니다.');
                                return;
                              }
                              setMainGifPreview(await readFileAsDataUrl(file));
                            }}
                          >
                            {mainGifPreview ? (
                              <>
                                <img className="admin-accordion-upload-box__img" src={mainGifPreview} alt="대표 GIF 미리보기" />
                                <button
                                  type="button"
                                  className="admin-accordion-upload-box__remove-btn"
                                  aria-label="대표 GIF 삭제"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMainGifPreview('');
                                    if (mainGifInputRef.current) {
                                      mainGifInputRef.current.value = '';
                                    }
                                  }}
                                >
                                  <Trash2 size={16} aria-hidden="true" />
                                </button>
                              </>
                            ) : (
                              <div className="admin-accordion-upload-box__content">
                                <ImageIcon size={26} aria-hidden="true" />
                                <div className="admin-accordion-upload-box__text">클릭 또는 드래그로 업로드</div>
                                <div className="admin-accordion-upload-box__hint">GIF</div>
                              </div>
                            )}
                          </div>
                        </div>
                        {bottomThumbnailSlots.map((slot, idx2) => (
                          <div key={slot.id} className="admin-accordion-field admin-thumbnail-square-field">
                            <span className="admin-accordion-field__label">{`하단썸네일 ${idx2 + 1}`}</span>
                            <input
                              ref={(el) => {
                                bottomThumbnailInputRefs.current[slot.id] = el;
                              }}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: 'none' }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                await updateBottomSlotPreview(slot.id, file);
                              }}
                            />
                            <div
                              className={[
                                'admin-accordion-upload-box',
                                'admin-accordion-upload-box--square',
                                slot.isDragging ? 'is-dragging' : '',
                                slot.preview ? 'has-image' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              role="button"
                              tabIndex={0}
                              aria-label={`${idx2 + 1}번째 하단썸네일 업로드`}
                              onClick={() => bottomThumbnailInputRefs.current[slot.id]?.click()}
                              onKeyDown={(e) => {
                                if (e.key === ' ') e.preventDefault();
                                if (e.key === 'Enter' || e.key === ' ') bottomThumbnailInputRefs.current[slot.id]?.click();
                              }}
                              onDragEnter={(e) => {
                                e.preventDefault();
                                setBottomSlotDragging(slot.id, true);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setBottomSlotDragging(slot.id, true);
                              }}
                              onDragLeave={(e) => {
                                if (e.currentTarget === e.target) setBottomSlotDragging(slot.id, false);
                              }}
                              onDrop={async (e) => {
                                e.preventDefault();
                                setBottomSlotDragging(slot.id, false);
                                const file = e.dataTransfer.files?.[0];
                                if (!file) return;
                                await updateBottomSlotPreview(slot.id, file);
                              }}
                            >
                              {slot.preview ? (
                                <>
                                  <img className="admin-accordion-upload-box__img" src={slot.preview} alt={`하단썸네일 ${idx2 + 1} 미리보기`} />
                                  <button
                                    type="button"
                                    className="admin-accordion-upload-box__remove-btn"
                                    aria-label={`하단썸네일 ${idx2 + 1} 삭제`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      clearBottomSlotPreview(slot.id);
                                      const input = bottomThumbnailInputRefs.current[slot.id];
                                      if (input) input.value = '';
                                    }}
                                  >
                                    <Trash2 size={16} aria-hidden="true" />
                                  </button>
                                </>
                              ) : (
                                <div className="admin-accordion-upload-box__content">
                                  <ImageIcon size={26} aria-hidden="true" />
                                  <div className="admin-accordion-upload-box__text">클릭 또는 드래그로 업로드</div>
                                  <div className="admin-accordion-upload-box__hint">JPG/PNG/WebP</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="admin-accordion-field admin-thumbnail-square-field">
                          <span className="admin-accordion-field__label">썸네일 추가</span>
                          <button type="button" className="admin-thumbnail-square-add-btn" onClick={addBottomThumbnailSlot} aria-label="하단썸네일 추가">
                            +
                          </button>
                        </div>
                      </div>
                    </>
                  ) : idx === 4 ? (
                    <div className="admin-accordion-form-grid admin-accordion-form-grid--2">
                      <div className="admin-accordion-field admin-accordion-field--full">
                        <label className="admin-accordion-field__label" htmlFor="ff-product-name">
                          상품명
                        </label>
                        <input
                          id="ff-product-name"
                          type="text"
                          className="admin-inline-input admin-accordion-input"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="ff-product-price">
                          상품가격
                        </label>
                        <input
                          id="ff-product-price"
                          type="text"
                          className="admin-inline-input admin-accordion-input"
                          value={productPrice}
                          onChange={(e) => setProductPrice(e.target.value)}
                          inputMode="numeric"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="ff-sale-price">
                          판매가
                        </label>
                        <input
                          id="ff-sale-price"
                          type="text"
                          className="admin-inline-input admin-accordion-input"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  ) : idx === 5 ? (
                    <div className="admin-accordion-check-row">
                      <SwitchField
                        label="배송여부"
                        checked={deliveryEnabled}
                        onChange={setDeliveryEnabled}
                        checkedText="배송"
                        uncheckedText="미배송"
                      />
                      <SwitchField
                        label="추천상품"
                        checked={recommendedEnabled}
                        onChange={setRecommendedEnabled}
                        checkedText="사용"
                        uncheckedText="미사용"
                      />
                      <SwitchField
                        label="sns리뷰"
                        checked={snsReviewEnabled}
                        onChange={setSnsReviewEnabled}
                        checkedText="사용"
                        uncheckedText="미사용"
                      />
                      <SwitchField
                        label="쿠폰사용여부"
                        checked={couponEnabled}
                        onChange={setCouponEnabled}
                        checkedText="가능"
                        uncheckedText="불가능"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="admin-list-box">
        <Suspense fallback={<p className="admin-list-result">에디터 로딩 중...</p>}>
          <RichTextEditor initialBody="" onCancel={() => window.history.back()} onSave={() => undefined} showActions={false} />
        </Suspense>
      </section>

      <div className="admin-detail-actions">
        <button type="button" className="filter-btn filter-btn--outline" onClick={() => window.history.back()}>
          취소
        </button>
        <button
          type="button"
          className="filter-btn filter-btn--primary"
          onClick={handleSave}
        >
          저장
        </button>
      </div>
    </div>
  );
}
