"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Partner, AccountType, TxnType, ExpenseCategory, Prisma } from "@prisma/client";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore when running outside Next.js request context (e.g. tests, scripts)
  }
}

// ==========================================
// DATE & TIMEZONE HELPERS (PKT = UTC+5)
// ==========================================

export async function getCurrentPKTYearMonth() {
  const now = new Date();
  const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return {
    year: pktTime.getUTCFullYear(),
    month: pktTime.getUTCMonth() + 1,
  };
}

function getMonthDateRangePKT(year: number, month: number) {
  // PKT is UTC+5.
  // Start of month in PKT: year-month-01 00:00:00 PKT -> UTC: year-(month-1)-1 00:00 - 5 hours
  const startDate = new Date(Date.UTC(year, month - 1, 1, -5, 0, 0, 0));
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endDate = new Date(Date.UTC(nextMonthYear, nextMonth - 1, 1, -5, 0, 0, -1));
  return { startDate, endDate };
}

// ==========================================
// ACCOUNT INITIALIZATION & GETTERS
// ==========================================

export async function getOrCreateDefaultAccounts(tx: any = prisma) {
  let business = await tx.account.findFirst({
    where: { type: AccountType.BUSINESS, partner: null },
  });
  if (!business) {
    business = await tx.account.create({
      data: {
        name: "Business Account",
        type: AccountType.BUSINESS,
        partner: null,
        share_percentage: 0,
      },
    });
  }

  let badar = await tx.account.findFirst({
    where: { type: AccountType.PARTNER, partner: Partner.BADAR },
  });
  if (!badar) {
    badar = await tx.account.create({
      data: {
        name: "Badar's Account",
        type: AccountType.PARTNER,
        partner: Partner.BADAR,
        share_percentage: 65,
      },
    });
  }

  let hashir = await tx.account.findFirst({
    where: { type: AccountType.PARTNER, partner: Partner.HASHIR },
  });
  if (!hashir) {
    hashir = await tx.account.create({
      data: {
        name: "Hashir's Account",
        type: AccountType.PARTNER,
        partner: Partner.HASHIR,
        share_percentage: 35,
      },
    });
  }

  return { business, badar, hashir };
}

// ==========================================
// USER ACTIONS
// ==========================================

export async function recordCapitalContribution(data: {
  partner: Partner;
  amount: number;
  notes?: string;
  date?: string;
}) {
  try {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Amount must be a positive number" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const { business } = await getOrCreateDefaultAccounts(tx);
      const occurred_at = data.date ? new Date(data.date) : new Date();

      return await tx.txnEntry.create({
        data: {
          type: TxnType.CAPITAL_CONTRIBUTION,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          from_id: null,
          to_id: business.id,
          partner: data.partner,
          notes: data.notes || null,
          occurred_at,
        },
      });
    });

    safeRevalidate("/finances");
    safeRevalidate("/");
    return { success: true, txn: { ...result, amount: Number(result.amount) } };
  } catch (error: any) {
    console.error("Error recording capital contribution:", error);
    return { success: false, error: error?.message || "Failed to record contribution" };
  }
}

export async function recordExpense(data: {
  amount: number;
  category: ExpenseCategory;
  notes?: string;
  date?: string;
  paid_personally_by?: Partner;
}) {
  try {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Amount must be a positive number" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const { business } = await getOrCreateDefaultAccounts(tx);
      const occurred_at = data.date ? new Date(data.date) : new Date();

      // If paid personally by a partner (Option A: Capital Contribution + Expense)
      if (data.paid_personally_by) {
        await tx.txnEntry.create({
          data: {
            type: TxnType.CAPITAL_CONTRIBUTION,
            amount: new Prisma.Decimal(amount.toFixed(2)),
            from_id: null,
            to_id: business.id,
            partner: data.paid_personally_by,
            notes: `[Advance for Personal Expense: ${data.category}] ${data.notes || ""}`.trim(),
            occurred_at,
          },
        });
      }

      // Expense row from BUSINESS to outside
      return await tx.txnEntry.create({
        data: {
          type: TxnType.EXPENSE,
          category: data.category,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          from_id: business.id,
          to_id: null,
          partner: data.paid_personally_by || null,
          notes: data.notes || null,
          occurred_at,
        },
      });
    });

    safeRevalidate("/finances");
    safeRevalidate("/");
    return { success: true, txn: { ...result, amount: Number(result.amount) } };
  } catch (error: any) {
    console.error("Error recording expense:", error);
    return { success: false, error: error?.message || "Failed to record expense" };
  }
}

