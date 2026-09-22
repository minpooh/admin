import { pagePath } from '../../../routes';

export const workHistoryRetouchListPath = pagePath({
  navId: 'feelai',
  sectionId: 'workHistoryManagement',
  itemId: 'workHistoryRetouch',
});

export const workHistoryRetouchDetailPath = (id: string) =>
  pagePath({
    navId: 'feelai',
    sectionId: 'workHistoryManagement',
    itemId: 'workHistoryRetouch',
    subId: id,
  });
