import { useEffect, useRef, useState, type FocusEvent } from 'react';
import DatePicker, { type DatePickerProps } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

type ModalDatePickerProps = {
  /** 부모 모달이 열려 있을 때만 바깥 클릭 감시 */
  modalOpen: boolean;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  /** 루트 `.admin-modal-datepicker`에 추가 (페이지별 너비 등) */
  className?: string;
  /** `.admin-modal-datepicker__pickers`에 추가 */
  pickersClassName?: string;
  /** 입력 필드에 추가 클래스 (기본은 `admin-modal-field-control`) */
  inputClassName?: string;
} & Omit<
  DatePickerProps,
  | 'selected'
  | 'onChange'
  | 'open'
  | 'onCalendarOpen'
  | 'onCalendarClose'
  | 'onFocus'
  | 'onInputClick'
  | 'onBlur'
  | 'className'
  | 'selectsRange'
  | 'selectsMultiple'
  | 'startDate'
  | 'endDate'
>;

/**
 * 옵션 모달(`Modal` variant option) 안에서 사용하는 DatePicker.
 * 패널의 `stopPropagation` 때문에 react-datepicker 기본 outside-close가 동작하지 않아
 * 캡처 단계 리스너 + 제어 `open`으로 동일 UX를 맞춥니다.
 */
export default function ModalDatePicker({
  modalOpen,
  selected,
  onChange,
  className,
  pickersClassName,
  inputClassName,
  locale = ko,
  shouldCloseOnSelect = true,
  showMonthDropdown = true,
  showYearDropdown = true,
  dropdownMode = 'scroll',
  ...rest
}: ModalDatePickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modalOpen) setPickerOpen(false);
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen || !pickerOpen) return;
    const handlePointerDownCapture = (e: MouseEvent | TouchEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (wrapRef.current?.contains(target)) return;
      setPickerOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDownCapture, true);
    document.addEventListener('touchstart', handlePointerDownCapture, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDownCapture, true);
      document.removeEventListener('touchstart', handlePointerDownCapture, true);
    };
  }, [modalOpen, pickerOpen]);

  const mergedPickerProps = {
    ...rest,
    open: pickerOpen,
    onCalendarOpen: () => setPickerOpen(true),
    onCalendarClose: () => setPickerOpen(false),
    onFocus: () => setPickerOpen(true),
    onInputClick: () => setPickerOpen(true),
    onBlur: (e: FocusEvent<HTMLElement>) => {
      const rt = e.relatedTarget;
      if (rt instanceof Node && wrapRef.current?.contains(rt)) return;
      requestAnimationFrame(() => {
        const wrap = wrapRef.current;
        if (!wrap?.contains(document.activeElement)) setPickerOpen(false);
      });
    },
    selected,
    onChange: (date: Date | null) => {
      onChange(date);
      setPickerOpen(false);
    },
    locale,
    className: ['admin-modal-field-control', inputClassName].filter(Boolean).join(' ') || undefined,
    shouldCloseOnSelect,
    showMonthDropdown,
    showYearDropdown,
    dropdownMode,
  } as unknown as DatePickerProps;

  return (
    <div className={['admin-modal-datepicker', className].filter(Boolean).join(' ')}>
      <div
        ref={wrapRef}
        className={['admin-modal-datepicker__pickers', pickersClassName].filter(Boolean).join(' ')}
      >
        <DatePicker {...mergedPickerProps} />
      </div>
    </div>
  );
}
