import { pagePath } from '../../../routes';

export const socialReviewListPath = pagePath({
  navId: 'feelframe',
  sectionId: 'reviewManagement',
  itemId: 'socialReview',
});

export const socialReviewDetailPath = (id: string) =>
  pagePath({
    navId: 'feelframe',
    sectionId: 'reviewManagement',
    itemId: 'socialReview',
    subId: id,
  });
