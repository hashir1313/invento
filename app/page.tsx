import Link from "next/link";
import { getDashboardMetrics } from "./actions";
import {
  formatPKR,
  formatDate,
  PAYMENT_STATUS_COLORS,
  PAYMENT_OPTION_LABELS,
} from "@/lib/utils";
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
  Timer,
} from "lucide-react";
import MacerationAlertCards from "@/components/MacerationAlertCards";

export const revalidate = 0; // Dynamic server page

function StatIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-9 h-9 shrink-0 rounded-sm border border-hairline bg-elevated text-mute flex items-center justify-center">
      {children}
    </span>
  );
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-6">
      {/* Hero band — the one place the mesh gradient is allowed */}
      <div className="mesh -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-6 lg:px-8 pt-12 pb-10 border-b border-hairline">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Dashboard / Live Performance</p>
            <h1 className="text-h2 text-ink">Executive Dashboard</h1>
            <p className="text-body text-base leading-6 mt-3 max-w-xl">
              Real-time overview of perfume sales, revenue, receivables, and raw
              material stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/sales" className="btn btn-primary btn-pill">
              <PlusCircle className="w-4 h-4" />
              <span>Record New Sale</span>
            </Link>
            <Link href="/raw-materials" className="btn btn-secondary btn-pill">
              <Boxes className="w-4 h-4" />
              <span>Got Supply</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="eyebrow">Total Revenue</p>
              <h3 className="text-h3 tabular-nums mt-3">
                {formatPKR(metrics.totalRevenue)}
              </h3>
              <p className="text-mute text-xs mt-1">Received &amp; Cleared</p>
            </div>
            <StatIcon>
              <DollarSign className="w-4 h-4" />
            </StatIcon>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="eyebrow">Pending Receivables</p>
              <h3 className="text-h3 tabular-nums mt-3">
                {formatPKR(metrics.pendingReceivables)}
              </h3>
              <p className="text-mute text-xs mt-1">Payment Pending</p>
            </div>
            <StatIcon>
              <Clock className="w-4 h-4" />
            </StatIcon>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="eyebrow">Low Stock Alert</p>
              <h3
                className={`text-h3 tabular-nums mt-3${
                  metrics.lowStockProductCount > 0 ? " text-error" : ""
                }`}
              >
                {metrics.lowStockProductCount} Product
                {metrics.lowStockProductCount === 1 ? "" : "s"}
              </h3>
              <p className="text-mute text-xs mt-1">Perfumes Needing Restock</p>
            </div>
            <StatIcon>
              <AlertTriangle className="w-4 h-4" />
            </StatIcon>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="eyebrow">Pending Reviews</p>
              <h3 className="text-h3 tabular-nums mt-3">
                {metrics.pendingReviewsCount} Customer
                {metrics.pendingReviewsCount === 1 ? "" : "s"}
              </h3>
              <p className="text-mute text-xs mt-1">Awaiting Review Feedback</p>
            </div>
            <StatIcon>
              <MessageSquare className="w-4 h-4" />
            </StatIcon>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown by Payment Method */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-mute" />
          <h2 className="text-h3">Revenue Breakdown by Payment Option</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(metrics.paymentOptionBreakdown).map(
            ([method, amount]) => (
              <div key={method} className="well p-4">
                <p className="eyebrow">
                  {PAYMENT_OPTION_LABELS[
                    method as keyof typeof PAYMENT_OPTION_LABELS
                  ] || method}
                </p>
                <p className="text-h3 tabular-nums mt-2">
                  {formatPKR(amount)}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Low Stock Product Warnings Section */}
      {metrics.lowStockProducts.length > 0 && (
        <div className="card border-error/30">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <span className="badge badge-error">
                <AlertTriangle className="w-3 h-3" />
                Action needed
              </span>
              <h2 className="text-h3">Critical Low Stock Perfumes</h2>
            </div>
            <Link
              href="/batch-production-v2"
              className="text-link hover:text-link-deep text-sm font-medium flex items-center gap-1 shrink-0"
            >
              <span>Produce Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.lowStockProducts.map((product: any) => (
              <div
                key={product.id}
                className="card-sm flex justify-between items-center gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {product.name}
                  </p>
                  <p className="text-xs text-mute mt-0.5">
                    {product.perfume_quantity_ml}ml — {formatPKR(product.price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="badge badge-error tabular-nums">
                    {product.stock} bottle{product.stock === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maceration Complete Alerts Section */}
      {metrics.completedMacerationsCount > 0 && (
        <div className="card border-warning/50">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <span className="badge badge-warning">
                <Timer className="w-3 h-3" />
                Ready
              </span>
              <h2 className="text-h3">Maceration Complete — Action Required</h2>
            </div>
            <Link
              href="/maceration"
              className="text-link hover:text-link-deep text-sm font-medium flex items-center gap-1 shrink-0"
            >
              <span>Manage Maceration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-sm text-body mb-5">
            {metrics.completedMacerationsCount} batch
            {metrics.completedMacerationsCount !== 1 ? "es" : ""} have completed
            maceration. Add to stock or extend the period.
          </p>
          <MacerationAlertCards items={metrics.completedMacerations} />
        </div>
      )}

      {/* Recent Sales Overview Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-mute" />
              <h2 className="text-h3">Recent Sales Activity</h2>
            </div>
            <p className="text-xs text-mute mt-1">
              Latest customer perfume orders
            </p>
          </div>
          <Link
            href="/sales"
            className="text-link hover:text-link-deep text-sm font-medium flex items-center gap-1 shrink-0"
          >
            <span>View All Sales</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {metrics.recentSales.length === 0 ? (
          <div className="text-center py-12 border-t border-hairline">
            <Package className="w-6 h-6 text-faint mx-auto mb-3" />
            <p className="text-body text-sm">No sales recorded yet.</p>
            <Link href="/sales" className="btn btn-primary btn-sm mt-4">
              Record First Sale
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-hairline">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Perfume Item</th>
                  <th>Qty</th>
                  <th>Total Price</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentSales.map((sale: any) => (
                  <tr key={sale.id}>
                    <td className="font-medium">{sale.customer_name}</td>
                    <td className="text-body">
                      {sale.product?.name || "Product"}
                    </td>
                    <td className="tabular-nums">{sale.quantity}</td>
                    <td className="font-medium tabular-nums">
                      {formatPKR(sale.total_price)}
                    </td>
                    <td className="text-body">
                      <span className="badge badge-neutral">
                        {PAYMENT_OPTION_LABELS[
                          sale.payment_option as keyof typeof PAYMENT_OPTION_LABELS
                        ] || sale.payment_option}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          PAYMENT_STATUS_COLORS[
                            sale.payment_status as keyof typeof PAYMENT_STATUS_COLORS
                          ] || ""
                        }`}
                      >
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="text-mute text-xs">
                      {formatDate(sale.date_purchased)}
                    </td>
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
