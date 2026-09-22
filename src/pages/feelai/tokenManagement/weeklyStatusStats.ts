function getWeekStart(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 5) % 7));
  return start;
}

export function buildWeeklyStatusStats<T>(
  items: T[],
  getDate: (item: T) => Date,
  getStatus: (item: T) => string,
  seriesKeys: readonly string[],
  weekCount = 5
) {
  const latestWeekStart = getWeekStart(new Date());
  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const start = new Date(latestWeekStart);
    start.setDate(start.getDate() - (weekCount - 1 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const row: Record<string, number | string> = {
      label: `${start.getMonth() + 1}/${start.getDate()}`,
    };
    for (const key of seriesKeys) row[key] = 0;
    return { start, end, row };
  });

  for (const item of items) {
    const date = getDate(item);
    if (Number.isNaN(date.getTime())) continue;
    const week = weeks.find((entry) => date >= entry.start && date < entry.end);
    if (!week) continue;
    const status = getStatus(item);
    if (typeof week.row[status] !== 'number') continue;
    week.row[status] = Number(week.row[status]) + 1;
  }

  return weeks.map((entry) => entry.row);
}
