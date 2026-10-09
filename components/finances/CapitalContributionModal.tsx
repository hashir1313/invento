"use client";

import { useState } from "react";
import { recordCapitalContribution } from "@/app/bank-actions";
import { Partner } from "@prisma/client";
import { X, ArrowDownRight, AlertCircle } from "lucide-react";

interface CapitalContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CapitalContributionModal({ isOpen, onClose, onSuccess }: CapitalContributionModalProps) {
  const [partner, setPartner] = useState<Partner>(Partner.HASHIR);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive contribution amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await recordCapitalContribution({
        partner,
        amount: numAmount,
        date,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to record capital contribution");
        setLoading(false);
        return;
      }

      setAmount("");
      setNotes("");
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
              <ArrowDownRight className="w-4 h-4 text-link" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Add Capital Investment</h3>
              <p className="text-xs text-mute">Injects cash into the Business Account (does not affect profit)</p>
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
                Partner <span className="text-error">*</span>
              </label>
              <select
                value={partner}
                onChange={(e) => setPartner(e.target.value as Partner)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-medium"
              >
                <option value={Partner.HASHIR}>Hashir</option>
                <option value={Partner.BADAR}>Badar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-mute mb-1">
                Amount (PKR) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                min="1"
                placeholder="e.g. 20000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-medium tabular-nums"
              />
            </div>
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

          <div>
            <label className="block text-xs font-mono uppercase text-mute mb-1">
              Notes / Reference (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Initial seed fund for Eid inventory, equipment purchase..."
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
              {loading ? "Recording..." : "Add Capital"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
