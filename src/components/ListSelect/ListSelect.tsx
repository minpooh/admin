import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ListSelect.css';

export type ListSelectOption = { value: string; label: string };

type ListSelectProps = {
  value: string;
  onChange: (next: string) => void;
  options: ListSelectOption[];
  ariaLabel: string;
  className?: string;
  /** 목록 테이블 바로 위 등에서 아래로 펼치면 잘릴 때 사용 */
  menuPlacement?: 'below' | 'above';
};

/** 트리거 기준 메뉴 위치 (포털 + position: fixed) */
type MenuPosition = {
  left: number;
  width: number;
  /** 'below'면 top, 'above'면 bottom 사용 */
  placement: 'below' | 'above';
  top: number;
  bottom: number;
};

const MENU_GAP = 6;
/** ListSelect.css의 .listselect__menu max-height와 동일 */
const MENU_MAX_HEIGHT = 240;

export default function ListSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  menuPlacement = 'below',
}: ListSelectProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  /** 트리거 위치를 측정해 메뉴를 어디에 띄울지 계산 (뷰포트 공간 부족 시 자동 반전) */
  const updatePosition = useCallback(() => {
    const trigger = wrapRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: 'below' | 'above' = menuPlacement;
    if (placement === 'below' && spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow) {
      placement = 'above';
    } else if (placement === 'above' && spaceAbove < MENU_MAX_HEIGHT + MENU_GAP && spaceBelow > spaceAbove) {
      placement = 'below';
    }

    setPosition({
      left: rect.left,
      width: rect.width,
      placement,
      top: rect.bottom + MENU_GAP,
      bottom: window.innerHeight - rect.top + MENU_GAP,
    });
  }, [menuPlacement]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    /** 캡처 단계: 옵션 모달 패널의 `stopPropagation` 때문에 버블 단계 리스너는 document까지 도달하지 않음 */
    const handlePointerDownCapture = (e: MouseEvent | TouchEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDownCapture, true);
    document.addEventListener('touchstart', handlePointerDownCapture, true);
    document.addEventListener('keydown', handleKeyDown);
    /** 캡처 단계로 부모 스크롤 컨테이너(모달 본문 등) 스크롤까지 따라가도록 */
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownCapture, true);
      document.removeEventListener('touchstart', handlePointerDownCapture, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, updatePosition]);

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

      {open &&
        position &&
        createPortal(
          <ul
            ref={menuRef}
            className={`listselect__menu listselect__menu--portal ${
              position.placement === 'above' ? 'listselect__menu--above' : ''
            }`.trim()}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              left: position.left,
              width: position.width,
              ...(position.placement === 'above'
                ? { bottom: position.bottom, top: 'auto' }
                : { top: position.top, bottom: 'auto' }),
            }}
          >
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
          </ul>,
          document.body,
        )}
    </div>
  );
}
