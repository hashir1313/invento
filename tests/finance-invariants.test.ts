import { describe, expect, test } from "bun:test";
import {
  calculateAvailableToWithdraw,
  calculateExpectedBusinessCash,
  calculatePartnerShares,
  getMonthDateRangePKT,
  getPKTYearMonth,
  isLedgerIdentityBalanced,
} from "@/lib/domain-math";
import { formatPKR } from "@/lib/utils";

describe("Finance ledger invariants", () => {
  test("master identity balances across capital, profit, loans, and withdrawals", () => {
    // Example: 40,000 capital + (-500) loss + 10,000 loan - 0 withdrawn = 49,500
    const expected = calculateExpectedBusinessCash({
      totalCapitalContributions: 40_000,
      allTimeNetProfit: -500,
      outstandingLoanDebt: 10_000,
      totalWithdrawals: 0,
    });
    expect(expected).toBe(49_500);
    expect(isLedgerIdentityBalanced(49_500, expected)).toBe(true);
    expect(isLedgerIdentityBalanced(49_499.98, expected)).toBe(false);
  });

  test("partner shares sum exactly to netProfit for odd and standard numbers", () => {
    expect(calculatePartnerShares(1, 65, 35)).toEqual({ badar: 1, hashir: 0 });

    for (const profit of [36_500, 37_000, 37_001, 99_999]) {
      const { badar, hashir } = calculatePartnerShares(profit, 65, 35);
      expect(badar + hashir).toBe(profit);
      expect(badar).toBeGreaterThan(0);
      expect(hashir).toBeGreaterThan(0);
    }

    const custom = calculatePartnerShares(10_001, 60, 40);
    expect(custom.badar + custom.hashir).toBe(10_001);
  });

  test("partner shares return zero during zero or loss periods", () => {
    expect(calculatePartnerShares(0, 65, 35)).toEqual({ badar: 0, hashir: 0 });
    expect(calculatePartnerShares(-500, 65, 35)).toEqual({ badar: 0, hashir: 0 });
  });

  test("withdrawal availability enforces both unclaimed profit and liquid business cash", () => {
    // Tight liquid cash caps withdrawal even if unclaimed profit is higher
    expect(calculateAvailableToWithdraw(12_775, 8_000)).toBe(8_000);
    // Unclaimed profit caps withdrawal when cash is plentiful
    expect(calculateAvailableToWithdraw(12_775, 50_000)).toBe(12_775);
    // Negative business cash or overdrawn profit blocks withdrawals
    expect(calculateAvailableToWithdraw(12_775, -1_000)).toBe(0);
    expect(calculateAvailableToWithdraw(-500, 20_000)).toBe(0);
  });
});

describe("PKT (UTC+5) period boundaries", () => {
  test("maps late-night UTC timestamps into the next PKT calendar month", () => {
    // 2026-03-31 19:00:00 UTC == 2026-04-01 00:00:00 PKT
    const boundary = new Date("2026-03-31T19:00:00.000Z");
    expect(getPKTYearMonth(boundary)).toEqual({ year: 2026, month: 4 });

    // One millisecond earlier is still March in PKT
    const justBeforeMidnightPKT = new Date("2026-03-31T18:59:59.999Z");
    expect(getPKTYearMonth(justBeforeMidnightPKT)).toEqual({ year: 2026, month: 3 });
  });

  test("computes inclusive PKT month bounds including December year rollover", () => {
    const dec = getMonthDateRangePKT(2026, 12);
    expect(dec.startDate.toISOString()).toBe("2026-11-30T19:00:00.000Z");
    expect(dec.endDate.toISOString()).toBe("2026-12-31T18:59:59.999Z");
  });
});

describe("Currency formatting", () => {
  test("formats positive, zero, and negative PKR values clearly", () => {
    expect(formatPKR(0)).toContain("0");
    expect(formatPKR(3500)).toContain("3,500");
    expect(formatPKR(-500).startsWith("-")).toBe(true);
    expect(formatPKR(-500)).toContain("500");
  });
});
