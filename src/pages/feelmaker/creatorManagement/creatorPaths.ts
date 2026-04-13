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

export const creatorTemplatePath = pagePath({
  navId: 'feelmaker',
  sectionId: 'creatorManagement',
  itemId: 'creatorTemplate',
});

export const creatorTemplateDetailPath = (id: string) =>
  pagePath({
    navId: 'feelmaker',
    sectionId: 'creatorManagement',
    itemId: 'creatorTemplate',
    subId: id,
  });

export const creatorBoardPath = pagePath({
  navId: 'feelmaker',
  sectionId: 'creatorManagement',
  itemId: 'creatorBoard',
});

export const creatorBoardEditPath = (id: string) =>
  pagePath({
    navId: 'feelmaker',
    sectionId: 'creatorManagement',
    itemId: 'creatorBoard',
    subId: id,
  });

/** 신규 게시글 작성 화면용 서브 경로 */
export const BOARD_NEW_SUB_ID = 'new';

export const creatorBoardNewPath = () => creatorBoardEditPath(BOARD_NEW_SUB_ID);