export async function recordProfitWithdrawal(data: {
  partner: Partner;
  amount: number;
  notes?: string;
  date?: string;
}) {
  try {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const { business, badar, hashir } = await getOrCreateDefaultAccounts(tx);
      const partnerAccount = data.partner === Partner.BADAR ? badar : hashir;

      // 1. Calculate All-time Net Profit
      const [revSum, refSum, expSum] = await Promise.all([
        tx.txnEntry.aggregate({ where: { type: TxnType.REVENUE }, _sum: { amount: true } }),
        tx.txnEntry.aggregate({ where: { type: TxnType.REFUND }, _sum: { amount: true } }),
        tx.txnEntry.aggregate({ where: { type: TxnType.EXPENSE }, _sum: { amount: true } }),
      ]);

      const allTimeRevenue = Number(revSum._sum.amount || 0) - Number(refSum._sum.amount || 0);
      const allTimeExpense = Number(expSum._sum.amount || 0);
      const allTimeNetProfit = allTimeRevenue - allTimeExpense;

      if (allTimeNetProfit <= 0) {
        throw new Error(
          `Cannot withdraw profit. All-time net profit is zero or negative (PKR ${allTimeNetProfit.toLocaleString()}).`
        );
      }

      // 2. Calculate Partner's Total Earned Profit
      const totalPartnerShares = (badar.share_percentage || 65) + (hashir.share_percentage || 35);
      const partnerRatio = (partnerAccount.share_percentage || 0) / (totalPartnerShares || 100);

      // Hashir derived directly, Badar derived as remainder for exact sum if 2 partners
      let partnerEarned = 0;
      if (data.partner === Partner.HASHIR) {
        partnerEarned = Math.round(allTimeNetProfit * partnerRatio);
      } else {
        const hashirEarned = Math.round(allTimeNetProfit * ((hashir.share_percentage || 35) / (totalPartnerShares || 100)));
        partnerEarned = allTimeNetProfit - hashirEarned;
      }

      // 3. Calculate Prior Withdrawals
      const priorWithdrawnSum = await tx.txnEntry.aggregate({
        where: { type: TxnType.PROFIT_WITHDRAWAL, partner: data.partner },
        _sum: { amount: true },
      });
      const priorWithdrawn = Number(priorWithdrawnSum._sum.amount || 0);
      const unclaimedProfit = partnerEarned - priorWithdrawn;

      if (amount > unclaimedProfit) {
        throw new Error(
          `Withdrawal amount (PKR ${amount.toLocaleString()}) exceeds your unclaimed profit share (PKR ${unclaimedProfit.toLocaleString()}).`
        );
      }

      // 4. Calculate Business Liquid Cash Balance
      const [inflowSum, outflowSum] = await Promise.all([
        tx.txnEntry.aggregate({ where: { to_id: business.id }, _sum: { amount: true } }),
        tx.txnEntry.aggregate({ where: { from_id: business.id }, _sum: { amount: true } }),
      ]);
      const businessCash = Number(inflowSum._sum.amount || 0) - Number(outflowSum._sum.amount || 0);

      if (amount > businessCash) {
        throw new Error(
          `Withdrawal amount (PKR ${amount.toLocaleString()}) exceeds available liquid business cash (PKR ${Math.max(0, businessCash).toLocaleString()}). Remaining profit is currently tied up in stock.`
        );
      }

      // 5. Post Withdrawal Row
      const occurred_at = data.date ? new Date(data.date) : new Date();
      return await tx.txnEntry.create({
        data: {
          type: TxnType.PROFIT_WITHDRAWAL,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          from_id: business.id,
          to_id: partnerAccount.id,
          partner: data.partner,
          notes: data.notes || null,
          occurred_at,
        },
      });
    });

    safeRevalidate("/finances");
    safeRevalidate("/");
    return { success: true, txn: { ...result, amount: Number(result.amount) } };
  } catch (error: any) {
    console.error("Error recording profit withdrawal:", error);
    return { success: false, error: error?.message || "Failed to withdraw profit" };
  }
}

