import { pagePath } from '../../../routes';

export const companyQuestionListPath = pagePath({
  navId: 'feelframe',
  sectionId: 'questionManagement',
  itemId: 'companyQuestion',
});

export const companyQuestionDetailPath = (id: string) =>
  pagePath({
    navId: 'feelframe',
    sectionId: 'questionManagement',
    itemId: 'companyQuestion',
    subId: id,
  });
