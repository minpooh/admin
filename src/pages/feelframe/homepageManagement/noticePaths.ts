import { pagePath } from '../../../routes';

export const noticeListPath = pagePath({
  navId: 'feelframe',
  sectionId: 'homepageManagement',
  itemId: 'noticeList',
});

export const noticeDetailPath = (id: string) =>
  pagePath({
    navId: 'feelframe',
    sectionId: 'homepageManagement',
    itemId: 'noticeList',
    subId: id,
  });

export const NOTICE_NEW_SUB_ID = 'new';

export const noticeNewPath = () => noticeDetailPath(NOTICE_NEW_SUB_ID);
