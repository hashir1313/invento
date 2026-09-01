import Link from "next/link";
import { getDashboardMetrics } from "./actions";
import { formatPKR, formatDate, PAYMENT_STATUS_COLORS, PAYMENT_OPTION_LABELS } from "@/lib/utils";
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  PlusCircle, 
  Package, 
  Boxes, 
  CreditCard,
  ArrowRight,
  Sparkles
} from "lucide-react";

export const revalidate = 0; // Dynamic server page

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <span>Executive Dashboard</span>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-1 rounded-full border border-amber-500/30">
              Live Performance
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time overview of perfume sales, revenue, receivables, and raw material stock.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/sales"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record New Sale</span>
          </Link>
          <Link
            href="/raw-materials"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-all"
          >
            <Boxes className="w-4 h-4 text-amber-400" />
            <span>Got Supply</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-2">
                {formatPKR(metrics.totalRevenue)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Received & Cleared</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Receivables</p>
              <h3 className="text-2xl font-black text-amber-400 mt-2">
                {formatPKR(metrics.pendingReceivables)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Payment Pending</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Low Stock Warnings */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Alert</p>
              <h3 className="text-2xl font-black text-rose-400 mt-2">
                {metrics.lowStockCount} Item{metrics.lowStockCount === 1 ? "" : "s"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Raw Materials Needing Restock</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Reviews</p>
              <h3 className="text-2xl font-black text-sky-400 mt-2">
                {metrics.pendingReviewsCount} Customer{metrics.pendingReviewsCount === 1 ? "" : "s"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Awaiting Review Feedback</p>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown by Payment Method */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-amber-400" />
          <span>Revenue Breakdown by Payment Option</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(metrics.paymentOptionBreakdown).map(([method, amount]) => (
            <div key={method} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-semibold uppercase">
                {PAYMENT_OPTION_LABELS[method as keyof typeof PAYMENT_OPTION_LABELS] || method}
              </p>
              <p className="text-xl font-bold text-white mt-1">
                {formatPKR(amount)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Raw Material Warnings Section */}
      {metrics.lowStockMaterials.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-900/60 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Critical Low Stock Raw Materials</span>
            </h2>
            <Link
              href="/raw-materials"
              className="text-xs text-rose-300 hover:text-white font-medium flex items-center gap-1"
            >
              <span>Restock Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.lowStockMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-slate-950/80 p-3.5 rounded-xl border border-rose-900/40 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-white text-sm">{material.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Category: <span className="text-slate-300">{material.category}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30">
                    {material.current_stock} {material.unit_of_measure}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Min: {material.min_stock_alert}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales Overview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Recent Sales Activity</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest customer perfume orders</p>
          </div>
          <Link
            href="/sales"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>View All Sales</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {metrics.recentSales.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No sales recorded yet.</p>
            <Link
              href="/sales"
              className="inline-block mt-3 px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg"
            >
              Record First Sale
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Perfume Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Total Price</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {metrics.recentSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-white">{sale.customer_name}</td>
                    <td className="px-4 py-3.5 text-amber-300 font-medium">{sale.product?.name || "Product"}</td>
                    <td className="px-4 py-3.5 font-bold">{sale.quantity}</td>
                    <td className="px-4 py-3.5 font-bold text-white">{formatPKR(sale.total_price)}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 text-xs bg-slate-800 text-slate-300 rounded-md font-medium">
                        {PAYMENT_OPTION_LABELS[sale.payment_option as keyof typeof PAYMENT_OPTION_LABELS] || sale.payment_option}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                          PAYMENT_STATUS_COLORS[sale.payment_status as keyof typeof PAYMENT_STATUS_COLORS] || ""
                        }`}
                      >
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{formatDate(sale.date_purchased)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
