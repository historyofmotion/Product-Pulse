/**
 * Date and Week calculation utilities
 */

export function getISOWeekId(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const padWeek = weekNo.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-W${padWeek}`;
}

export function getWeekLabel(weekId: string): string {
  const parts = weekId.split('-W');
  if (parts.length === 2) {
    return `Week ${parseInt(parts[1], 10)}, ${parts[0]}`;
  }
  return weekId;
}

export function getWeekDateRange(weekId: string): string {
  const parts = weekId.split('-W');
  if (parts.length !== 2) return '';
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);

  // Get first Thursday of the year
  const firstThursday = new Date(year, 0, 4);
  const dayOfWeek = firstThursday.getDay() || 7;
  
  // Get Monday of week 1
  const week1Monday = new Date(firstThursday);
  week1Monday.setDate(firstThursday.getDate() - (dayOfWeek - 1));

  // Get Monday of target week
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (week - 1) * 7);

  // Sunday of target week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatShort = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatYear = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (monday.getFullYear() === sunday.getFullYear()) {
    return `${formatShort(monday)} - ${formatYear(sunday)}`;
  }
  return `${formatYear(monday)} - ${formatYear(sunday)}`;
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatSmartDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const currentISO = getISOWeekId(now);
  const itemISO = getISOWeekId(date);

  // Check if item is in the current week
  if (itemISO === currentISO) {
    return date.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Tuesday"
  }

  // Check if item is in last week
  const lastWeekDate = new Date(now);
  lastWeekDate.setDate(now.getDate() - 7);
  const lastWeekISO = getISOWeekId(lastWeekDate);

  if (itemISO === lastWeekISO) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `Last ${dayName}`; // e.g. "Last Tuesday"
  }

  // Otherwise, use calendar date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
