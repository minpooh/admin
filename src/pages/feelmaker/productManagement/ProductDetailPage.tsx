import { Suspense, lazy, useMemo, useRef, useState } from 'react';
import { ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import '../../../styles/adminArrordion.css';

const RichTextEditor = lazy(async () => {
  const mod = await import('../../../components/RichTextEditor');
  return { default: mod.RichTextEditor };
});

export type ProductRow = {
  id: string;
  productNo: string;
  order: number;
  thumbnailUrl: string;
  name: string;
  exposed: boolean;
  serviceUrl: string;
  /** 목록 카테고리 탭 필터용 식별자 (wedding, letter, baby, thanks, invi, event, opening) */
  category: string;
};

type ProductDetailPageProps = {
  listPath: string;
  isCreate?: boolean;
  onSave: () => void;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ProductDetailPage({ listPath, isCreate = false, onSave }: ProductDetailPageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [categoryType, setCategoryType] = useState('');
  const [categoryDetailType, setCategoryDetailType] = useState('');
  const [categoryLangType, setCategoryLangType] = useState('');
  const [partnerMallUse, setPartnerMallUse] = useState('');
  const [storefarmUse, setStorefarmUse] = useState('');
  const [creatorUse, setCreatorUse] = useState('');
  const [hallRecommendValues, setHallRecommendValues] = useState<string[]>([]);
  const [badgeLabelValues, setBadgeLabelValues] = useState<string[]>([]);

  const [productInfoId, setProductInfoId] = useState('');
  const [productAuthor, setProductAuthor] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productShortDesc, setProductShortDesc] = useState('');
  const [baroplayUrl, setBaroplayUrl] = useState('');
  const [videoLengthSec, setVideoLengthSec] = useState('');
  const [productTags, setProductTags] = useState('');

  const [priceOriginal, setPriceOriginal] = useState('');
  const [priceSale, setPriceSale] = useState('');
  const [priceDirect, setPriceDirect] = useState('');
  const [priceWeddingbook, setPriceWeddingbook] = useState('');
  const [priceWeddingGoddess, setPriceWeddingGoddess] = useState('');
  const [priceHolsu, setPriceHolsu] = useState('');

  const [thumbnailImagePreview, setThumbnailImagePreview] = useState('');
  const [thumbnailGifPreview, setThumbnailGifPreview] = useState('');
  const [isThumbImageDragging, setIsThumbImageDragging] = useState(false);
  const [isThumbGifDragging, setIsThumbGifDragging] = useState(false);
  const thumbImageInputRef = useRef<HTMLInputElement>(null);
  const thumbGifInputRef = useRef<HTMLInputElement>(null);

  const [aepxTemplateFileName, setAepxTemplateFileName] = useState('');
  const [aepxDraftTemplateFileName, setAepxDraftTemplateFileName] = useState('');

  const [bgMusicChange, setBgMusicChange] = useState<'allowed' | 'forbidden' | null>(null);
  const [defaultBgmFileName, setDefaultBgmFileName] = useState('');

  const [mixProductOpeningSetting, setMixProductOpeningSetting] = useState('');
  const [sceneLength, setSceneLength] = useState('');

  const [sceneSettingText, setSceneSettingText] = useState('');
  const [sceneDataId, setSceneDataId] = useState('');
  const [sceneValue, setSceneValue] = useState('');
  const [sceneCategory, setSceneCategory] = useState('');
  const [sceneType, setSceneType] = useState('');

  const [captionSettingText, setCaptionSettingText] = useState('');
  const [captionDataId, setCaptionDataId] = useState('');
  const [captionType, setCaptionType] = useState('');
  const [captionValue, setCaptionValue] = useState('');
  const [captionHorizontal, setCaptionHorizontal] = useState('');
  const [captionVertical, setCaptionVertical] = useState('');

  const [baseSettingText, setBaseSettingText] = useState('');
  const [baseSettingName, setBaseSettingName] = useState('');
  const [baseSettingValue, setBaseSettingValue] = useState('');
  const [baseSettingType, setBaseSettingType] = useState('');

  const hallRecommendOptions = useMemo(
    () => ['해당없음', '밝은홀', '어두운홀', '야외웨딩', '하우스웨딩', '한옥웨딩', '채플웨딩'],
    []
  );
  const badgeLabelOptions = useMemo(() => ['NEW', 'HOT', 'PICK'] as const, []);
  const accordionItems = useMemo(
    () =>
      Array.from({ length: 10 }, (_, idx) => ({
        id: idx + 1,
        title:
          idx === 0
            ? '카테고리 설정'
            : idx === 1
              ? '상품 정보'
              : idx === 2
                ? '가격 설정'
                : idx === 3
                  ? '썸네일 설정'
                  : idx === 4
                    ? 'AEPX'
                    : idx === 5
                      ? '배경음악 설정'
                      : idx === 6
                        ? '기타 설정'
                        : idx === 7
                          ? '장면 설정'
                          : idx === 8
                            ? '자막 설정'
                            : idx === 9
                              ? '기본 설정'
                              : `아코디언 박스 ${idx + 1}`,
      })),
    []
  );

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={listPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{isCreate ? '상품 등록' : '상품 상세 수정'}</h1>
      </div>

      {accordionItems.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <section key={item.id} className="admin-list-box admin-accordion">
            <button
              type="button"
              className="admin-accordion__trigger"
              onClick={() => setOpenIndex((prev) => (prev === idx ? null : idx))}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <span className={`admin-accordion__chevron ${isOpen ? 'is-open' : ''}`} aria-hidden>
                <ChevronDown size={18} strokeWidth={1.8} />
              </span>
            </button>
            <div className={`admin-accordion__panel ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
              <div className="admin-accordion__inner">
                <div className="admin-accordion__body">
                  {idx === 0 ? (
                    <>
                      <div className="admin-accordion-form-grid">
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">상품분류</span>
                          <ListSelect
                            ariaLabel="상품분류"
                            value={categoryType}
                            onChange={setCategoryType}
                            options={[{ value: '', label: '선택' }]}
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">상품상세분류</span>
                          <ListSelect
                            ariaLabel="상품상세분류"
                            value={categoryDetailType}
                            onChange={setCategoryDetailType}
                            options={[{ value: '', label: '선택' }]}
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">상품언어분류</span>
                          <ListSelect
                            ariaLabel="상품언어분류"
                            value={categoryLangType}
                            onChange={setCategoryLangType}
                            options={[{ value: '', label: '선택' }]}
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">제휴몰 사용</span>
                          <ListSelect
                            ariaLabel="제휴몰 사용"
                            value={partnerMallUse}
                            onChange={setPartnerMallUse}
                            options={[{ value: '', label: '선택' }]}
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">스팜 사용</span>
                          <ListSelect
                            ariaLabel="스팜 사용"
                            value={storefarmUse}
                            onChange={setStorefarmUse}
                            options={[{ value: '', label: '선택' }]}
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">크리에이터 사용</span>
                          <ListSelect
                            ariaLabel="크리에이터 사용"
                            value={creatorUse}
                            onChange={setCreatorUse}
                            options={[{ value: '', label: '선택' }]}
                          />
                        </div>
                      </div>

                      <div className="admin-accordion-check-row">
                        <div className="admin-accordion-check-group admin-accordion-check-group--no-top-margin">
                          <span className="admin-accordion-field__label">홀 추천</span>
                          <div className="admin-accordion-check-list" role="group" aria-label="홀 추천">
                            {hallRecommendOptions.map((option) => {
                              const checked = hallRecommendValues.includes(option);
                              return (
                                <label key={option} className="admin-accordion-check-item">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setHallRecommendValues((prev) =>
                                        checked ? prev.filter((v) => v !== option) : [...prev, option]
                                      )
                                    }
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="admin-accordion-check-group admin-accordion-check-group--no-top-margin">
                          <span className="admin-accordion-field__label">뱃지 선택</span>
                          <div className="admin-accordion-check-list" role="group" aria-label="뱃지 선택">
                            {badgeLabelOptions.map((option) => {
                              const checked = badgeLabelValues.includes(option);
                              return (
                                <label key={option} className="admin-accordion-check-item">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setBadgeLabelValues((prev) =>
                                        checked ? prev.filter((v) => v !== option) : [...prev, option]
                                      )
                                    }
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : idx === 1 ? (
                    <div className="admin-accordion-form-grid">
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="product-info-id">
                          상품아이디
                        </label>
                        <input
                          id="product-info-id"
                          type="text"
                          className="admin-inline-input admin-accordion-input"
                          value={productInfoId}
                          onChange={(e) => setProductInfoId(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="product-author">
                          제작자
                        </label>
                        <input
                          id="product-author"
                          type="text"
                          className="admin-inline-input admin-accordion-input"
                          value={productAuthor}
                          onChange={(e) => setProductAuthor(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="product-title">
                          상품명
                        </label>
                        <input
                          id="product-title"
                          type="text"
                          className="admin-inline-input admin-accordion-input"
                          value={productTitle}
                          onChange={(e) => setProductTitle(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="admin-accordion-field admin-accordion-field--full">
                        <label className="admin-accordion-field__label" htmlFor="product-short-desc">
                          상품간략설명
                        </label>
                        <input
                          id="product-short-desc"
                          type="text"
                          className="admin-inline-input admin-accordion-input"
                          value={productShortDesc}
                          onChange={(e) => setProductShortDesc(e.target.value)}
                          autoComplete="off"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="baroplay-url">
                          바로플레이 주소
                        </label>
                        <input
                          id="baroplay-url"
                          type="url"
                          className="admin-inline-input admin-accordion-input"
                          value={baroplayUrl}
                          onChange={(e) => setBaroplayUrl(e.target.value)}
                          placeholder="https://"
                          autoComplete="off"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="video-length-sec">
                          영상길이(초)
                        </label>
                        <input
                          id="video-length-sec"
                          type="number"
                          className="admin-inline-input admin-accordion-input"
                          value={videoLengthSec}
                          onChange={(e) => setVideoLengthSec(e.target.value)}
                          min={0}
                          inputMode="numeric"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="product-tags">
                          태그
                        </label>
                        <input
                          id="product-tags"
                          type="text"
                          className="admin-inline-input admin-accordion-input"
                          value={productTags}
                          onChange={(e) => setProductTags(e.target.value)}
                          autoComplete="off"
                          placeholder="쉼표로 구분"
                        />
                      </div>
                    </div>
                  ) : idx === 2 ? (
                    <div className="admin-accordion-form-grid">
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="price-original">
                          원가
                        </label>
                        <input
                          id="price-original"
                          type="number"
                          className="admin-inline-input admin-accordion-input"
                          value={priceOriginal}
                          onChange={(e) => setPriceOriginal(e.target.value)}
                          min={0}
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="price-sale">
                          세일가
                        </label>
                        <input
                          id="price-sale"
                          type="number"
                          className="admin-inline-input admin-accordion-input"
                          value={priceSale}
                          onChange={(e) => setPriceSale(e.target.value)}
                          min={0}
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="price-direct">
                          다이렉트 가격
                        </label>
                        <input
                          id="price-direct"
                          type="number"
                          className="admin-inline-input admin-accordion-input"
                          value={priceDirect}
                          onChange={(e) => setPriceDirect(e.target.value)}
                          min={0}
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="price-weddingbook">
                          웨딩북 가격
                        </label>
                        <input
                          id="price-weddingbook"
                          type="number"
                          className="admin-inline-input admin-accordion-input"
                          value={priceWeddingbook}
                          onChange={(e) => setPriceWeddingbook(e.target.value)}
                          min={0}
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="price-wedding-goddess">
                          웨딩의여신 가격
                        </label>
                        <input
                          id="price-wedding-goddess"
                          type="number"
                          className="admin-inline-input admin-accordion-input"
                          value={priceWeddingGoddess}
                          onChange={(e) => setPriceWeddingGoddess(e.target.value)}
                          min={0}
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </div>
                      <div className="admin-accordion-field">
                        <label className="admin-accordion-field__label" htmlFor="price-holsu">
                          홀츄 가격
                        </label>
                        <input
                          id="price-holsu"
                          type="number"
                          className="admin-inline-input admin-accordion-input"
                          value={priceHolsu}
                          onChange={(e) => setPriceHolsu(e.target.value)}
                          min={0}
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ) : idx === 3 ? (
                    <div className="admin-accordion-form-grid admin-accordion-form-grid--2">
                      <div className="admin-accordion-field">
                        <span className="admin-accordion-field__label">썸네일 이미지</span>
                        <input
                          ref={thumbImageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (
                              file.type !== 'image/jpeg' &&
                              file.type !== 'image/png' &&
                              file.type !== 'image/webp'
                            ) {
                              window.alert('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.');
                              e.target.value = '';
                              return;
                            }
                            setThumbnailImagePreview(await readFileAsDataUrl(file));
                          }}
                        />
                        <div
                          className={[
                            'admin-accordion-upload-box',
                            isThumbImageDragging ? 'is-dragging' : '',
                            thumbnailImagePreview ? 'has-image' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          role="button"
                          tabIndex={0}
                          aria-label="썸네일 이미지 업로드"
                          onClick={() => thumbImageInputRef.current?.click()}
                          onKeyDown={(e) => {
                            if (e.key === ' ') e.preventDefault();
                            if (e.key === 'Enter' || e.key === ' ') thumbImageInputRef.current?.click();
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setIsThumbImageDragging(true);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsThumbImageDragging(true);
                          }}
                          onDragLeave={(e) => {
                            if (e.currentTarget === e.target) setIsThumbImageDragging(false);
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            setIsThumbImageDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (!file) return;
                            if (
                              file.type !== 'image/jpeg' &&
                              file.type !== 'image/png' &&
                              file.type !== 'image/webp'
                            ) {
                              window.alert('JPG, PNG, WebP 이미지만 업로드할 수 있습니다.');
                              return;
                            }
                            setThumbnailImagePreview(await readFileAsDataUrl(file));
                          }}
                        >
                          {thumbnailImagePreview ? (
                            <img
                              className="admin-accordion-upload-box__img"
                              src={thumbnailImagePreview}
                              alt="썸네일 미리보기"
                            />
                          ) : (
                            <div className="admin-accordion-upload-box__content">
                              <ImageIcon size={26} aria-hidden="true" />
                              <div className="admin-accordion-upload-box__text">클릭 또는 드래그로 업로드</div>
                              <div className="admin-accordion-upload-box__hint">JPG/PNG/WebP 추천</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="admin-accordion-field">
                        <span className="admin-accordion-field__label">썸네일 이미지(gif)</span>
                        <input
                          ref={thumbGifInputRef}
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
                            setThumbnailGifPreview(await readFileAsDataUrl(file));
                          }}
                        />
                        <div
                          className={[
                            'admin-accordion-upload-box',
                            isThumbGifDragging ? 'is-dragging' : '',
                            thumbnailGifPreview ? 'has-image' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          role="button"
                          tabIndex={0}
                          aria-label="썸네일 GIF 업로드"
                          onClick={() => thumbGifInputRef.current?.click()}
                          onKeyDown={(e) => {
                            if (e.key === ' ') e.preventDefault();
                            if (e.key === 'Enter' || e.key === ' ') thumbGifInputRef.current?.click();
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setIsThumbGifDragging(true);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsThumbGifDragging(true);
                          }}
                          onDragLeave={(e) => {
                            if (e.currentTarget === e.target) setIsThumbGifDragging(false);
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            setIsThumbGifDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (!file) return;
                            if (file.type !== 'image/gif') {
                              window.alert('GIF 파일만 업로드할 수 있습니다.');
                              return;
                            }
                            setThumbnailGifPreview(await readFileAsDataUrl(file));
                          }}
                        >
                          {thumbnailGifPreview ? (
                            <img
                              className="admin-accordion-upload-box__img"
                              src={thumbnailGifPreview}
                              alt="GIF 썸네일 미리보기"
                            />
                          ) : (
                            <div className="admin-accordion-upload-box__content">
                              <ImageIcon size={26} aria-hidden="true" />
                              <div className="admin-accordion-upload-box__text">클릭 또는 드래그로 업로드</div>
                              <div className="admin-accordion-upload-box__hint">GIF</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : idx === 4 ? (
                    <div className="admin-accordion-form-grid admin-accordion-form-grid--2">
                      <div className="admin-accordion-field admin-accordion-field--bgm-file">
                        <label className="admin-accordion-field__label" htmlFor="aepx-template-file">
                          AEPX 템플릿파일
                        </label>
                        <input
                          id="aepx-template-file"
                          type="file"
                          className="admin-accordion-file-input"
                          accept=".aepx"
                          onChange={(e) => setAepxTemplateFileName(e.target.files?.[0]?.name ?? '')}
                        />
                        {aepxTemplateFileName ? (
                          <span className="admin-accordion-file-name">{aepxTemplateFileName}</span>
                        ) : null}
                      </div>
                      <div className="admin-accordion-field admin-accordion-field--bgm-file">
                        <label className="admin-accordion-field__label" htmlFor="aepx-draft-template-file">
                          시안용 AEPX 템플릿 파일
                        </label>
                        <input
                          id="aepx-draft-template-file"
                          type="file"
                          className="admin-accordion-file-input"
                          accept=".aepx"
                          onChange={(e) => setAepxDraftTemplateFileName(e.target.files?.[0]?.name ?? '')}
                        />
                        {aepxDraftTemplateFileName ? (
                          <span className="admin-accordion-file-name">{aepxDraftTemplateFileName}</span>
                        ) : null}
                      </div>
                    </div>
                  ) : idx === 5 ? (
                    <div className="admin-accordion-bgm-block">
                      <div className="admin-accordion-check-group admin-accordion-check-group--no-top-margin">
                        <span className="admin-accordion-field__label">배경음악 변경여부</span>
                        <div className="admin-accordion-check-list" role="group" aria-label="배경음악 변경여부">
                          <label className="admin-accordion-check-item">
                            <input
                              type="checkbox"
                              checked={bgMusicChange === 'allowed'}
                              onChange={() =>
                                setBgMusicChange((prev) => (prev === 'allowed' ? null : 'allowed'))
                              }
                            />
                            <span>변경 가능</span>
                          </label>
                          <label className="admin-accordion-check-item">
                            <input
                              type="checkbox"
                              checked={bgMusicChange === 'forbidden'}
                              onChange={() =>
                                setBgMusicChange((prev) => (prev === 'forbidden' ? null : 'forbidden'))
                              }
                            />
                            <span>변경 불가</span>
                          </label>
                        </div>
                      </div>
                      <div className="admin-accordion-field admin-accordion-field--bgm-file">
                        <label className="admin-accordion-field__label" htmlFor="default-bgm-file">
                          기본배경음악
                        </label>
                        <input
                          id="default-bgm-file"
                          type="file"
                          className="admin-accordion-file-input"
                          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                          onChange={(e) => setDefaultBgmFileName(e.target.files?.[0]?.name ?? '')}
                        />
                        {defaultBgmFileName ? (
                          <span className="admin-accordion-file-name">{defaultBgmFileName}</span>
                        ) : null}
                      </div>
                    </div>
                  ) : idx === 6 ? (
                    <div className="admin-accordion-etc-block">
                      <div className="admin-accordion-form-grid admin-accordion-form-grid--2">
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="mix-product-opening">
                            믹스상품 오프닝세팅
                          </label>
                          <input
                            id="mix-product-opening"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={mixProductOpeningSetting}
                            onChange={(e) => setMixProductOpeningSetting(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="scene-length">
                            장면 길이
                          </label>
                          <input
                            id="scene-length"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={sceneLength}
                            onChange={(e) => setSceneLength(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                  ) : idx === 7 ? (
                    <div className="admin-accordion-scene-block">
                      <textarea
                        className="admin-inline-input admin-accordion-scene-textarea"
                        value={sceneSettingText}
                        onChange={(e) => setSceneSettingText(e.target.value)}
                        aria-label="장면 설정 내용"
                      />
                      <div className="admin-accordion-form-grid admin-accordion-form-grid--4">
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="scene-data-id">
                            data ID
                          </label>
                          <input
                            id="scene-data-id"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={sceneDataId}
                            onChange={(e) => setSceneDataId(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="scene-value">
                            value
                          </label>
                          <input
                            id="scene-value"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={sceneValue}
                            onChange={(e) => setSceneValue(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="scene-category">
                            category
                          </label>
                          <input
                            id="scene-category"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={sceneCategory}
                            onChange={(e) => setSceneCategory(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">type</span>
                          <ListSelect
                            ariaLabel="type"
                            value={sceneType}
                            onChange={setSceneType}
                            options={[
                              { value: '', label: '선택' },
                              { value: 'text', label: 'text' },
                              { value: 'image', label: 'image' },
                              { value: 'video', label: 'video' },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  ) : idx === 8 ? (
                    <div className="admin-accordion-scene-block">
                      <textarea
                        className="admin-inline-input admin-accordion-scene-textarea"
                        value={captionSettingText}
                        onChange={(e) => setCaptionSettingText(e.target.value)}
                        aria-label="자막 설정 내용"
                      />
                      <div className="admin-accordion-form-grid admin-accordion-form-grid--5">
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="caption-data-id">
                            Data ID
                          </label>
                          <input
                            id="caption-data-id"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={captionDataId}
                            onChange={(e) => setCaptionDataId(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">Type</span>
                          <ListSelect
                            ariaLabel="Type"
                            value={captionType}
                            onChange={setCaptionType}
                            options={[
                              { value: '', label: '선택' },
                              { value: 'editImage', label: '편집이미지' },
                              { value: 'sceneImage', label: '장면이미지' },
                            ]}
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="caption-value">
                            Value
                          </label>
                          <input
                            id="caption-value"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={captionValue}
                            onChange={(e) => setCaptionValue(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="caption-horizontal">
                            Horizontal
                          </label>
                          <input
                            id="caption-horizontal"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={captionHorizontal}
                            onChange={(e) => setCaptionHorizontal(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="caption-vertical">
                            Vertical
                          </label>
                          <input
                            id="caption-vertical"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={captionVertical}
                            onChange={(e) => setCaptionVertical(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                  ) : idx === 9 ? (
                    <div className="admin-accordion-scene-block">
                      <textarea
                        className="admin-inline-input admin-accordion-scene-textarea"
                        value={baseSettingText}
                        onChange={(e) => setBaseSettingText(e.target.value)}
                        aria-label="기본 설정 내용"
                      />
                      <div className="admin-accordion-form-grid">
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="base-setting-name">
                            Name
                          </label>
                          <input
                            id="base-setting-name"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={baseSettingName}
                            onChange={(e) => setBaseSettingName(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <label className="admin-accordion-field__label" htmlFor="base-setting-value">
                            Value
                          </label>
                          <input
                            id="base-setting-value"
                            type="text"
                            className="admin-inline-input admin-accordion-input"
                            value={baseSettingValue}
                            onChange={(e) => setBaseSettingValue(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <div className="admin-accordion-field">
                          <span className="admin-accordion-field__label">Type</span>
                          <ListSelect
                            ariaLabel="Type"
                            value={baseSettingType}
                            onChange={setBaseSettingType}
                            options={[
                              { value: '', label: '선택' },
                              { value: 'text', label: 'Text' },
                              { value: 'date', label: 'Date' },
                            ]}
                          />
                        </div>
                      </div>
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
          <RichTextEditor initialBody="" onCancel={() => window.history.back()} onSave={() => onSave()} showActions={false} />
        </Suspense>
      </section>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
        <button type="button" className="filter-btn filter-btn--outline" onClick={() => window.history.back()}>
          취소
        </button>
        <button type="button" className="filter-btn filter-btn--primary" onClick={() => onSave()}>
          저장
        </button>
      </div>
    </div>
  );
}
