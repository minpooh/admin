import { pagePath } from '../../../routes';

export const reviewListPath = pagePath({
  navId: 'feelframe',
  sectionId: 'reviewManagement',
  itemId: 'review',
});

export const reviewDetailPath = (id: string) =>
  pagePath({
    navId: 'feelframe',
    sectionId: 'reviewManagement',
    itemId: 'review',
    subId: id,
  });
