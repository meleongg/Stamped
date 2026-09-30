import { describe, expect, it } from "vitest";

import {
  describeShareLinkError,
  formatShareExpiryLabel,
  shareExpiryDaysRemaining,
} from "@/app/utils/share";

describe("share display helpers", () => {
  const fixedNow = new Date("2026-09-30T12:00:00.000Z");

  it("formats expiry with remaining days", () => {
    expect(
      formatShareExpiryLabel("2026-12-29T12:00:00.000Z", fixedNow),
    ).toMatch(/^Expires .+ · in 90 days$/);
  });

  it("uses tomorrow wording for a one-day window", () => {
    expect(
      formatShareExpiryLabel("2026-10-01T12:00:00.000Z", fixedNow),
    ).toMatch(/^Expires .+ · tomorrow$/);
  });

  it("reports zero days when already expired", () => {
    expect(shareExpiryDaysRemaining("2026-09-01T00:00:00.000Z", fixedNow)).toBe(
      0,
    );
  });

  it("maps share link error codes to distinct copy", () => {
    expect(describeShareLinkError("expired").title).toMatch(/expired/i);
    expect(describeShareLinkError("invalid_id").title).toMatch(/incomplete/i);
    expect(describeShareLinkError("not_found").title).toMatch(/broken/i);
    expect(describeShareLinkError(null).nextStep.length).toBeGreaterThan(0);
  });
});
