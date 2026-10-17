/**
 * Presence and Last Seen formatting utility for MessMee
 * Provides human-friendly WhatsApp / Telegram style activity status
 */

/**
 * Formats a lastSeen ISO timestamp into a human-readable relative time string.
 * Example outputs:
 * - "Active now"
 * - "Active just now"
 * - "Active 5m ago"
 * - "Active 2h ago"
 * - "Active yesterday at 10:30 PM"
 * - "Active on Mon at 4:15 PM"
 * - "Active on Oct 14"
 * - "Offline"
 */
export function formatLastSeen(lastSeen?: string | number | null, isOnline?: boolean): string {
  if (isOnline) {
    return 'Active now';
  }

  if (!lastSeen) {
    return 'Offline';
  }

  const date = typeof lastSeen === 'number' ? new Date(lastSeen) : new Date(lastSeen);
  if (isNaN(date.getTime())) {
    return 'Offline';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // If timestamp is slightly in future due to clock skew, treat as just now
  if (diffMs < 60000) {
    return 'Active just now';
  }

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `Active ${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24 && isSameDay(now, date)) {
    return `Active ${diffHours}h ago`;
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(yesterday, date)) {
    return `Active yesterday at ${formatTime(date)}`;
  }

  // Check if within 6 days
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    return `Active on ${dayName} at ${formatTime(date)}`;
  }

  // Older than a week
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `Active on ${monthDay}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
