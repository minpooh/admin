import { pagePath } from '../../../routes';

export const enterpriseListPath = pagePath({
  navId: 'feelmaker',
  sectionId: 'enterpriseManagement',
  itemId: 'enterpriseList',
});

export const enterpriseDetailPath = (id: string) =>
  pagePath({
    navId: 'feelmaker',
    sectionId: 'enterpriseManagement',
    itemId: 'enterpriseList',
    subId: id,
  });

/** 신규 기업 등록 화면용 서브 경로 */
export const ENTERPRISE_NEW_SUB_ID = 'new';

export const enterpriseNewPath = () => enterpriseDetailPath(ENTERPRISE_NEW_SUB_ID);
