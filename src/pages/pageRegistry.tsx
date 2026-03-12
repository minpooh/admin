import type { ComponentType } from 'react';

/** 라우트 키: navId 또는 navId/sectionId/itemId 또는 navId/sectionId/itemId/subId */
export function getPageKey(
  navId: string | undefined,
  sectionId?: string,
  itemId?: string,
  subId?: string
): string {
  const parts = [navId, sectionId, itemId, subId].filter((p): p is string => !!p);
  return parts.join('/');
}

export type PageComponent = ComponentType;

/** 라우트 키 → 페이지 컴포넌트. 새 페이지 추가 시 여기에 등록 */
const registry: Record<string, PageComponent> = {};

export function registerPage(key: string, component: PageComponent) {
  registry[key] = component;
}

export function getPage(key: string): PageComponent | undefined {
  return registry[key];
}

// ——— 페이지 등록 ———
// 새 페이지 추가 방법:
// 1. pages/{navId}/{sectionId}/{ItemId}Page.tsx 파일 생성
// 2. 아래에 import 추가 후 registerPage('navId/sectionId/itemId', 컴포넌트) 호출


import FeelmakerDashboardPage from './feelmaker/DashboardPage.tsx';
registerPage('feelmaker', FeelmakerDashboardPage);

import FeelmakerOrderListPage from './feelmaker/orderManagement/OrderListPage';
registerPage('feelmaker/orderManagement/orderList', FeelmakerOrderListPage);

import FeelframeUploadFramePage from './feelframe/uploadManagement/UploadFramePage';
registerPage('feelframe/uploadManagement/uploadFrame', FeelframeUploadFramePage);
