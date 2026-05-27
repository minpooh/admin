import { pagePath } from '../../../routes';

export const personalPaymentListPath = pagePath({
  navId: 'feelframe',
  sectionId: 'productManagement',
  itemId: 'personalPayment',
});

export const personalPaymentDetailPath = (id: string) =>
  pagePath({
    navId: 'feelframe',
    sectionId: 'productManagement',
    itemId: 'personalPayment',
    subId: id,
  });

const FEELFRAME_SITE_ORIGIN = 'https://feelframe.co.kr';

/** 고객 사이트 개인결제 URL (목록 복사용) */
export function personalPaymentPublicUrl(id: string): string {
  return `${FEELFRAME_SITE_ORIGIN}/personal-payment/${encodeURIComponent(id)}`;
}
