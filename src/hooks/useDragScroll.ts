import { useEffect } from 'react';

const DRAGGABLE_SELECTOR = '.admin-table-wrap';
const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, label, [role="button"]';

export default function useDragScroll(): void {
  useEffect(() => {
    let activeWrap: HTMLElement | null = null;
    let startX = 0;
    let startScrollLeft = 0;
    let isPointerDown = false;
    let isDragging = false;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(INTERACTIVE_SELECTOR)) return;

      const wrap = target.closest(DRAGGABLE_SELECTOR) as HTMLElement | null;
      if (!wrap) return;

      isPointerDown = true;
      isDragging = false;
      activeWrap = wrap;
      startX = event.clientX;
      startScrollLeft = wrap.scrollLeft;
      wrap.classList.add('is-drag-scroll-ready');
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isPointerDown || !activeWrap) return;

      const deltaX = event.clientX - startX;
      if (!isDragging && Math.abs(deltaX) < 4) return;

      isDragging = true;
      activeWrap.classList.add('is-drag-scrolling');
      activeWrap.scrollLeft = startScrollLeft - deltaX;
      event.preventDefault();
    };

    const endPointer = () => {
      if (!activeWrap) {
        isPointerDown = false;
        isDragging = false;
        return;
      }

      activeWrap.classList.remove('is-drag-scroll-ready', 'is-drag-scrolling');
      activeWrap = null;
      isPointerDown = false;
      isDragging = false;
    };

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', endPointer);
    document.addEventListener('pointercancel', endPointer);
    document.addEventListener('mouseleave', endPointer);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', endPointer);
      document.removeEventListener('pointercancel', endPointer);
      document.removeEventListener('mouseleave', endPointer);
    };
  }, []);
}
