import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Confirm from '../../../components/Confirm';
import Modal, { ModalInput } from '../../../components/Modal';
import './CustomerDetailPage.css';
import { SNS_LABELS, type FeelframeCustomerRow } from './mock/customerList.mock';
import { MOCK_FEELFRAME_CUSTOMER_ORDERS } from './mock/customerOrders.mock';
import { MOCK_FEELFRAME_CUSTOMER_POINTS } from './mock/customerPoints.mock';
import {
  MOCK_FEELFRAME_CUSTOMER_COUPONS,
  type FeelframeCustomerCouponRow,
} from './mock/customerCoupons.mock';

type Props = {
  row: FeelframeCustomerRow | null;
  listPath: string;
};

export default function CustomerDetailPage({ row, listPath }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(row?.name ?? '');
  const [draftLoginId, setDraftLoginId] = useState(row?.loginId ?? '');
  const [draftPhone, setDraftPhone] = useState(row?.phone ?? '');
  const [draftEmail, setDraftEmail] = useState(row?.email ?? '');
  const [marketingAgreed, setMarketingAgreed] = useState(row?.marketingConsent === 'agree');
  const [couponCount, setCouponCount] = useState(row?.couponCount ?? 0);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [addCouponModalOpen, setAddCouponModalOpen] = useState(false);
  const [couponNoInput, setCouponNoInput] = useState('');
  const [couponStatusConfirmTargetId, setCouponStatusConfirmTargetId] = useState<string | null>(null);

  const customerOrders = useMemo(
    () => (row ? MOCK_FEELFRAME_CUSTOMER_ORDERS.filter((order) => order.customerId === row.id) : []),
    [row]
  );

  const customerPoints = useMemo(
    () => (row ? MOCK_FEELFRAME_CUSTOMER_POINTS.filter((point) => point.customerId === row.id) : []),
    [row]
  );

  const [customerCoupons, setCustomerCoupons] = useState<FeelframeCustomerCouponRow[]>(() =>
    row ? MOCK_FEELFRAME_CUSTOMER_COUPONS.filter((coupon) => coupon.customerId === row.id) : []
  );

  useEffect(() => {
    if (!row) return;
    setDraftName(row.name);
    setDraftLoginId(row.loginId);
    setDraftPhone(row.phone);
    setDraftEmail(row.email);
    setMarketingAgreed(row.marketingConsent === 'agree');
    setCouponCount(row.couponCount);
    setCustomerCoupons(MOCK_FEELFRAME_CUSTOMER_COUPONS.filter((coupon) => coupon.customerId === row.id));
  }, [row]);

  const confirmToggleCouponStatus = () => {
    if (!couponStatusConfirmTargetId) return;
    setCustomerCoupons((prev) =>
      prev.map((coupon) =>
        coupon.id === couponStatusConfirmTargetId
          ? { ...coupon, status: coupon.status === '사용전' ? '사용완료' : '사용전' }
          : coupon
      )
    );
    setCouponStatusConfirmTargetId(null);
  };

  if (!row) {
    return (
      <div className="admin-list-page">
        <div className="admin-detail-header">
          <Link to={listPath} className="admin-detail-back">
            ← 목록
          </Link>
          <h1 className="page-title">회원 상세</h1>
        </div>
        <section className="admin-list-box" aria-label="회원 상세">
          <p className="admin-list-result">회원 정보를 찾을 수 없습니다.</p>
        </section>
      </div>
    );
  }

  const startEditing = () => {
    setDraftName(row.name);
    setDraftLoginId(row.loginId);
    setDraftPhone(row.phone);
    setDraftEmail(row.email);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftName(row.name);
    setDraftLoginId(row.loginId);
    setDraftPhone(row.phone);
    setDraftEmail(row.email);
    setIsEditing(false);
  };

  const saveEditing = () => {
    window.alert('회원정보 저장(목업)');
    setIsEditing(false);
  };

  const handleWithdraw = () => {
    window.alert('회원 탈퇴 처리(목업)');
    setWithdrawConfirmOpen(false);
  };

  const openAddCouponModal = () => {
    setCouponNoInput('');
    setAddCouponModalOpen(true);
  };

  const closeAddCouponModal = () => {
    setAddCouponModalOpen(false);
    setCouponNoInput('');
  };

  const handleAddCoupon = () => {
    const value = couponNoInput.trim();
    if (!value) {
      window.alert('쿠폰번호를 입력해주세요.');
      return;
    }
    setCouponCount((prev) => prev + 1);
    window.alert(`쿠폰 등록 완료(목업): ${value}`);
    closeAddCouponModal();
  };

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={listPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">회원 상세</h1>
      </div>

      <div className="admin-detail-two-column">
        <section className="admin-list-box admin-box-w-half" aria-label="기본정보">
          <div className="customer-detail-section-head">
            <h3 className="admin-detail-section-title">기본정보</h3>
            <div className="customer-detail-section-head__actions">
              {isEditing ? (
                <>
                  <button type="button" className="filter-btn filter-btn--outline" onClick={cancelEditing}>
                    취소
                  </button>
                  <button type="button" className="filter-btn filter-btn--primary" onClick={saveEditing}>
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="filter-btn filter-btn--outline" onClick={startEditing}>
                    회원정보 수정
                  </button>
                  <button
                    type="button"
                    className="filter-btn customer-detail-btn--danger"
                    onClick={() => setWithdrawConfirmOpen(true)}
                  >
                    회원탈퇴
                  </button>
                </>
              )}
            </div>
          </div>

          <dl className="admin-detail-meta admin-detail-meta--aligned">
            <div className="admin-detail-meta__row">
              <dt>이름</dt>
              <dd>
                {isEditing ? (
                  <input
                    type="text"
                    className="admin-inline-input admin-detail-author-input"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    aria-label="이름 수정"
                  />
                ) : (
                  row.name
                )}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>아이디</dt>
              <dd>
                {isEditing ? (
                  <input
                    type="text"
                    className="admin-inline-input admin-detail-author-input"
                    value={draftLoginId}
                    onChange={(e) => setDraftLoginId(e.target.value)}
                    aria-label="아이디 수정"
                  />
                ) : (
                  row.loginId
                )}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>전화번호</dt>
              <dd>
                {isEditing ? (
                  <input
                    type="tel"
                    className="admin-inline-input admin-detail-author-input"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    aria-label="전화번호 수정"
                  />
                ) : (
                  row.phone
                )}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>이메일</dt>
              <dd>
                {isEditing ? (
                  <input
                    type="email"
                    className="admin-inline-input admin-detail-author-input"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    aria-label="이메일 수정"
                  />
                ) : (
                  row.email
                )}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>SNS</dt>
              <dd>{SNS_LABELS[row.sns]}</dd>
            </div>
          </dl>
        </section>

        <section className="admin-list-box admin-box-w-half" aria-label="추가정보">
          <h3 className="admin-detail-section-title">추가정보</h3>
          <dl className="admin-detail-meta admin-detail-meta--aligned">
            <div className="admin-detail-meta__row">
              <dt>마케팅동의</dt>
              <dd>
                <button
                  type="button"
                  className={`admin-toggle-switch ${marketingAgreed ? 'is-on' : ''}`}
                  role="switch"
                  aria-checked={marketingAgreed}
                  onClick={() => setMarketingAgreed((v) => !v)}
                >
                  <span className="admin-toggle-switch__track" aria-hidden>
                    <span className="admin-toggle-switch__thumb" />
                  </span>
                  <span className="admin-toggle-switch__text">{marketingAgreed ? '동의' : '미동의'}</span>
                </button>
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>포인트</dt>
              <dd>{row.points.toLocaleString()} P</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>주문건</dt>
              <dd>{row.orderCount.toLocaleString()}건</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>쿠폰</dt>
              <dd>
                <span className="customer-detail-meta-with-action">
                  <span>{couponCount.toLocaleString()}장</span>
                  <button type="button" className="row-btn row-btn--default" onClick={openAddCouponModal}>
                    쿠폰 추가
                  </button>
                </span>
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>가입일</dt>
              <dd>{row.joinDate}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="admin-list-box" aria-label="주문내역">
        <h3 className="admin-detail-section-title">주문내역</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문정보</th>
                <th>주문일</th>
                <th className="col-center">결제금액</th>
                <th className="col-center">주문수량</th>
                <th className="col-center">진행상황</th>
              </tr>
            </thead>
            <tbody>
              {customerOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty-cell">
                    주문 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                customerOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNo}</td>
                    <td>{order.productInfo}</td>
                    <td>{order.orderedAt}</td>
                    <td className="col-center">{order.amount.toLocaleString()}원</td>
                    <td className="col-center">{order.orderQuantity}</td>
                    <td className="col-center">{order.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-detail-two-column">
        <section className="admin-list-box admin-box-w-half" aria-label="포인트 적립내역">
          <h3 className="admin-detail-section-title">포인트 적립내역</h3>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--fluid">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>상세내용</th>
                  <th className="col-center">적립</th>
                  <th className="col-center">잔액</th>
                </tr>
              </thead>
              <tbody>
                {customerPoints.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-table-empty-cell">
                      포인트 적립내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  customerPoints.map((point) => (
                    <tr key={point.id}>
                      <td>{point.date}</td>
                      <td>{point.description}</td>
                      <td className={`col-center ${point.amount < 0 ? 'text-danger' : ''}`}>
                        {point.amount > 0 ? '+' : ''}
                        {point.amount.toLocaleString()} P
                      </td>
                      <td className="col-center text-color-blue">{point.balance.toLocaleString()} P</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-list-box admin-box-w-half" aria-label="쿠폰 내역">
          <h3 className="admin-detail-section-title">쿠폰 내역</h3>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--fluid">
              <thead>
                <tr>
                  <th>쿠폰이름</th>
                  <th className="col-center">만료일</th>
                  <th className="col-center">사용현황</th>
                  <th className="col-center">등록일</th>
                </tr>
              </thead>
              <tbody>
                {customerCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-table-empty-cell">
                      쿠폰 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  customerCoupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td>{coupon.couponName}</td>
                      <td className="col-center">{coupon.expiresAt}</td>
                      <td className="col-center">
                        <button
                          type="button"
                          className={`row-btn ${
                            coupon.status === '사용완료' ? 'row-btn--status-secondary' : 'row-btn--status-warning'
                          }`}
                          aria-pressed={coupon.status === '사용완료'}
                          onClick={() => setCouponStatusConfirmTargetId(coupon.id)}
                        >
                          {coupon.status}
                        </button>
                      </td>
                      <td className="col-center">{coupon.registeredAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Modal
        open={addCouponModalOpen}
        onClose={closeAddCouponModal}
        ariaLabel="쿠폰 추가"
        variant="option"
      >
        <Modal.Header>
          <Modal.Title>쿠폰 추가</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-field-grid">
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">회원</span>
              <span className="admin-modal-field-value">
                {row.name} ({row.loginId})
              </span>
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="customer-add-coupon-no">
                쿠폰번호
              </label>
              <ModalInput
                id="customer-add-coupon-no"
                type="text"
                value={couponNoInput}
                onChange={(e) => setCouponNoInput(e.target.value)}
                placeholder="쿠폰번호 입력"
                autoFocus
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeAddCouponModal}>
            닫기
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={handleAddCoupon}>
            등록
          </button>
        </Modal.Footer>
      </Modal>

      <Confirm
        open={couponStatusConfirmTargetId !== null}
        title="쿠폰 사용현황 변경"
        message="상태를 변경하시겠습니까?"
        confirmText="변경"
        cancelText="취소"
        onClose={() => setCouponStatusConfirmTargetId(null)}
        onConfirm={confirmToggleCouponStatus}
      />

      <Confirm
        open={withdrawConfirmOpen}
        title="회원 탈퇴"
        message={
          <>
            <strong>{row.name}</strong>({row.loginId}) 회원을 탈퇴 처리하시겠습니까?
          </>
        }
        confirmText="탈퇴"
        cancelText="취소"
        danger
        onClose={() => setWithdrawConfirmOpen(false)}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}
