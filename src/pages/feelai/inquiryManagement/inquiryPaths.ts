import { pagePath } from '../../../routes';

export const inquiryListPath = pagePath({
  navId: 'feelai',
  sectionId: 'inquiryManagement',
  itemId: 'inquiry',
});

export const inquiryDetailPath = (id: string) =>
  pagePath({
    navId: 'feelai',
    sectionId: 'inquiryManagement',
    itemId: 'inquiry',
    subId: id,
  });
