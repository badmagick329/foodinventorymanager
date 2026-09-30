const DAY_MS = 24 * 60 * 60 * 1000;

export type ExpiryStatus = "expired" | "expiring_soon" | "fresh" | "no_expiry";

/** Today's calendar date on the server, as stored in `Food.expiry`. */
export function todayIsoDate(now = new Date()) {
  return now.toLocaleDateString("en-CA");
}

/**
 * Expiry dates are plain `YYYY-MM-DD` strings, so the difference is computed
 * on calendar dates in UTC to stay independent of the server's time zone.
 */
export function daysBetween(fromIsoDate: string, toIsoDate: string) {
  return Math.round(
    (Date.parse(`${toIsoDate}T00:00:00Z`) -
      Date.parse(`${fromIsoDate}T00:00:00Z`)) /
      DAY_MS
  );
}

export function describeExpiry(
  expiry: string | null,
  today: string,
  soonWithinDays: number
): { daysUntilExpiry: number | null; status: ExpiryStatus } {
  if (expiry === null) return { daysUntilExpiry: null, status: "no_expiry" };
  const daysUntilExpiry = daysBetween(today, expiry);
  const status =
    daysUntilExpiry < 0
      ? "expired"
      : daysUntilExpiry <= soonWithinDays
        ? "expiring_soon"
        : "fresh";
  return { daysUntilExpiry, status };
}
