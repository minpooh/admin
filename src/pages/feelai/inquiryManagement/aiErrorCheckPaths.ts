import { pagePath } from '../../../routes';

export const aiErrorCheckListPath = pagePath({
  navId: 'feelai',
  sectionId: 'inquiryManagement',
  itemId: 'aiErrorCheck',
});

export const aiErrorCheckDetailPath = (id: string) =>
  pagePath({
    navId: 'feelai',
    sectionId: 'inquiryManagement',
    itemId: 'aiErrorCheck',
    subId: id,
  });
