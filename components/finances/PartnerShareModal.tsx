"use client";

import { useState } from "react";
import { updatePartnerShares } from "@/app/bank-actions";
import { Partner } from "@prisma/client";
import { X, Percent, AlertCircle } from "lucide-react";

interface PartnerShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  badarShare: number;
  hashirShare: number;
}

export function PartnerShareModal({
  isOpen,
  onClose,
  onSuccess,
  badarShare: initialBadar,
  hashirShare: initialHashir,
}: PartnerShareModalProps) {
  const [badarPct, setBadarPct] = useState(initialBadar.toString());
  const [hashirPct, setHashirPct] = useState(initialHashir.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const badar = parseFloat(badarPct);
    const hashir = parseFloat(hashirPct);

    if (isNaN(badar) || isNaN(hashir) || badar < 0 || hashir < 0) {
      setError("Please enter valid percentages.");
      return;
    }

    if (Math.abs(badar + hashir - 100) > 0.001) {
      setError(`Shares must sum exactly to 100%. Currently: ${(badar + hashir).toFixed(1)}%`);
      return;
    }

    setLoading(true);
    try {
      const res = await updatePartnerShares([
        { partner: Partner.BADAR, percentage: badar },
        { partner: Partner.HASHIR, percentage: hashir },
      ]);

      if (!res.success) {
        setError(res.error || "Failed to update shares");
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleBadarChange(val: string) {
    setBadarPct(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setHashirPct((100 - num).toString());
    }
  }

  function handleHashirChange(val: string) {
    setHashirPct(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setBadarPct((100 - num).toString());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md shadow-float animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-elevated border border-hairline flex items-center justify-center text-ink">
              <Percent className="w-4 h-4 text-ink" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Adjust Profit Split</h3>
              <p className="text-xs text-mute">Configures the equity ratio for future profits</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-mute mb-1">
                Badar&apos;s Share (%)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                required
                value={badarPct}
                onChange={(e) => handleBadarChange(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-medium tabular-nums text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-mute mb-1">
                Hashir&apos;s Share (%)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                required
                value={hashirPct}
                onChange={(e) => handleHashirChange(e.target.value)}
                className="w-full h-10 px-3 bg-canvas border border-hairline rounded-sm text-ink focus:outline-none focus:border-link font-medium tabular-nums text-center"
              />
            </div>
          </div>

          <div className="p-3 well border border-hairline rounded-sm text-xs text-mute flex justify-between items-center">
            <span>Total Combined Split:</span>
            <span
              className={`font-mono font-bold ${
                Math.abs(parseFloat(badarPct || "0") + parseFloat(hashirPct || "0") - 100) < 0.001
                  ? "text-success"
                  : "text-error"
              }`}
            >
              {(parseFloat(badarPct || "0") + parseFloat(hashirPct || "0")).toFixed(1)}%
            </span>
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
              {loading ? "Saving..." : "Save Split Ratio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
