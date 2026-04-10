import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../../styles/adminPage.css';
import { enterpriseListPath } from './enterprisePaths';
import type { EnterpriseListItem } from './mock/enterpriseList.mock';

type BizType = 'individual' | 'corporate';

type EnterpriseDetailPageProps = {
  row: EnterpriseListItem;
  isCreate?: boolean;
  onCreate?: (item: EnterpriseListItem) => void;
  onUpdate?: (item: EnterpriseListItem) => void;
};

export default function EnterpriseDetailPage({
  row,
  isCreate = false,
  onCreate,
  onUpdate,
}: EnterpriseDetailPageProps) {
  const [bizType, setBizType] = useState<BizType>('corporate');
  const [businessNumber, setBusinessNumber] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [tradeName, setTradeName] = useState(() => row.companyName);
  const [loginId, setLoginId] = useState(() => row.loginId);
  const [password, setPassword] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessItem, setBusinessItem] = useState('');
  const [address, setAddress] = useState('');
  const [pricePreDinner, setPricePreDinner] = useState('');
  const [priceVideo, setPriceVideo] = useState('');
  const [priceGrowth, setPriceGrowth] = useState('');
  const [priceThanks, setPriceThanks] = useState('');
  const [priceInvite, setPriceInvite] = useState('');
  const [pricePhoto, setPricePhoto] = useState('');

  const onBizIndividualChange = (checked: boolean) => {
    if (checked) setBizType('individual');
    else setBizType('corporate');
  };

  const onBizCorporateChange = (checked: boolean) => {
    if (checked) setBizType('corporate');
    else setBizType('individual');
  };

  const handleCreate = () => {
    if (!onCreate) return;
    const idTrim = loginId.trim();
    const nameTrim = tradeName.trim();
    if (!idTrim || !nameTrim) {
      window.alert('아이디와 상호(법인명)를 입력해주세요.');
      return;
    }
    onCreate({
      id: `ent-${crypto.randomUUID()}`,
      loginId: idTrim,
      companyName: nameTrim,
    });
  };

  const handleUpdate = () => {
    if (!onUpdate) return;
    const idTrim = loginId.trim();
    const nameTrim = tradeName.trim();
    if (!idTrim || !nameTrim) {
      window.alert('아이디와 상호(법인명)를 입력해주세요.');
      return;
    }
    onUpdate({
      ...row,
      loginId: idTrim,
      companyName: nameTrim,
    });
  };

  const titleHeading = isCreate ? '기업 등록' : '기업 상세';
  const displayCompanyTitle = tradeName.trim() || (isCreate ? '신규 기업' : row.companyName);

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={enterpriseListPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{titleHeading}</h1>
      </div>

      <div className="admin-box-w-half">
        <section className="admin-list-box">
          <p className="admin-detail-id">{isCreate ? '신규 등록' : row.id}</p>
          <h2 className="admin-detail-title">{displayCompanyTitle}</h2>

          <dl className="admin-detail-meta admin-detail-meta--aligned">
          <div className="admin-detail-meta__row">
            <dt>사업자구분</dt>
            <dd>
              <div className="admin-accordion-check-list" role="group" aria-label="사업자구분">
                <label className="admin-accordion-check-item">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={bizType === 'individual'}
                    onChange={(e) => onBizIndividualChange(e.target.checked)}
                    aria-checked={bizType === 'individual'}
                  />
                  개인
                </label>
                <label className="admin-accordion-check-item">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={bizType === 'corporate'}
                    onChange={(e) => onBizCorporateChange(e.target.checked)}
                    aria-checked={bizType === 'corporate'}
                  />
                  법인
                </label>
              </div>
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>사업자번호</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                placeholder="사업자번호"
                aria-label="사업자번호"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>대표자명</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={ceoName}
                onChange={(e) => setCeoName(e.target.value)}
                placeholder="대표자명"
                aria-label="대표자명"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>상호(법인명)</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="상호(법인명)"
                aria-label="상호(법인명)"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>아이디</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="아이디"
                aria-label="아이디"
                autoComplete="username"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>비밀번호</dt>
            <dd>
              <input
                type="password"
                className="admin-inline-input admin-detail-author-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                aria-label="비밀번호"
                autoComplete="new-password"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>업태</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                placeholder="업태"
                aria-label="업태"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>종목</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={businessItem}
                onChange={(e) => setBusinessItem(e.target.value)}
                placeholder="종목"
                aria-label="종목"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>주소</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소"
                aria-label="주소"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>식전가격</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={pricePreDinner}
                onChange={(e) => setPricePreDinner(e.target.value)}
                placeholder="식전가격"
                aria-label="식전가격"
                inputMode="numeric"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>영상가격</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={priceVideo}
                onChange={(e) => setPriceVideo(e.target.value)}
                placeholder="영상가격"
                aria-label="영상가격"
                inputMode="numeric"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>성장가격</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={priceGrowth}
                onChange={(e) => setPriceGrowth(e.target.value)}
                placeholder="성장가격"
                aria-label="성장가격"
                inputMode="numeric"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>감사가격</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={priceThanks}
                onChange={(e) => setPriceThanks(e.target.value)}
                placeholder="감사가격"
                aria-label="감사가격"
                inputMode="numeric"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>초대가격</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={priceInvite}
                onChange={(e) => setPriceInvite(e.target.value)}
                placeholder="초대가격"
                aria-label="초대가격"
                inputMode="numeric"
              />
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>사진가격</dt>
            <dd>
              <input
                type="text"
                className="admin-inline-input admin-detail-author-input"
                value={pricePhoto}
                onChange={(e) => setPricePhoto(e.target.value)}
                placeholder="사진가격"
                aria-label="사진가격"
                inputMode="numeric"
              />
            </dd>
          </div>
        </dl>
        </section>

        {isCreate && onCreate ? (
          <div className="admin-list-add-row admin-list-add-row--align-start">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleCreate}>
              생성
            </button>
          </div>
        ) : !isCreate && onUpdate ? (
          <div className="admin-list-add-row admin-list-add-row--align-start">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleUpdate}>
              수정
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
