"use client";

import { useState } from "react";
import { recordLoanDisbursement, recordLoanRepayment } from "@/app/bank-actions";
import { formatPKR } from "@/lib/utils";
import { X, Landmark, ArrowUpRight, ArrowDownLeft, AlertCircle, Info } from "lucide-react";

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  outstandingDebt?: number;
  businessCash?: number;
}

type LoanMode = "repay" | "borrow";

export function LoanModal({
  isOpen,
  onClose,
  onSuccess,
  outstandingDebt = 0,
  businessCash = 0,
}: LoanModalProps) {
  const [mode, setMode] = useState<LoanMode>("repay");
  const [lender, setLender] = useState("");
  const [amount, setAmount] = useState(""); // Borrow amount
  const [principalAmount, setPrincipalAmount] = useState(""); // Repay principal
  const [interestAmount, setInterestAmount] = useState(""); // Repay interest/fees
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!lender.trim()) {
      setError("Please specify the Lender or Bank name (e.g. Meezan Bank, HBL, Investor).");
      return;
    }

    setLoading(true);
    try {
      if (mode === "borrow") {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
          setError("Please enter a valid loan amount greater than zero.");
          setLoading(false);
          return;
        }

        const res = await recordLoanDisbursement({
          lender: lender.trim(),
          amount: numAmount,
          date,
          notes: notes.trim() || undefined,
        });

        if (!res.success) {
          setError(res.error || "Failed to record loan disbursement");
          setLoading(false);
          return;
        }
      } else {
        const numPrincipal = parseFloat(principalAmount) || 0;
        const numInterest = parseFloat(interestAmount) || 0;
        const total = numPrincipal + numInterest;

        if (total <= 0) {
          setError("Please enter a principal or interest repayment amount greater than zero.");
          setLoading(false);
          return;
        }

        if (total > businessCash) {
          setError(
            `Total repayment (${formatPKR(total)}) exceeds available business cash (${formatPKR(
              businessCash
            )}).`
          );
          setLoading(false);
          return;
        }

        const res = await recordLoanRepayment({
          lender: lender.trim(),
          principalAmount: numPrincipal,
          interestAmount: numInterest > 0 ? numInterest : undefined,
          date,
          notes: notes.trim() || undefined,
        });

        if (!res.success) {
          setError(res.error || "Failed to record loan repayment");
          setLoading(false);
          return;
        }
      }

      // Reset and close
      setLender("");
      setAmount("");
      setPrincipalAmount("");
      setInterestAmount("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  const parsedPrincipal = parseFloat(principalAmount) || 0;
  const parsedInterest = parseFloat(interestAmount) || 0;
  const totalRepayment = parsedPrincipal + parsedInterest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg shadow-float animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-elevated border border-hairline flex items-center justify-center text-ink">
              <Landmark className="w-4 h-4 text-ink" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Loan & Financing Management</h3>
              <p className="text-xs text-mute">Manage borrowed capital, repayments, and bank debt</p>
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

        {/* Current Debt Banner */}
        <div className="mt-3 px-3 py-2 well flex items-center justify-between text-xs font-mono">
          <span className="text-mute">Current Outstanding Debt:</span>
          <span className="font-bold text-ink tabular-nums">{formatPKR(outstandingDebt)}</span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1 p-1 bg-elevated rounded-sm border border-hairline">
          <button
            type="button"
            onClick={() => {
              setMode("repay");
              setError(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-xs transition-colors flex items-center justify-center gap-1.5 ${
              mode === "repay"
                ? "bg-canvas text-ink font-semibold shadow-xs"
                : "text-mute hover:text-ink"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Repay Loan / Bank</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("borrow");
              setError(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-xs transition-colors flex items-center justify-center gap-1.5 ${
              mode === "borrow"
                ? "bg-canvas text-ink font-semibold shadow-xs"
                : "text-mute hover:text-ink"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-purple-600" />
            <span>Receive New Loan</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-error-soft text-error rounded-sm text-sm flex items-center gap-2 border border-error/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Common Field: Lender / Bank Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-mute mb-1">
              Lender / Bank Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Meezan Bank, HBL, Investor, Friend"
              value={lender}
              onChange={(e) => setLender(e.target.value)}
              className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-medium placeholder:text-mute/50"
            />
          </div>

          {/* Mode Specific Amount Fields */}
          {mode === "borrow" ? (
            <div>
              <label className="block text-xs font-mono uppercase text-mute mb-1">
                Loan Amount (PKR) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-mono font-bold text-lg"
              />
              <p className="mt-1 text-[11px] text-mute flex items-center gap-1">
                <Info className="w-3 h-3 text-purple-600 shrink-0" />
                <span>Injects cash into the Business Account without inflating sales profit.</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-mute mb-1">
                    Principal Repayment (PKR)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-mono font-medium"
                  />
                  <span className="text-[10px] text-mute mt-0.5 block">
                    Reduces debt; does NOT reduce net profit.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-mute mb-1">
                    Interest / Markup Fee (PKR)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={interestAmount}
                    onChange={(e) => setInterestAmount(e.target.value)}
                    className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-mono font-medium"
                  />
                  <span className="text-[10px] text-mute mt-0.5 block">
                    Recorded as bank fee expense (affects profit).
                  </span>
                </div>
              </div>

              {totalRepayment > 0 && (
                <div className="p-2.5 well text-xs flex justify-between items-center font-mono">
                  <span className="text-mute">Total Cash Outflow:</span>
                  <span className="font-bold text-ink tabular-nums text-sm">
                    {formatPKR(totalRepayment)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Date and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-mute mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-mute mb-1">Notes / Ref</label>
              <input
                type="text"
                placeholder="e.g. Installment #3, Cheque #492"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link text-sm placeholder:text-mute/50"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary text-sm flex items-center gap-1.5"
            >
              {loading ? (
                <span>Recording...</span>
              ) : mode === "repay" ? (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Record Loan Repayment</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4 text-purple-400" />
                  <span>Record Loan Received</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
