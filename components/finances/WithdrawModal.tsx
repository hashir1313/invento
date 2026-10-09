"use client";

import { useState } from "react";
import { recordProfitWithdrawal } from "@/app/bank-actions";
import { Partner } from "@prisma/client";
import { formatPKR } from "@/lib/utils";
import { X, ArrowUpRight, AlertCircle, Info } from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partnerInfo: {
    name: string;
    partner: Partner;
    unclaimedProfit: number;
    availableToWithdraw: number;
  };
  businessCash: number;
}

export function WithdrawModal({
  isOpen,
  onClose,
  onSuccess,
  partnerInfo,
  businessCash,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const maxWithdrawable = partnerInfo.availableToWithdraw;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive withdrawal amount.");
      return;
    }

    if (numAmount > maxWithdrawable) {
      setError(`Cannot withdraw more than available liquid amount (${formatPKR(maxWithdrawable)}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await recordProfitWithdrawal({
        partner: partnerInfo.partner,
        amount: numAmount,
        date,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to record withdrawal");
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

  function handleSetMax() {
    if (maxWithdrawable > 0) {
      setAmount(maxWithdrawable.toString());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg shadow-float animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-elevated border border-hairline flex items-center justify-center text-ink">
              <ArrowUpRight className="w-4 h-4 text-warning-deep" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Withdraw Profit — {partnerInfo.name}</h3>
              <p className="text-xs text-mute">Transfers earned share from Business Account to personal pocket</p>
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

        {/* Financial Summary Card */}
        <div className="mt-4 p-4 well border border-hairline rounded-sm space-y-2 text-sm">
          <div className="flex justify-between items-center text-mute">
            <span>All-time Unclaimed Profit:</span>
            <span className="font-semibold text-ink tabular-nums">{formatPKR(partnerInfo.unclaimedProfit)}</span>
          </div>
          <div className="flex justify-between items-center text-mute">
            <span>Business Cash Balance:</span>
            <span className="font-semibold text-ink tabular-nums">{formatPKR(businessCash)}</span>
          </div>
          <div className="pt-2 border-t border-hairline flex justify-between items-center">
            <span className="font-medium text-ink">Withdrawable Right Now:</span>
            <span className="text-base font-bold text-success tabular-nums">
              {formatPKR(maxWithdrawable)}
            </span>
          </div>
          {partnerInfo.unclaimedProfit > businessCash && (
            <p className="text-xs text-mute mt-1 flex items-start gap-1">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Withdrawal capped by liquid company cash. Remaining {formatPKR(partnerInfo.unclaimedProfit - maxWithdrawable)} is currently reinvested in physical stock.
              </span>
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error-soft text-error rounded-sm text-sm flex items-center gap-2 border border-error/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-mono uppercase text-mute">
                Withdraw Amount (PKR) <span className="text-error">*</span>
              </label>
              {maxWithdrawable > 0 && (
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-xs font-medium text-link hover:underline"
                >
                  Max: {formatPKR(maxWithdrawable)}
                </button>
              )}
            </div>
            <input
              type="number"
              step="any"
              required
              min="1"
              max={maxWithdrawable}
              disabled={maxWithdrawable <= 0}
              placeholder={maxWithdrawable <= 0 ? "No withdrawable cash available" : "e.g. 15000"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-medium tabular-nums disabled:opacity-60 disabled:cursor-not-allowed"
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

          <div>
            <label className="block text-xs font-mono uppercase text-mute mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Profit payout for March earnings..."
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
              disabled={loading || maxWithdrawable <= 0}
              className="btn btn-sm btn-primary"
            >
              {loading ? "Processing..." : "Confirm Withdrawal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
