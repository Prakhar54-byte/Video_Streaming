/**
 * Formats a date string into a "time ago" format, Twitter-style.
 * - 'just now'
 * - '5m'
 * - '3h'
 * - '1d'
 * - 'Nov 3' (if in the same year)
 * - 'Nov 3, 2024' (if in a different year)
 */
/**
 * Formats a date string into a "time ago" format, Twitter-style.
 */
export const formatTimeAgo = (dateString: string | null | undefined): string | null => {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  // Check for an invalid date
  if (isNaN(date.getTime())) {
    console.error("Invalid date string passed to formatTimeAgo:", dateString);
    return null; // Return null to hide the timestamp
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates (e.g., client/server time mismatch)
  if (diffInSeconds < 0) {
    return "just now";
  }

  // 1. Less than a minute
  if (diffInSeconds < 60) {
    return diffInSeconds <= 1 ? "just now" : `${diffInSeconds}s`;
  }

  // 2. Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  // 3. Less than 24 hours
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  // 4. Less than 7 days
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  // 5. More than 7 days: Show the date
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  
  if (now.getFullYear() !== date.getFullYear()) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString('en-US', options);
};