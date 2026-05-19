import { pagePath } from '../../../routes';

export const questionListPath = pagePath({
  navId: 'feelframe',
  sectionId: 'questionManagement',
  itemId: 'question',
});

export const questionDetailPath = (id: string) =>
  pagePath({
    navId: 'feelframe',
    sectionId: 'questionManagement',
    itemId: 'question',
    subId: id,
  });
