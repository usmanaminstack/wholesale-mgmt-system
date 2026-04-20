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