export async function updatePartnerShares(shares: { partner: Partner; percentage: number }[]) {
  try {
    const total = shares.reduce((acc, s) => acc + Number(s.percentage), 0);
    if (Math.abs(total - 100) > 0.001) {
      return { success: false, error: `Shares must sum to 100%. Current sum: ${total}%` };
    }

    await prisma.$transaction(async (tx) => {
      const { badar, hashir } = await getOrCreateDefaultAccounts(tx);
      for (const item of shares) {
        const accId = item.partner === Partner.BADAR ? badar.id : hashir.id;
        await tx.account.update({
          where: { id: accId },
          data: { share_percentage: Number(item.percentage) },
        });
      }
    });

    safeRevalidate("/finances");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating partner shares:", error);
    return { success: false, error: error?.message || "Failed to update partner shares" };
  }
}

// ==========================================
// METRICS & REPORTING
// ==========================================

export async function getBankMetrics(params?: { year?: number; month?: number; isAllTime?: boolean }) {
  try {
    const { business, badar, hashir } = await getOrCreateDefaultAccounts();

    const isAllTime = Boolean(params?.isAllTime);
    const currentPKT = await getCurrentPKTYearMonth();
    const selectedYear = params?.year || currentPKT.year;
    const selectedMonth = params?.month || currentPKT.month;

    const { startDate, endDate } = getMonthDateRangePKT(selectedYear, selectedMonth);

    // Build date filter for period (bypassed if isAllTime is true)
    const periodDateFilter = isAllTime ? {} : { occurred_at: { gte: startDate, lte: endDate } };

    // 1. Period Aggregates
    const [periodRevSum, periodRefSum, periodExpSum] = await Promise.all([
      prisma.txnEntry.aggregate({
        where: { type: TxnType.REVENUE, ...periodDateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.txnEntry.aggregate({
        where: { type: TxnType.REFUND, ...periodDateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.txnEntry.aggregate({
        where: { type: TxnType.EXPENSE, ...periodDateFilter },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const periodRevenueGross = Number(periodRevSum._sum.amount || 0);
    const periodRefunds = Number(periodRefSum._sum.amount || 0);
    const periodRevenue = periodRevenueGross - periodRefunds;
    const periodExpenses = Number(periodExpSum._sum.amount || 0);
    const periodNetProfit = periodRevenue - periodExpenses;

    // Expenses breakdown by category for the period
    const expenseRows = await prisma.txnEntry.groupBy({
      by: ["category"],
      where: { type: TxnType.EXPENSE, ...periodDateFilter },
      _sum: { amount: true },
    });

    const expensesByCategory: Record<string, number> = {};
    for (const r of expenseRows) {
      if (r.category) {
        expensesByCategory[r.category] = Number(r._sum.amount || 0);
      }
    }

    // 2. All-Time Aggregates
    const [allRevSum, allRefSum, allExpSum, allCapSum, allWithSum] = await Promise.all([
      prisma.txnEntry.aggregate({ where: { type: TxnType.REVENUE }, _sum: { amount: true } }),
      prisma.txnEntry.aggregate({ where: { type: TxnType.REFUND }, _sum: { amount: true } }),
      prisma.txnEntry.aggregate({ where: { type: TxnType.EXPENSE }, _sum: { amount: true } }),
      prisma.txnEntry.aggregate({ where: { type: TxnType.CAPITAL_CONTRIBUTION }, _sum: { amount: true } }),
      prisma.txnEntry.aggregate({ where: { type: TxnType.PROFIT_WITHDRAWAL }, _sum: { amount: true } }),
    ]);

    const allTimeRevenue = Number(allRevSum._sum.amount || 0) - Number(allRefSum._sum.amount || 0);
    const allTimeExpenses = Number(allExpSum._sum.amount || 0);
    const allTimeNetProfit = allTimeRevenue - allTimeExpenses;
    const totalCapitalContributions = Number(allCapSum._sum.amount || 0);
    const totalWithdrawals = Number(allWithSum._sum.amount || 0);

    // 3. Business Liquid Cash Balance
    const [bizInflows, bizOutflows] = await Promise.all([
      prisma.txnEntry.aggregate({ where: { to_id: business.id }, _sum: { amount: true } }),
      prisma.txnEntry.aggregate({ where: { from_id: business.id }, _sum: { amount: true } }),
    ]);
    const businessCash = Number(bizInflows._sum.amount || 0) - Number(bizOutflows._sum.amount || 0);

    // 4. Partner Calculations
    const [badarWithdrawnSum, hashirWithdrawnSum, badarContribSum, hashirContribSum] = await Promise.all([
      prisma.txnEntry.aggregate({
        where: { type: TxnType.PROFIT_WITHDRAWAL, partner: Partner.BADAR },
        _sum: { amount: true },
      }),
      prisma.txnEntry.aggregate({
        where: { type: TxnType.PROFIT_WITHDRAWAL, partner: Partner.HASHIR },
        _sum: { amount: true },
      }),
      prisma.txnEntry.aggregate({
        where: { type: TxnType.CAPITAL_CONTRIBUTION, partner: Partner.BADAR },
        _sum: { amount: true },
      }),
      prisma.txnEntry.aggregate({
        where: { type: TxnType.CAPITAL_CONTRIBUTION, partner: Partner.HASHIR },
        _sum: { amount: true },
      }),
    ]);

    const badarWithdrawn = Number(badarWithdrawnSum._sum.amount || 0);
    const hashirWithdrawn = Number(hashirWithdrawnSum._sum.amount || 0);
    const badarContributed = Number(badarContribSum._sum.amount || 0);
    const hashirContributed = Number(hashirContribSum._sum.amount || 0);

    const badarSharePct = badar.share_percentage || 65;
    const hashirSharePct = hashir.share_percentage || 35;
    const totalShares = badarSharePct + hashirSharePct || 100;

    // Period Split (Only shown if periodNetProfit > 0)
    let badarPeriodShare = 0;
    let hashirPeriodShare = 0;
    if (periodNetProfit > 0) {
      hashirPeriodShare = Math.round(periodNetProfit * (hashirSharePct / totalShares));
      badarPeriodShare = periodNetProfit - hashirPeriodShare;
    }

    // All-time Earned
    let badarAllTimeEarned = 0;
    let hashirAllTimeEarned = 0;
    if (allTimeNetProfit > 0) {
      hashirAllTimeEarned = Math.round(allTimeNetProfit * (hashirSharePct / totalShares));
      badarAllTimeEarned = allTimeNetProfit - hashirAllTimeEarned;
    }

    const badarUnclaimed = badarAllTimeEarned - badarWithdrawn;
    const hashirUnclaimed = hashirAllTimeEarned - hashirWithdrawn;

    const availableLiquid = Math.max(0, businessCash);
    const badarAvailable = Math.max(0, Math.min(badarUnclaimed, availableLiquid));
    const hashirAvailable = Math.max(0, Math.min(hashirUnclaimed, availableLiquid));

    // 5. Cash in Stock (Raw Materials + Finished Goods)
    const [rawMaterials, products] = await Promise.all([
      prisma.rawMaterial.findMany({ select: { current_stock: true, cost_per_unit: true } }),
      prisma.product.findMany({ select: { stock: true, making_cost: true } }),
    ]);

    const rawMaterialsStockValue = rawMaterials.reduce((acc, rm) => acc + rm.current_stock * rm.cost_per_unit, 0);
    const finishedGoodsStockValue = products.reduce((acc, p) => acc + p.stock * p.making_cost, 0);
    const totalStockValue = rawMaterialsStockValue + finishedGoodsStockValue;

    // 6. Expected (Pending Sales)
    const pendingSalesAgg = await prisma.sale.aggregate({
      where: { payment_status: "PENDING" },
      _sum: { total_price: true },
      _count: true,
    });
    const pendingSalesAmount = Number(pendingSalesAgg._sum.total_price || 0);
    const pendingSalesCount = pendingSalesAgg._count;

    // 7. Identity check: Business Cash = Capital + All-time Profit - Withdrawals
    const expectedBusinessCash = totalCapitalContributions + allTimeNetProfit - totalWithdrawals;
    const identityBalanced = Math.abs(businessCash - expectedBusinessCash) < 0.01;

    return {
      selectedYear,
      selectedMonth,
      isAllTime,
      // Period metrics
      periodRevenue,
      periodRevenueGross,
      periodRefunds,
      periodExpenses,
      periodNetProfit,
      isLoss: periodNetProfit <= 0,
      expensesByCategory,
      // All-time & Cash
      businessCash,
      allTimeRevenue,
      allTimeExpenses,
      allTimeNetProfit,
      totalCapitalContributions,
      totalWithdrawals,
      identityBalanced,
      // Partners
      partners: {
        badar: {
          name: "Badar",
          partner: Partner.BADAR,
          sharePercentage: badarSharePct,
          periodShare: badarPeriodShare,
          allTimeEarned: badarAllTimeEarned,
          allTimeWithdrawn: badarWithdrawn,
          unclaimedProfit: badarUnclaimed,
          availableToWithdraw: badarAvailable,
          contributed: badarContributed,
          isOverdrawn: badarUnclaimed < 0,
          overdrawnAmount: badarUnclaimed < 0 ? Math.abs(badarUnclaimed) : 0,
        },
        hashir: {
          name: "Hashir",
          partner: Partner.HASHIR,
          sharePercentage: hashirSharePct,
          periodShare: hashirPeriodShare,
          allTimeEarned: hashirAllTimeEarned,
          allTimeWithdrawn: hashirWithdrawn,
          unclaimedProfit: hashirUnclaimed,
          availableToWithdraw: hashirAvailable,
          contributed: hashirContributed,
          isOverdrawn: hashirUnclaimed < 0,
          overdrawnAmount: hashirUnclaimed < 0 ? Math.abs(hashirUnclaimed) : 0,
        },
      },
      // Stock & Expectations
      stock: {
        rawMaterialsValue: rawMaterialsStockValue,
        finishedGoodsValue: finishedGoodsStockValue,
        totalStockValue,
      },
      expected: {
        pendingAmount: pendingSalesAmount,
        pendingCount: pendingSalesCount,
      },
    };
  } catch (error) {
    console.error("Error calculating bank metrics:", error);
    throw error;
  }
}

// ==========================================
// LEDGER QUERY
// ==========================================

export async function getLedger(filters?: {
  page?: number;
  limit?: number;
  type?: TxnType;
  partner?: Partner;
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.max(1, Math.min(100, filters?.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.TxnEntryWhereInput = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.partner) where.partner = filters.partner;
    if (filters?.category) where.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      where.occurred_at = {};
      if (filters.startDate) where.occurred_at.gte = new Date(filters.startDate);
      if (filters.endDate) where.occurred_at.lte = new Date(filters.endDate);
    }

    const [total, entries] = await Promise.all([
      prisma.txnEntry.count({ where }),
      prisma.txnEntry.findMany({
        where,
        orderBy: [{ occurred_at: "desc" }, { created_at: "desc" }],
        skip,
        take: limit,
        include: {
          from: { select: { id: true, name: true, type: true } },
          to: { select: { id: true, name: true, type: true } },
          sale: {
            select: {
              id: true,
              customer_name: true,
              total_price: true,
              product: { select: { name: true } },
            },
          },
          restock: {
            select: {
              id: true,
              total_cost: true,
              supplier: true,
              raw_material: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    // Serialize Decimal amounts to numbers for Client Component compatibility
    const serializedEntries = entries.map((entry) => ({
      ...entry,
      amount: Number(entry.amount),
      occurred_at: entry.occurred_at.toISOString(),
      created_at: entry.created_at.toISOString(),
    }));

    return {
      entries: serializedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    return {
      entries: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}
