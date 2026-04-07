import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export type ModalInputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * 옵션 모달 등에서 쓰는 텍스트·날짜·시간 등 네이티브 `<input>`.
 * 스타일은 `.admin-modal-field-control` (목록 필터 `.date-range-wrap input`과 동일 톤).
 */
const ModalInput = forwardRef<HTMLInputElement, ModalInputProps>(function ModalInput(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={['admin-modal-field-control', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
});

export default ModalInput;
