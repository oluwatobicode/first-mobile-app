// Dates are stored as 'YYYY-MM-DD' keys so they are easy to compare and keep in state.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function toKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fromKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return toKey(new Date());
}

export function addDays(key: string, days: number) {
  const date = fromKey(key);
  date.setDate(date.getDate() + days);
  return toKey(date);
}

export function nightsBetween(start: string, end: string) {
  return Math.round((fromKey(end).getTime() - fromKey(start).getTime()) / 86_400_000);
}

/** "Tue, Aug 1" */
export function formatDay(key: string) {
  const date = fromKey(key);
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "Aug 1, 2026" */
export function formatLong(key: string) {
  const date = fromKey(key);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "Aug 1 – 2" or "Aug 30 – Sep 2" (single date when end is missing). */
export function formatRange(start: string, end: string | null) {
  const a = fromKey(start);
  const startLabel = `${MONTHS[a.getMonth()]} ${a.getDate()}`;
  if (!end || end === start) return startLabel;
  const b = fromKey(end);
  return a.getMonth() === b.getMonth()
    ? `${startLabel} – ${b.getDate()}`
    : `${startLabel} – ${MONTHS[b.getMonth()]} ${b.getDate()}`;
}

export function monthTitle(year: number, month: number) {
  return `${FULL_MONTHS[month]} ${year}`;
}

/** Day cells for a month grid, with `null` padding before the 1st. */
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= days; d++) cells.push(toKey(new Date(year, month, d)));
  return cells;
}

export function upcomingMonths(count: number) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });
}

/** Fake but stable availability: roughly 1 in 5 nights is already booked for each listing. */
export function isBooked(listingId: string, key: string) {
  let hash = 0;
  for (const char of listingId + key) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % 5 === 0;
}
