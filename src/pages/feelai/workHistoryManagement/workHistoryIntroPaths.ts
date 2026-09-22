import { pagePath } from '../../../routes';

export const workHistoryIntroListPath = pagePath({
  navId: 'feelai',
  sectionId: 'workHistoryManagement',
  itemId: 'workHistoryIntro',
});

export const workHistoryIntroDetailPath = (id: string) =>
  pagePath({
    navId: 'feelai',
    sectionId: 'workHistoryManagement',
    itemId: 'workHistoryIntro',
    subId: id,
  });
