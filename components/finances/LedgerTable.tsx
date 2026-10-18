"use client";

import { useState, useEffect } from "react";
import { getLedger } from "@/app/bank-actions";
import { formatPKR, formatDate, TXN_TYPE_LABELS, TXN_TYPE_BADGES, EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { TxnType, ExpenseCategory } from "@prisma/client";
import { ArrowDownLeft, ArrowUpRight, Filter, ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface LedgerTableProps {
  refreshToken: number;
}

export function LedgerTable({ refreshToken }: LedgerTableProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLedger(1);
  }, [typeFilter, categoryFilter, refreshToken]);

  async function loadLedger(page: number) {
    setLoading(true);
    try {
      const res = await getLedger({
        page,
        limit: 15,
        type: typeFilter !== "ALL" ? (typeFilter as TxnType) : undefined,
        category: categoryFilter !== "ALL" ? (categoryFilter as ExpenseCategory) : undefined,
      });
      setEntries(res.entries);
      setPagination(res.pagination);
    } catch (err) {
      console.error("Error loading ledger:", err);
    } finally {
      setLoading(false);
    }
  }

  function renderFlowBadge(entry: any) {
    const isOutflow = entry.from && entry.from.type === "BUSINESS";
    const isInflow = entry.to && entry.to.type === "BUSINESS";

    if (entry.type === "CAPITAL_CONTRIBUTION") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-link font-mono tabular-nums">
          <ArrowDownLeft className="w-3.5 h-3.5" /> +{formatPKR(entry.amount)}
        </span>
      );
    }

    if (entry.type === "REVENUE") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 font-mono tabular-nums">
          <ArrowDownLeft className="w-3.5 h-3.5" /> +{formatPKR(entry.amount)}
        </span>
      );
    }

    if (entry.type === "REFUND" || entry.type === "EXPENSE") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 font-mono tabular-nums">
          <ArrowUpRight className="w-3.5 h-3.5" /> -{formatPKR(entry.amount)}
        </span>
      );
    }

    if (entry.type === "PROFIT_WITHDRAWAL") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 font-mono tabular-nums">
          <ArrowUpRight className="w-3.5 h-3.5" /> -{formatPKR(entry.amount)}
        </span>
      );
    }

    if (entry.type === "LOAN_DISBURSEMENT") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 font-mono tabular-nums">
          <ArrowDownLeft className="w-3.5 h-3.5" /> +{formatPKR(entry.amount)}
        </span>
      );
    }

    if (entry.type === "LOAN_REPAYMENT") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono tabular-nums">
          <ArrowUpRight className="w-3.5 h-3.5" /> -{formatPKR(entry.amount)}
        </span>
      );
    }

    return (
      <span className="text-xs font-mono tabular-nums">
        {formatPKR(entry.amount)}
      </span>
    );
  }

  return (
    <div className="card space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-hairline">
        <div>
          <h2 className="text-h3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-mute" />
            <span>Banking Ledger Audit Trail</span>
          </h2>
          <p className="text-xs text-mute mt-0.5">
            Immutable, append-only record of all company inflows, outflows, and partner drawings
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 well px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-mute" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-ink focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              {Object.entries(TXN_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {typeFilter === "EXPENSE" && (
            <div className="flex items-center gap-1.5 well px-2.5 py-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-ink focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([catKey, label]) => (
                  <option key={catKey} value={catKey}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs font-mono uppercase text-mute">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Description / Entity</th>
              <th className="pb-3 font-medium">Direction</th>
              <th className="pb-3 font-medium text-right">Cash Movement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-mute text-sm">
                  Loading ledger records...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-mute text-sm">
                  No transaction records found matching filter criteria.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-canvas/50 transition-colors">
                  {/* Date */}
                  <td className="py-3 text-xs text-ink font-mono whitespace-nowrap">
                    {formatDate(entry.occurred_at)}
                  </td>

                  {/* Type Badge */}
                  <td className="py-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-sm border ${
                      entry.type === "REVENUE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : entry.type === "EXPENSE"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : entry.type === "CAPITAL_CONTRIBUTION"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : entry.type === "PROFIT_WITHDRAWAL"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : entry.type === "LOAN_DISBURSEMENT"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : entry.type === "LOAN_REPAYMENT"
                        ? "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                        : "bg-hairline text-ink border-hairline"
                    }`}>
                      {TXN_TYPE_LABELS[entry.type] || entry.type}
                    </span>
                    {entry.category && (
                      <span className="block text-[11px] text-mute mt-0.5">
                        {EXPENSE_CATEGORY_LABELS[entry.category] || entry.category}
                      </span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="py-3 text-xs text-ink max-w-xs">
                    {entry.sale ? (
                      <div>
                        <span className="font-medium text-ink">Sale: {entry.sale.customer_name}</span>
                        {entry.sale.items && entry.sale.items.length > 0 ? (
                          <span className="text-mute block text-[11px]">
                            {entry.sale.items.map((i: any) => `${i.quantity}x ${i.product?.name || "perfume"}`).join(", ")}
                          </span>
                        ) : entry.sale.product ? (
                          <span className="text-mute block text-[11px]">{entry.sale.product.name}</span>
                        ) : null}
                      </div>
                    ) : entry.restock ? (
                      <div>
                        <span className="font-medium text-ink">
                          Restock: {entry.restock.raw_material?.name || "Material"}
                        </span>
                        {entry.restock.supplier && (
                          <span className="text-mute block text-[11px]">Via {entry.restock.supplier}</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-ink">{entry.notes || "—"}</span>
                        {entry.partner && (
                          <span className="text-mute block text-[11px]">Partner: {entry.partner}</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Direction */}
                  <td className="py-3 text-xs text-mute whitespace-nowrap font-mono">
                    {entry.from?.name || "Outside"} → {entry.to?.name || "Outside"}
                  </td>

                  {/* Cash Flow */}
                  <td className="py-3 text-right whitespace-nowrap">
                    {renderFlowBadge(entry)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-hairline text-xs text-mute">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => loadLedger(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="btn btn-sm btn-secondary p-1 h-7 w-7"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => loadLedger(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="btn btn-sm btn-secondary p-1 h-7 w-7"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
