import { useEffect } from 'react';
import './alert.css';

type AlertProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
};

export default function Alert({ open, message, onClose, duration = 2200 }: AlertProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => onClose(), duration);
    return () => window.clearTimeout(timer);
  }, [open, onClose, duration]);

  if (!open) return null;

  return (
    <div className="app-alert" role="alert" aria-live="assertive">
      <span className="app-alert__message">{message}</span>
      <button type="button" className="app-alert__close" onClick={onClose} aria-label="알림 닫기">
        ×
      </button>
    </div>
  );
}
