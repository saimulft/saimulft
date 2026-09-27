export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function parseISODate(iso) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const date = parseISODate(iso);
  date.setUTCDate(date.getUTCDate() + n);
  return toISODate(date);
}

export function monthParts(key) {
  const [year, month] = key.split('-').map(Number);
  return { year, month, short: MONTHS[month - 1], long: MONTHS_LONG[month - 1] };
}

export function formatDate(iso) {
  const date = parseISODate(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatMonthYear(iso) {
  const { short, year } = monthParts(iso.slice(0, 7));
  return `${short} ${year}`;
}
