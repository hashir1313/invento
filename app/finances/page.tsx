import { getFinancesMetrics } from "../actions";
import { formatPKR } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  Receipt,
} from "lucide-react";

export const revalidate = 0;

export default async function FinancesPage() {
  const metrics = await getFinancesMetrics();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div>
        <p className="eyebrow mb-3">Finance / Overview</p>
        <h1 className="text-h2 text-ink">Finances</h1>
        <p className="text-body text-base leading-6 mt-3 max-w-xl">
          Profit breakdown, revenue overview, and partner shares based on all payed sales.
        </p>
      </div>

      {/* Top 3 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Badar's Profit */}
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow">
                Badar&apos;s Profit (65%)
              </p>
              <h3 className="text-2xl font-semibold tabular-nums text-ink mt-2">
                {formatPKR(metrics.badarProfit)}
              </h3>
              <p className="text-xs text-mute mt-1">65% of Net Profit</p>
            </div>
            <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Hashir's Profit */}
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow">
                Hashir&apos;s Profit (35%)
              </p>
              <h3 className="text-2xl font-semibold tabular-nums text-ink mt-2">
                {formatPKR(metrics.hashirProfit)}
              </h3>
              <p className="text-xs text-mute mt-1">35% of Net Profit</p>
            </div>
            <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow">
                Total Revenue
              </p>
              <h3 className="text-2xl font-semibold tabular-nums text-ink mt-2">
                {formatPKR(metrics.totalRevenue)}
              </h3>
              <p className="text-xs text-mute mt-1">From {metrics.totalPayedSales} payed sale{metrics.totalPayedSales === 1 ? "" : "s"}</p>
            </div>
            <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card">
        <h2 className="text-h3 flex items-center gap-2 mb-6">
          <Receipt className="w-4 h-4 text-mute" />
          <span>Profit & Cost Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="well p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="eyebrow">Total Revenue</span>
            </div>
            <p className="text-h3 tabular-nums text-ink">
              {formatPKR(metrics.totalRevenue)}
            </p>
            <p className="text-xs text-mute mt-1">Sum of all payed sales</p>
          </div>

          {/* Total Making Cost */}
          <div className="well p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="eyebrow">Total Making Cost</span>
            </div>
            <p className="text-h3 tabular-nums text-ink">
              {formatPKR(metrics.totalMakingCost)}
            </p>
            <p className="text-xs text-mute mt-1">Production cost of sold items</p>
          </div>

          {/* Total Net Profit */}
          <div className="well p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="eyebrow">Total Net Profit</span>
            </div>
            <p className="text-h3 tabular-nums text-ink">
              {formatPKR(metrics.totalNetProfit)}
            </p>
            <p className="text-xs text-mute mt-1">Revenue minus making cost</p>
          </div>
        </div>

        {/* Profit Split Visual */}
        <div className="well p-5 mt-6">
          <h3 className="text-sm font-semibold text-ink mb-4">Profit Split</h3>
          <div className="flex items-center gap-4">
            {/* Bar */}
            <div className="flex-1 h-8 bg-hairline rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full flex items-center justify-center text-[11px] font-medium text-on-primary"
                style={{ width: "65%" }}
              >
                Badar 65%
              </div>
              <div
                className="bg-link-soft h-full flex items-center justify-center text-[11px] font-medium text-link-deep"
                style={{ width: "35%" }}
              >
                Hashir 35%
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-3 text-xs text-body">
            <span>Badar: <span className="text-ink font-medium tabular-nums">{formatPKR(metrics.badarProfit)}</span></span>
            <span>Hashir: <span className="text-ink font-medium tabular-nums">{formatPKR(metrics.hashirProfit)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
