"use client";

import { useState } from "react";
import { recordExpense } from "@/app/bank-actions";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/utils";
import { ExpenseCategory, Partner } from "@prisma/client";
import { X, Plus, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickExpenseModal({ isOpen, onClose, onSuccess }: QuickExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.ADS);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isOutOfPocket, setIsOutOfPocket] = useState(false);
  const [paidBy, setPaidBy] = useState<Partner>(Partner.HASHIR);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive expense amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await recordExpense({
        amount: numAmount,
        category,
        date,
        notes: notes.trim() || undefined,
        paid_personally_by: isOutOfPocket ? paidBy : undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to record expense");
        setLoading(false);
        return;
      }

      // Reset and close
      setAmount("");
      setNotes("");
      setIsOutOfPocket(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg shadow-float animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-elevated border border-hairline flex items-center justify-center text-ink">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Record Business Expense</h3>
              <p className="text-xs text-mute">Adds operating costs to the current period</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-sm hover:bg-hairline flex items-center justify-center text-mute hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error-soft text-error rounded-sm text-sm flex items-center gap-2 border border-error/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-mute mb-1">
                Amount (PKR) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="1"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-medium tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-mute mb-1">
                Date <span className="text-error">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-mute mb-1">
              Expense Category <span className="text-error">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link"
            >
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([catKey, label]) => (
                <option key={catKey} value={catKey}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Out-of-pocket toggle (Option A) */}
          <div className="p-3 well border border-hairline rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Paid from personal pocket?</p>
                <p className="text-xs text-mute">
                  Books a partner capital contribution + expense simultaneously
                </p>
              </div>
              <input
                type="checkbox"
                id="outOfPocket"
                checked={isOutOfPocket}
                onChange={(e) => setIsOutOfPocket(e.target.checked)}
                className="w-4 h-4 rounded border-hairline accent-primary cursor-pointer"
              />
            </div>

            {isOutOfPocket && (
              <div className="pt-2 border-t border-hairline/60">
                <label className="block text-xs font-mono uppercase text-mute mb-1">
                  Which partner paid?
                </label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value as Partner)}
                  className="w-full h-9 px-3 bg-canvas border border-hairline rounded-sm text-ink text-sm focus:outline-none focus:border-link"
                >
                  <option value={Partner.HASHIR}>Hashir</option>
                  <option value={Partner.BADAR}>Badar</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-mute mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Meta ads campaign for Velvet Oud, TCS shipping fees..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-sm btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm btn-primary"
            >
              {loading ? "Recording..." : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
