import { pagePath } from '../../../routes';

export const creatorListPath = pagePath({
  navId: 'feelmaker',
  sectionId: 'creatorManagement',
  itemId: 'creatorList',
});

export const creatorDetailPath = (id: string) =>
  pagePath({
    navId: 'feelmaker',
    sectionId: 'creatorManagement',
    itemId: 'creatorList',
    subId: id,
  });
