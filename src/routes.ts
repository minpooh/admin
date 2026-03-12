export type NavId = 'feelmaker' | 'feelframe' | 'feelmotion' | 'admins';

export type DashboardParams = {
  navId: NavId;
  sectionId?: string;
  itemId?: string;
  subId?: string;
};

export function dashboardPath(params: {
  navId: NavId;
  sectionId?: string;
  itemId?: string;
  subId?: string;
}): string {
  const parts: string[] = [params.navId];
  if (params.sectionId) parts.push(params.sectionId);
  if (params.itemId) parts.push(params.itemId);
  if (params.subId) parts.push(encodeURIComponent(params.subId));
  return '/' + parts.join('/');
}

export function parseDashboardPath(pathname: string): DashboardParams {
  const normalized = pathname.replace(/^\//, '').replace(/\/$/, '');
  const parts = normalized ? normalized.split('/') : [];
  const [navId, sectionId, itemId, subId] = parts;
  return {
    navId: (navId as NavId) || 'feelmaker',
    sectionId: sectionId || undefined,
    itemId: itemId || undefined,
    subId: subId ? decodeURIComponent(subId) : undefined,
  };
}

export function isItemActive(
  current: DashboardParams,
  navId: NavId,
  sectionId: string,
  itemId: string,
  subLabel?: string
): boolean {
  if (current.navId !== navId || current.sectionId !== sectionId || current.itemId !== itemId) {
    return false;
  }
  if (subLabel !== undefined) {
    return current.subId === subLabel;
  }
  return !current.subId;
}
