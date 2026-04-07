import { useEffect, useState } from 'react';
import './Toast.css';

type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

type ToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  variant?: ToastVariant;
  autoCloseMs?: number;
  closeButtonAriaLabel?: string;
};

const VARIANT_ICON: Record<ToastVariant, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  danger: '!',
};

export default function Toast({
  open,
  message,
  onClose,
  variant = 'info',
  autoCloseMs = 2200,
  closeButtonAriaLabel = '토스트 닫기',
}: ToastProps) {
  const [isRendered, setIsRendered] = useState(open);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setIsRendered(true);
        setIsLeaving(false);
      });
      return;
    }
    if (!isRendered) return;
    queueMicrotask(() => {
      setIsLeaving(true);
    });
    const leaveId = window.setTimeout(() => {
      setIsRendered(false);
      setIsLeaving(false);
    }, 240);
    return () => window.clearTimeout(leaveId);
  }, [open, isRendered]);

  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => onClose(), autoCloseMs);
    return () => window.clearTimeout(timeoutId);
  }, [open, onClose, autoCloseMs]);

  if (!isRendered) return null;

  return (
    <div
      className={['app-toast', `app-toast--${variant}`, isLeaving ? 'is-leaving' : 'is-entering'].join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className="app-toast__icon" aria-hidden="true">
        {VARIANT_ICON[variant]}
      </span>
      <span className="app-toast__text">{message}</span>
      <button
        type="button"
        className="app-toast__close"
        onClick={onClose}
        aria-label={closeButtonAriaLabel}
      >
        ×
      </button>
    </div>
  );
}
