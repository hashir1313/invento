"use client";

import { useState } from "react";
import { getBankMetrics } from "@/app/bank-actions";
import { formatPKR, EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { Partner } from "@prisma/client";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Receipt,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Calendar,
  Layers,
} from "lucide-react";

import { QuickExpenseModal } from "./QuickExpenseModal";
import { CapitalContributionModal } from "./CapitalContributionModal";
import { WithdrawModal } from "./WithdrawModal";
import { PartnerShareModal } from "./PartnerShareModal";
import { LedgerTable } from "./LedgerTable";

interface FinancesClientProps {
  initialMetrics: any;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function FinancesClient({ initialMetrics }: FinancesClientProps) {
  const [metrics, setMetrics] = useState<any>(initialMetrics);
  const [year, setYear] = useState<number>(initialMetrics.selectedYear);
  const [month, setMonth] = useState<number>(initialMetrics.selectedMonth);
  const [activeTab, setActiveTab] = useState<"overview" | "ledger">("overview");
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [capitalModalOpen, setCapitalModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedPartnerForWithdraw, setSelectedPartnerForWithdraw] = useState<any>(null);

  async function handlePeriodChange(newYear: number, newMonth: number) {
    setYear(newYear);
    setMonth(newMonth);
    setLoading(true);
    try {
      const data = await getBankMetrics({ year: newYear, month: newMonth });
      setMetrics(data);
    } catch (err) {
      console.error("Error updating period metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshMetrics() {
    setLoading(true);
    try {
      const data = await getBankMetrics({ year, month });
      setMetrics(data);
      setRefreshToken((prev) => prev + 1);
    } catch (err) {
      console.error("Error refreshing metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  function openWithdrawModal(partnerData: any) {
    setSelectedPartnerForWithdraw(partnerData);
    setWithdrawModalOpen(true);
  }

  const badar = metrics.partners.badar;
  const hashir = metrics.partners.hashir;
  const isLoss = metrics.isLoss;

  return (
    <div className="space-y-6">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Finance & Banking / Treasury</p>
          <h1 className="text-h2 text-ink">Business Finances</h1>
          <p className="text-body text-sm mt-1 max-w-xl">
            Cash-basis profit formula, double-entry banking ledger, and dynamic partner drawings.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="btn btn-sm btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={() => setCapitalModalOpen(true)}
            className="btn btn-sm btn-secondary"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-link" />
            <span>Add Capital</span>
          </button>
          <button
            onClick={() => setShareModalOpen(true)}
            className="btn btn-sm btn-secondary"
          >
            <Percent className="w-3.5 h-3.5 text-mute" />
            <span>Equity Split</span>
          </button>
        </div>
      </div>

      {/* Period Selector Bar */}
      <div className="card-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-elevated">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-mute" />
          <span className="text-xs font-mono uppercase text-mute font-medium">Reporting Period:</span>
          <div className="flex items-center gap-1.5 ml-1">
            <select
              value={month}
              onChange={(e) => handlePeriodChange(year, parseInt(e.target.value))}
              className="h-8 px-2.5 bg-canvas border border-hairline rounded-sm text-xs font-medium text-ink focus:outline-none focus:border-link"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => handlePeriodChange(parseInt(e.target.value), month)}
              className="h-8 px-2.5 bg-canvas border border-hairline rounded-sm text-xs font-medium text-ink focus:outline-none focus:border-link"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Period Summary Indicator */}
        <div className="flex items-center gap-2 text-xs text-mute font-mono">
          <span>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <span>•</span>
          <span className={metrics.periodNetProfit >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
            Net: {formatPKR(metrics.periodNetProfit)}
          </span>
        </div>
      </div>

      {/* Top 4 Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Period Net Profit */}
        <div className={`card ${isLoss ? "border-rose-200 bg-rose-50/10" : ""}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow">Net Profit ({MONTH_NAMES[month - 1].slice(0, 3)})</p>
              <h3 className={`text-2xl font-bold tabular-nums mt-2 ${isLoss ? "text-rose-600" : "text-emerald-600"}`}>
                {formatPKR(metrics.periodNetProfit)}
              </h3>
              <p className="text-xs text-mute mt-1">
                {isLoss ? (
                  <span className="text-rose-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Loss period (withdrawals locked)
                  </span>
                ) : (
                  `Revenue ${formatPKR(metrics.periodRevenue)} − Costs ${formatPKR(metrics.periodExpenses)}`
                )}
              </p>
            </div>
            <div className={`w-9 h-9 shrink-0 rounded-sm border border-hairline flex items-center justify-center ${
              isLoss ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              {isLoss ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* 2. Business Cash Balance */}
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow">Business Cash</p>
              <h3 className="text-2xl font-bold tabular-nums text-ink mt-2">
                {formatPKR(metrics.businessCash)}
              </h3>
              <p className="text-xs text-mute mt-1">
                Liquid cash in company wallet
              </p>
            </div>
            <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 3. Cash in Stock */}
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow">Cash in Stock</p>
              <h3 className="text-2xl font-bold tabular-nums text-ink mt-2">
                {formatPKR(metrics.stock.totalStockValue)}
              </h3>
              <p className="text-xs text-mute mt-1 truncate max-w-[180px]" title={`Materials: ${formatPKR(metrics.stock.rawMaterialsValue)} | Finished: ${formatPKR(metrics.stock.finishedGoodsValue)}`}>
                Materials + Finished Perfumes
              </p>
            </div>
            <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 4. Expected (Pending Sales) */}
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow">Expected (Pending)</p>
              <h3 className="text-2xl font-bold tabular-nums text-ink mt-2">
                {formatPKR(metrics.expected.pendingAmount)}
              </h3>
              <p className="text-xs text-mute mt-1">
                {metrics.expected.pendingCount} unpaid order{metrics.expected.pendingCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Partner Profit & Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Badar's Account */}
        <div className="card space-y-4">
          <div className="flex justify-between items-start pb-3 border-b border-hairline">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink text-base">Badar</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-hairline text-[11px] font-mono text-mute font-medium">
                  {badar.sharePercentage}% Split
                </span>
              </div>
              <p className="text-xs text-mute mt-0.5">Partner drawing account</p>
            </div>
            <button
              onClick={() => openWithdrawModal(badar)}
              disabled={badar.availableToWithdraw <= 0}
              className="btn btn-sm btn-primary"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="well p-2.5">
              <span className="eyebrow text-[10px] block">This Month</span>
              <span className="font-semibold text-ink tabular-nums text-sm">
                {isLoss ? "—" : formatPKR(badar.periodShare)}
              </span>
            </div>

            <div className="well p-2.5">
              <span className="eyebrow text-[10px] block">Withdrawn</span>
              <span className="font-semibold text-ink tabular-nums text-sm">
                {formatPKR(badar.allTimeWithdrawn)}
              </span>
            </div>

            <div className="well p-2.5 border-emerald-200/60 bg-emerald-50/20">
              <span className="eyebrow text-[10px] text-emerald-700 block">Available Now</span>
              <span className="font-bold text-emerald-700 tabular-nums text-sm">
                {formatPKR(badar.availableToWithdraw)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-mute pt-1">
            <span>All-time Earned: {formatPKR(badar.allTimeEarned)}</span>
            <span>Contributed: {formatPKR(badar.contributed)}</span>
          </div>
        </div>

        {/* Hashir's Account */}
        <div className="card space-y-4">
          <div className="flex justify-between items-start pb-3 border-b border-hairline">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink text-base">Hashir</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-hairline text-[11px] font-mono text-mute font-medium">
                  {hashir.sharePercentage}% Split
                </span>
              </div>
              <p className="text-xs text-mute mt-0.5">Partner drawing account</p>
            </div>
            <button
              onClick={() => openWithdrawModal(hashir)}
              disabled={hashir.availableToWithdraw <= 0}
              className="btn btn-sm btn-primary"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="well p-2.5">
              <span className="eyebrow text-[10px] block">This Month</span>
              <span className="font-semibold text-ink tabular-nums text-sm">
                {isLoss ? "—" : formatPKR(hashir.periodShare)}
              </span>
            </div>

            <div className="well p-2.5">
              <span className="eyebrow text-[10px] block">Withdrawn</span>
              <span className="font-semibold text-ink tabular-nums text-sm">
                {formatPKR(hashir.allTimeWithdrawn)}
              </span>
            </div>

            <div className="well p-2.5 border-emerald-200/60 bg-emerald-50/20">
              <span className="eyebrow text-[10px] text-emerald-700 block">Available Now</span>
              <span className="font-bold text-emerald-700 tabular-nums text-sm">
                {formatPKR(hashir.availableToWithdraw)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-mute pt-1">
            <span>All-time Earned: {formatPKR(hashir.allTimeEarned)}</span>
            <span>Contributed: {formatPKR(hashir.contributed)}</span>
          </div>
        </div>
      </div>

      {/* Visual Split Bar (Rendered only when period profit > 0) */}
      {!isLoss && metrics.periodNetProfit > 0 && (
        <div className="card-sm space-y-2">
          <div className="flex justify-between text-xs text-mute">
            <span className="font-medium text-ink">
              Badar: {formatPKR(badar.periodShare)} ({badar.sharePercentage}%)
            </span>
            <span className="font-medium text-ink">
              Hashir: {formatPKR(hashir.periodShare)} ({hashir.sharePercentage}%)
            </span>
          </div>
          <div className="w-full h-3 bg-hairline rounded-full overflow-hidden flex">
            <div
              style={{ width: `${badar.sharePercentage}%` }}
              className="bg-ink h-full transition-all duration-300"
              title={`Badar: ${badar.sharePercentage}%`}
            />
            <div
              style={{ width: `${hashir.sharePercentage}%` }}
              className="bg-link h-full transition-all duration-300"
              title={`Hashir: ${hashir.sharePercentage}%`}
            />
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-hairline gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 relative transition-colors ${
            activeTab === "overview"
              ? "text-ink font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-ink"
              : "text-mute hover:text-ink"
          }`}
        >
          Expenses & Financial Summary
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`pb-3 relative transition-colors ${
            activeTab === "ledger"
              ? "text-ink font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-ink"
              : "text-mute hover:text-ink"
          }`}
        >
          Banking Audit Ledger
        </button>
      </div>

      {/* Tab 1: Overview & Cost Breakdown */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <h2 className="text-h3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-mute" />
                <span>Operating & Inventory Costs ({MONTH_NAMES[month - 1]})</span>
              </h2>
              <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                Total: {formatPKR(metrics.periodExpenses)}
              </span>
            </div>

            {Object.keys(metrics.expensesByCategory).length === 0 ? (
              <p className="text-sm text-mute py-4 text-center">
                No expenses logged for this month yet. Use the &quot;Record Expense&quot; button to add marketing, rent, or packaging costs.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(metrics.expensesByCategory).map(([catKey, amount]: [string, any]) => (
                  <div key={catKey} className="well p-3 space-y-1">
                    <span className="eyebrow text-[10px] truncate block">
                      {EXPENSE_CATEGORY_LABELS[catKey] || catKey}
                    </span>
                    <span className="text-base font-semibold text-ink tabular-nums block">
                      {formatPKR(amount)}
                    </span>
                    <span className="text-[11px] text-mute block">
                      {metrics.periodExpenses > 0
                        ? `${Math.round((amount / metrics.periodExpenses) * 100)}% of month costs`
                        : "0%"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Master Accounting Identity Card */}
          <div className="well p-4 border border-hairline text-xs space-y-2">
            <div className="flex items-center gap-2 font-mono text-ink font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Accounting Identity Reconciliation</span>
            </div>
            <p className="text-mute font-mono text-[11px] leading-relaxed">
              Business Cash ({formatPKR(metrics.businessCash)}) = Capital Contributions ({formatPKR(metrics.totalCapitalContributions)}) + All-Time Net Profit ({formatPKR(metrics.allTimeNetProfit)}) − Withdrawals ({formatPKR(metrics.totalWithdrawals)})
            </p>
            <p className="text-mute text-[11px]">
              Every rupee is strictly accounted for in immutable double-entry ledger rows.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Ledger Audit Trail */}
      {activeTab === "ledger" && (
        <LedgerTable refreshToken={refreshToken} />
      )}

      {/* Modals */}
      <QuickExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={refreshMetrics}
      />

      <CapitalContributionModal
        isOpen={capitalModalOpen}
        onClose={() => setCapitalModalOpen(false)}
        onSuccess={refreshMetrics}
      />

      <PartnerShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onSuccess={refreshMetrics}
        badarShare={badar.sharePercentage}
        hashirShare={hashir.sharePercentage}
      />

      {selectedPartnerForWithdraw && (
        <WithdrawModal
          isOpen={withdrawModalOpen}
          onClose={() => {
            setWithdrawModalOpen(false);
            setSelectedPartnerForWithdraw(null);
          }}
          onSuccess={refreshMetrics}
          partnerInfo={selectedPartnerForWithdraw}
          businessCash={metrics.businessCash}
        />
      )}
    </div>
  );
}
