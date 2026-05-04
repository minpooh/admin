/** Max page number buttons shown; additional pages are reached via prev/next arrows. */
export const PAGINATION_PAGE_BUTTON_COUNT = 5;

/**
 * Returns up to `maxButtons` consecutive page numbers centered around `currentPage`
 * (sliding-window behavior aligned with list pagination across the admin app).
 */
export function getVisiblePageNumbers(
  totalPages: number,
  currentPage: number,
  maxButtons: number = PAGINATION_PAGE_BUTTON_COUNT,
): number[] {
  const pages = Math.max(1, Math.floor(totalPages));
  if (pages <= maxButtons) {
    return Array.from({ length: pages }, (_, i) => i + 1);
  }
  const half = Math.floor(maxButtons / 2);
  const start = Math.max(1, Math.min(currentPage - half, pages - maxButtons + 1));
  return Array.from({ length: maxButtons }, (_, i) => start + i);
}

/** « / » 한 번에 건너뛸 페이지 수 (표시되는 페이지 버튼 수와 동일). */
export const PAGINATION_JUMP_PAGES = PAGINATION_PAGE_BUTTON_COUNT;

export function jumpPageBack(currentPage: number, jump: number = PAGINATION_JUMP_PAGES): number {
  return Math.max(1, currentPage - jump);
}

export function jumpPageForward(
  currentPage: number,
  totalPages: number,
  jump: number = PAGINATION_JUMP_PAGES,
): number {
  const pages = Math.max(1, Math.floor(totalPages));
  return Math.min(pages, currentPage + jump);
}
