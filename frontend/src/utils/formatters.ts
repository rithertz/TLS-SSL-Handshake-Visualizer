/**
 * Utility functions for formatting strings, dates, and fallback values cleanly.
 */

/**
 * Formats an ISO-8601 date string into a human-readable format.
 * Returns fallback if input is null, undefined, or invalid.
 */
export function formatDate(isoString: string | null | undefined, fallback = "Not available"): string {
  if (!isoString) return fallback;

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return fallback;
  }
}

/**
 * Calculates remaining days until expiration from ISO-8601 date string.
 */
export function getDaysUntilExpiration(untilIsoString: string | null | undefined): number | null {
  if (!untilIsoString) return null;

  try {
    const expiry = new Date(untilIsoString);
    if (isNaN(expiry.getTime())) return null;

    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/**
 * Returns string or fallback if value is null/undefined/empty string.
 */
export function formatValue(val: string | number | boolean | null | undefined, fallback = "Not available"): string {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val);
}
