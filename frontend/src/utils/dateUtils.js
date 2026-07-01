/**
 * Gets a local date string in YYYY-MM-DD format.
 * This avoids the common bug where new Date().toISOString() returns "yesterday"
 * for users in positive timezone offsets during early morning.
 */
export const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formats a date stored in MongoDB (UTC) so it always shows the exact date
 * that was entered — no timezone shift.
 * e.g. "2026-06-01T00:00:00.000Z" → "01 Jun 2026"
 *
 * @param {string|Date} dateVal - the date value from DB
 * @param {object} opts - optional Intl.DateTimeFormat options
 */
export const formatDate = (dateVal, opts = { day: '2-digit', month: 'short', year: 'numeric' }) => {
    if (!dateVal) return '—';
    return new Date(dateVal).toLocaleDateString('en-PK', { ...opts, timeZone: 'UTC' });
};

/**
 * Same as formatDate but returns a short "01 Jun" format.
 */
export const formatDateShort = (dateVal) =>
    formatDate(dateVal, { day: '2-digit', month: 'short' });

/**
 * Gets a date object for "Yesterday" in local time.
 */
export const getYesterdayDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
};

/**
 * Gets a date object for X days ago in local time.
 */
export const getDaysAgoDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};
