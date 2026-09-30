import { daysBetween, describeExpiry, todayIsoDate } from "../expiry";

describe("expiry", () => {
  it("counts calendar days across month and DST boundaries", () => {
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
    expect(daysBetween("2026-10-01", "2026-09-30")).toBe(-1);
  });

  it.each([
    [null, { daysUntilExpiry: null, status: "no_expiry" }],
    ["2026-09-29", { daysUntilExpiry: -1, status: "expired" }],
    ["2026-09-30", { daysUntilExpiry: 0, status: "expiring_soon" }],
    ["2026-10-03", { daysUntilExpiry: 3, status: "expiring_soon" }],
    ["2026-10-04", { daysUntilExpiry: 4, status: "fresh" }],
  ])("describes %s", (expiry, expected) => {
    expect(describeExpiry(expiry, "2026-09-30", 3)).toEqual(expected);
  });

  it("formats today as a local YYYY-MM-DD date", () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});
