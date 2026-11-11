/**
 * Pure domain math, timezone, and invariant helpers shared by server actions and unit tests.
 * Keep this module free of Prisma, Next.js runtime, or environment-specific imports.
 */

export const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Returns the current (or provided Date's) year and 1-based month in PKT (UTC+5). */
export function getPKTYearMonth(now: Date = new Date()): { year: number; month: number } {
  const pktTime = new Date(now.getTime() + PKT_OFFSET_MS);
  return {
    year: pktTime.getUTCFullYear(),
    month: pktTime.getUTCMonth() + 1,
  };
}

/** Returns UTC Date bounds [startDate, endDate] covering the full calendar month in PKT (UTC+5). */
export function getMonthDateRangePKT(
  year: number,
  month: number
): { startDate: Date; endDate: Date } {
  const startDate = new Date(Date.UTC(year, month - 1, 1, -5, 0, 0, 0));
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endDate = new Date(Date.UTC(nextMonthYear, nextMonth - 1, 1, -5, 0, 0, -1));
  return { startDate, endDate };
}

/**
 * Splits positive net profit between Badar and Hashir so `badar + hashir === netProfit` exactly.
 * Returns `{ badar: 0, hashir: 0 }` when `netProfit <= 0`.
 */
export function calculatePartnerShares(
  netProfit: number,
  badarSharePct: number = 65,
  hashirSharePct: number = 35
): { badar: number; hashir: number } {
  if (netProfit <= 0) {
    return { badar: 0, hashir: 0 };
  }
  const totalShares = badarSharePct + hashirSharePct || 100;
  const hashir = Math.round(netProfit * (hashirSharePct / totalShares));
  const badar = netProfit - hashir;
  return { badar, hashir };
}

/** Computes max withdrawable amount bounded by both unclaimed profit and liquid business cash. */
export function calculateAvailableToWithdraw(
  unclaimedProfit: number,
  businessCash: number
): number {
  const availableLiquid = Math.max(0, businessCash);
  return Math.max(0, Math.min(unclaimedProfit, availableLiquid));
}

/** Master identity for the double-entry ledger: Business Cash = Capital + Profit + Debt - Withdrawals. */
export function calculateExpectedBusinessCash(params: {
  totalCapitalContributions: number;
  allTimeNetProfit: number;
  outstandingLoanDebt: number;
  totalWithdrawals: number;
}): number {
  return (
    params.totalCapitalContributions +
    params.allTimeNetProfit +
    params.outstandingLoanDebt -
    params.totalWithdrawals
  );
}

/** Checks whether derived ledger cash matches the master identity within floating/decimal epsilon. */
export function isLedgerIdentityBalanced(
  actualBusinessCash: number,
  expectedBusinessCash: number,
  epsilon: number = 0.01
): boolean {
  return Math.abs(actualBusinessCash - expectedBusinessCash) < epsilon;
}

/** Calculates total ml, oil/ethanol amounts, and bottle count for Batch Production V2. */
export function calculateBatchV2Plan(params: {
  productionMode: "bottle" | "mass";
  quantity: number;
  bottleSizeMl: number;
  concentrationPct: number;
}): {
  totalMl: number;
  bottlesProduced: number;
  oilNeeded: number;
  ethanolNeeded: number;
} {
  const qty = Number(params.quantity);
  const bottleSizeMl = Number(params.bottleSizeMl);
  const concentration = Number(params.concentrationPct) / 100;

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Production quantity must be greater than zero.");
  }
  if (!Number.isFinite(bottleSizeMl) || bottleSizeMl <= 0) {
    throw new Error("Product bottle volume must be greater than zero.");
  }
  if (!Number.isFinite(concentration) || concentration < 0 || concentration > 1) {
    throw new Error("Concentration percentage must be between 0 and 100.");
  }

  let totalMl: number;
  let bottlesProduced: number;

  if (params.productionMode === "bottle") {
    totalMl = qty * bottleSizeMl;
    bottlesProduced = qty;
  } else {
    totalMl = qty;
    bottlesProduced = Math.floor(qty / bottleSizeMl);
  }

  const oilNeeded = totalMl * concentration;
  const ethanolNeeded = totalMl - oilNeeded;

  return { totalMl, bottlesProduced, oilNeeded, ethanolNeeded };
}

/** Consolidates multi-item sale quantities per product and validates available stock. */
export function validateSaleStockRequirements(
  items: { product_id: string; quantity: number }[],
  productById: Map<string, { name: string; stock: number }>
): Record<string, number> {
  const productQuantities: Record<string, number> = {};
  for (const item of items) {
    if (!item.product_id) {
      throw new Error("A perfume item is missing product selection.");
    }
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    productQuantities[item.product_id] = (productQuantities[item.product_id] || 0) + qty;
  }

  for (const [pid, neededQty] of Object.entries(productQuantities)) {
    const prod = productById.get(pid);
    if (!prod) {
      throw new Error("One or more selected products not found.");
    }
    if (prod.stock < neededQty) {
      throw new Error(
        `Insufficient stock for "${prod.name}"! Available: ${prod.stock} bottle(s), Requested: ${neededQty}`
      );
    }
  }

  return productQuantities;
}
