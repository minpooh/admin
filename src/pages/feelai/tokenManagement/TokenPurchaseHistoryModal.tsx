import Modal from '../../../components/Modal';
import {
  getPurchaseStatusClassName,
  type TokenPurchaseHistoryItem,
  type TokenPurchaseProfile,
  type TokenPurchaseSummary,
} from './tokenPurchaseHistory';

type TokenPurchaseHistoryModalProps = {
  onClose: () => void;
  profile: TokenPurchaseProfile;
  items: TokenPurchaseHistoryItem[];
  summary: TokenPurchaseSummary;
};

function formatAmount(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatToken(value: number) {
  return `${value.toLocaleString('ko-KR')} tk`;
}

export default function TokenPurchaseHistoryModal({ onClose, profile, items, summary }: TokenPurchaseHistoryModalProps) {
  return (
    <Modal open onClose={onClose} ariaLabel="누적구매 현황" variant="option" panelClassName="option-modal__panel--wide token-purchase-history-modal">
      <Modal.Header>
        <Modal.Title>누적구매 현황</Modal.Title>
        <Modal.Close />
      </Modal.Header>
      <Modal.Body>
        <p className="option-modal__hint">
          AI 인트로 토큰 · 필메이커 결제 + 스마트스토어 충전 합산 · 전체 기간
        </p>

        <div className="option-modal__status-grid">
          <div className="option-modal__status-row">
            <span className="option-modal__status-label">{profile.kind === 'store' ? '구매자정보' : '고객정보'}</span>
            <span className="option-modal__status-value">
              {profile.kind === 'store' ? `${profile.name} (${profile.userId})` : `${profile.name} (${profile.userId}) / ${profile.phone}`}
            </span>
          </div>
          <div className="option-modal__status-row">
            <span className="option-modal__status-label">현재 보유 토큰</span>
            <span className="option-modal__status-value text-warning">
              {profile.tokenBalance.toLocaleString('ko-KR')}토큰
            </span>
          </div>
        </div>

        <div className="admin-stat-cards admin-stat-cards--token-purchase">
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">누적구매 (합산)</p>
            <p className="admin-stat-value">
              {summary.totalCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">회</span>
            </p>
            <p className="admin-stat-hint">
              <span className="list-label">필메</span> {summary.makerCount}회
            </p>
            <p className="admin-stat-hint">
              <span className="list-label">스팜</span> {summary.storeCount}회
            </p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">총 결제금액</p>
            <p className="admin-stat-value">
              {summary.totalAmount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">원</span>
            </p>
            <p className="admin-stat-hint">
              <span className="list-label">필메</span> {formatAmount(summary.makerAmount)}
            </p>
            <p className="admin-stat-hint">
              <span className="list-label">스팜</span> {formatAmount(summary.storeAmount)}
            </p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">총 지급토큰</p>
            <p className="admin-stat-value">
              {summary.totalTokens.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">tk</span>
            </p>
            <p className="admin-stat-hint">
              <span className="list-label">필메</span> {formatToken(summary.makerTokens)}
            </p>
            <p className="admin-stat-hint">
              <span className="list-label">스팜</span> {formatToken(summary.storeTokens)}
            </p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">횟수 제외건</p>
            <p className="admin-stat-value">
              {summary.excludedCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
            <p className="admin-stat-hint">취소·실패·결제전·미충전</p>
          </div>
        </div>

        <p className="option-modal__hint">
          전체 주문내역 (두 채널 통합 · 취소·실패·미충전 포함 {items.length}건)
        </p>
        <div className="admin-modal-table-wrap">
          <table className="admin-modal-table token-purchase-history-table">
            <thead>
              <tr>
                <th>채널</th>
                <th>주문번호</th>
                <th>주문일</th>
                <th>결제·충전일</th>
                <th>상품 / 옵션</th>
                <th>토큰</th>
                <th>결제금액</th>
                <th>결제수단</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.channel}-${item.orderNo}-${item.orderedAt}`}>
                  <td>
                    <span
                      className={[
                        'badge-square',
                        'badge-square--inline',
                        'badge-square--no-transition',
                        'badge-square--no-margin',
                        item.channel === '필메' ? 'badge-square--primary' : 'badge-square--secondary',
                      ].join(' ')}
                    >
                      {item.channel}
                    </span>
                  </td>
                  <td>
                    <span className="cell-line">{item.orderNo}</span>
                  </td>
                  <td>
                    <span className="cell-line">{item.orderedAt}</span>
                  </td>
                  <td>
                    <span className="cell-line">{item.settledAt}</span>
                  </td>
                  <td>
                    <span className="cell-line">{item.productOption}</span>
                  </td>
                  <td>
                    <span className="text-warning">{item.tokenAmount.toLocaleString('ko-KR')}</span>
                  </td>
                  <td>{formatAmount(item.amount)}</td>
                  <td>
                    <span className="cell-line">{item.paymentMethod}</span>
                  </td>
                  <td>
                    <span className={getPurchaseStatusClassName(item.status)}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={onClose}>
          닫기
        </button>
      </Modal.Footer>
    </Modal>
  );
}
