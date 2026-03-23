import { useEffect } from 'react';
import type { ReactNode } from 'react';
import './confirm.css';

type ConfirmProps = {
  open: boolean;
  title?: string;
  message: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

export default function Confirm({
  open,
  title = '확인',
  message,
  onClose,
  onConfirm,
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
}: ConfirmProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="confirm-dialog__overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onClose}>
      <div className="confirm-dialog__panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__title">{title}</div>
        <div className="confirm-dialog__message">{message}</div>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__btn confirm-dialog__btn--ghost" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-dialog__btn ${danger ? 'confirm-dialog__btn--danger' : 'confirm-dialog__btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
