import { useEffect, useRef, useState } from 'react';
import './ListSelect.css';

export type ListSelectOption = { value: string; label: string };

type ListSelectProps = {
  value: string;
  onChange: (next: string) => void;
  options: ListSelectOption[];
  ariaLabel: string;
  className?: string;
};

export default function ListSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: ListSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  useEffect(() => {
    if (!open) return;

    /** 캡처 단계: 옵션 모달 패널의 `stopPropagation` 때문에 버블 단계 리스너는 document까지 도달하지 않음 */
    const handlePointerDownCapture = (e: MouseEvent | TouchEvent) => {
      const target = e.target;
      if (!(target instanceof Node) || !wrapRef.current || wrapRef.current.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDownCapture, true);
    document.addEventListener('touchstart', handlePointerDownCapture, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownCapture, true);
      document.removeEventListener('touchstart', handlePointerDownCapture, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`listselect ${className ?? ''}`.trim()}>
      <button
        type="button"
        className={`listselect__trigger ${open ? 'is-open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="listselect__value">{selectedLabel}</span>
        <svg
          className="listselect__chevron"
          aria-hidden="true"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="none"
        >
          <path
            d="M4.5 6.75L8 10.25L11.5 6.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="listselect__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                className={`listselect__item ${isSelected ? 'is-selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
