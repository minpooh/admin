import { useEffect, useState } from 'react';
import Alert from '../../../components/Alert';
import Modal, { ModalInput } from '../../../components/Modal';

type TokenAdjustModalProps = {
  open: boolean;
  onClose: () => void;
  customerLabel?: string;
  currentBalance?: number;
  onGrant: (amount: number) => void;
  onRecover: (amount: number) => void;
};

function parseTokenAmount(raw: string) {
  const amount = Number.parseInt(raw, 10);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

export default function TokenAdjustModal({
  open,
  onClose,
  customerLabel,
  currentBalance,
  onGrant,
  onRecover,
}: TokenAdjustModalProps) {
  const [amount, setAmount] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setAmount('');
  }, [open]);

  const submit = (mode: 'grant' | 'recover') => {
    const parsed = parseTokenAmount(amount);
    if (parsed == null) {
      setAlertMessage('지급/회수할 토큰량을 입력해 주세요.');
      return;
    }

    if (mode === 'grant') {
      onGrant(parsed);
      setAlertMessage(`${parsed.toLocaleString('ko-KR')}토큰을 지급했습니다.`);
    } else {
      onRecover(parsed);
      setAlertMessage(`${parsed.toLocaleString('ko-KR')}토큰을 회수했습니다.`);
    }
    setAmount('');
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={onClose} ariaLabel="토큰지급/회수" variant="option">
        <Modal.Header>
          <Modal.Title>토큰지급/회수</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          {(customerLabel || currentBalance != null) && (
            <div className="option-modal__status-grid">
              {customerLabel ? (
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">대상</span>
                  <span className="option-modal__status-value">{customerLabel}</span>
                </div>
              ) : null}
              {currentBalance != null ? (
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">현재 보유 토큰</span>
                  <span className="option-modal__status-value text-warning">
                    {currentBalance.toLocaleString('ko-KR')}토큰
                  </span>
                </div>
              ) : null}
            </div>
          )}
          <div className="admin-modal-field-grid">
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="token-adjust-amount">
                토큰량
              </label>
              <ModalInput
                id="token-adjust-amount"
                type="number"
                min={1}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="지급/회수할 토큰량 입력"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => submit('grant')}>
            지급
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--danger" onClick={() => submit('recover')}>
            회수
          </button>
        </Modal.Footer>
      </Modal>
      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </>
  );
}

export function applyTokenAdjust(currentBalance: number, amount: number, mode: 'grant' | 'recover') {
  if (mode === 'grant') return currentBalance + amount;
  return Math.max(0, currentBalance - amount);
}
