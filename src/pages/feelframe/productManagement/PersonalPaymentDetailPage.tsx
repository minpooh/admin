import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import SwitchField from '../../../components/SwitchField';
import '../../../styles/adminPage.css';
import '../../../styles/adminArrordion.css';
import {
  formatPersonalPaymentCategory,
  type FeelframePersonalPaymentRow,
} from './mock/personalPayment.mock';
import { personalPaymentListPath } from './personalPaymentPaths';

type Props = {
  row: FeelframePersonalPaymentRow;
  onSave: (nextRow: FeelframePersonalPaymentRow) => void;
};

const ACCORDION_TITLES = ['제조사 설정', '카테고리 설정', '상품 정보', '상세설정'] as const;

const CATEGORY_OPTIONS = ['이벤트액자', '아크릴액자', '우드액자', '원판액자', '포토테이블', '디자인액자', '해당없음'];

const SUB_CATEGORY_MAP: Record<string, string[]> = {
  이벤트액자: ['생일', '기념일', '시즌한정'],
  아크릴액자: ['투명', '컬러', '미니'],
  우드액자: ['내추럴', '월넛', '화이트오크'],
  원판액자: ['LP원형', '대형원판', '미니원판'],
  포토테이블: ['3구 세트', '5구 세트', '스탠딩'],
  디자인액자: ['모던', '빈티지', '프리미엄'],
  해당없음: ['해당없음'],
};

export default function PersonalPaymentDetailPage({ row, onSave }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [manufacturer, setManufacturer] = useState(row.manufacturer);
  const [manufacturerUnitPrice, setManufacturerUnitPrice] = useState(row.manufacturerUnitPrice);
  const [photoUploadEnabled, setPhotoUploadEnabled] = useState(row.photoUploadEnabled);
  const [categoryMain, setCategoryMain] = useState(row.categoryMain);
  const [categorySub, setCategorySub] = useState(row.categorySub);
  const [productName, setProductName] = useState(row.name);
  const [productPrice, setProductPrice] = useState(String(row.paymentAmount));
  const [deliveryEnabled, setDeliveryEnabled] = useState(row.deliveryEnabled);

  const subCategoryOptions = SUB_CATEGORY_MAP[categoryMain] ?? ['해당없음'];

  const handleSave = () => {
    const nextPaymentAmount = Number(productPrice.replace(/[^0-9.-]/g, ''));
    const nextRow: FeelframePersonalPaymentRow = {
      ...row,
      manufacturer,
      manufacturerUnitPrice,
      photoUploadEnabled,
      categoryMain,
      categorySub,
      category: formatPersonalPaymentCategory(categoryMain, categorySub),
      name: productName,
      paymentAmount: Number.isFinite(nextPaymentAmount) ? nextPaymentAmount : row.paymentAmount,
      deliveryEnabled,
      deliveryLabel: deliveryEnabled ? '배송' : '미배송',
    };
    onSave(nextRow);
  };

  const accordionPanels = useMemo(
    () => [
      (
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
      ),
      (
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
              options={CATEGORY_OPTIONS.map((item) => ({ value: item, label: item }))}
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
      ),
      (
        <div className="admin-accordion-form-grid admin-accordion-form-grid--2">
          <div className="admin-accordion-field admin-accordion-field--full">
            <label className="admin-accordion-field__label" htmlFor="pp-product-name">
              상품명
            </label>
            <input
              id="pp-product-name"
              type="text"
              className="admin-inline-input admin-accordion-input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="admin-accordion-field">
            <label className="admin-accordion-field__label" htmlFor="pp-product-price">
              상품가격
            </label>
            <input
              id="pp-product-price"
              type="text"
              className="admin-inline-input admin-accordion-input"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>
      ),
      (
        <div className="admin-accordion-check-row">
          <SwitchField
            label="사진업로드 여부"
            checked={photoUploadEnabled}
            onChange={setPhotoUploadEnabled}
            checkedText="해당"
            uncheckedText="미해당"
          />
          <SwitchField
            label="배송여부"
            checked={deliveryEnabled}
            onChange={setDeliveryEnabled}
            checkedText="배송"
            uncheckedText="미배송"
          />
        </div>
      ),
    ],
    [
      manufacturer,
      manufacturerUnitPrice,
      photoUploadEnabled,
      categoryMain,
      categorySub,
      subCategoryOptions,
      productName,
      productPrice,
      deliveryEnabled,
    ],
  );

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={personalPaymentListPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">개인결제 상세 · 수정</h1>
      </div>

      {ACCORDION_TITLES.map((title, idx) => {
        const isOpen = openIndex === idx;
        return (
          <section
            key={title}
            className={`admin-list-box admin-accordion admin-accordion--unclipped${isOpen ? ' is-open' : ''}`}
          >
            <button
              type="button"
              className="admin-accordion__trigger"
              onClick={() => setOpenIndex((prev) => (prev === idx ? null : idx))}
              aria-expanded={isOpen}
            >
              <span>{title}</span>
              <span className={`admin-accordion__chevron ${isOpen ? 'is-open' : ''}`} aria-hidden>
                <ChevronDown size={18} strokeWidth={1.8} />
              </span>
            </button>
            <div className={`admin-accordion__panel ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
              <div className="admin-accordion__inner">
                <div className="admin-accordion__body">{accordionPanels[idx]}</div>
              </div>
            </div>
          </section>
        );
      })}

      <div className="admin-detail-actions">
        <Link to={personalPaymentListPath} className="filter-btn filter-btn--outline">
          취소
        </Link>
        <button type="button" className="filter-btn filter-btn--primary" onClick={handleSave}>
          저장
        </button>
      </div>
    </div>
  );
}
