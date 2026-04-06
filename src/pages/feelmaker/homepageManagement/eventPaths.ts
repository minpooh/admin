import { pagePath } from '../../../routes';

export const eventListPath = pagePath({
  navId: 'feelmaker',
  sectionId: 'homepageManagement',
  itemId: 'eventList',
});

export const eventDetailPath = (id: string) =>
  pagePath({
    navId: 'feelmaker',
    sectionId: 'homepageManagement',
    itemId: 'eventList',
    subId: id,
  });

/** 신규 등록 화면 라우트 (`subId`) — 목록에 행을 만들기 전 편집 모드로 진입 */
export const EVENT_NEW_SUB_ID = 'new';

export const eventNewPath = () => eventDetailPath(EVENT_NEW_SUB_ID);
