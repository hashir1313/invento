import { getFinancesMetrics } from "../actions";
import { formatPKR } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  BarChart3,
  Receipt,
} from "lucide-react";

export const revalidate = 0;

export default async function FinancesPage() {
  const metrics = await getFinancesMetrics();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-amber-400" />
            <span>Finances</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Profit breakdown, revenue overview, and partner shares based on all payed sales.
          </p>
        </div>
      </div>

      {/* Top 3 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Badar's Profit */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Badar&apos;s Profit (65%)
              </p>
              <h3 className="text-2xl font-black text-emerald-400 mt-2">
                {formatPKR(metrics.badarProfit)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">65% of Net Profit</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Hashir's Profit */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hashir&apos;s Profit (35%)
              </p>
              <h3 className="text-2xl font-black text-sky-400 mt-2">
                {formatPKR(metrics.hashirProfit)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">35% of Net Profit</p>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Revenue
              </p>
              <h3 className="text-2xl font-black text-amber-400 mt-2">
                {formatPKR(metrics.totalRevenue)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">From {metrics.totalPayedSales} payed sale{metrics.totalPayedSales === 1 ? "" : "s"}</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
          <Receipt className="w-5 h-5 text-amber-400" />
          <span>Profit & Cost Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Revenue</span>
            </div>
            <p className="text-xl font-black text-emerald-400">
              {formatPKR(metrics.totalRevenue)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Sum of all payed sales</p>
          </div>

          {/* Total Making Cost */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <Wallet className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Making Cost</span>
            </div>
            <p className="text-xl font-black text-rose-400">
              {formatPKR(metrics.totalMakingCost)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Production cost of sold items</p>
          </div>

          {/* Total Net Profit */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Net Profit</span>
            </div>
            <p className="text-xl font-black text-amber-400">
              {formatPKR(metrics.totalNetProfit)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Revenue minus making cost</p>
          </div>
        </div>

        {/* Profit Split Visual */}
        <div className="mt-6 bg-slate-950 p-5 rounded-xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Profit Split</h3>
          <div className="flex items-center gap-4">
            {/* Bar */}
            <div className="flex-1 h-8 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ width: "65%" }}
              >
                Badar 65%
              </div>
              <div
                className="bg-sky-500 h-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ width: "35%" }}
              >
                Hashir 35%
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-400">
            <span>Badar: <span className="text-emerald-400 font-bold">{formatPKR(metrics.badarProfit)}</span></span>
            <span>Hashir: <span className="text-sky-400 font-bold">{formatPKR(metrics.hashirProfit)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
