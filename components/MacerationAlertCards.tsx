"use client";

import { useState } from "react";
import { addMacerationToStock, extendMaceration } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, ArrowRight, Clock, ChevronRight } from "lucide-react";
import CalendarDatePicker from "./CalendarDatePicker";

interface MacerationEntry {
  id: string;
  product_id: string;
  batch_quantity: number;
  start_date: Date | string;
  end_date: Date | string;
  status: string;
  notes: string | null;
  product: { name: string; perfume_quantity_ml: number };
}

export default function MacerationAlertCards({ items }: { items: MacerationEntry[] }) {
  const [extendId, setExtendId] = useState<string | null>(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAddToStock(id: string) {
    if (!confirm("Add this batch to available stock?")) return;
    setBusy(true);
    try {
      const res = await addMacerationToStock(id);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error || "Failed");
      }
    } catch (e: any) {
      alert(e?.message);
    } finally {
      setBusy(false);
    }
  }

  function openExtend(id: string) {
    setExtendId(id);
    const m = items.find((i) => i.id === id);
    if (m) {
      const next = new Date(m.end_date);
      next.setDate(next.getDate() + 1);
      setNewEndDate(next.toISOString().split("T")[0]);
    }
  }

  async function handleExtend() {
    if (!extendId || !newEndDate) return;
    setBusy(true);
    try {
      const res = await extendMaceration(extendId, newEndDate);
      if (res.success) {
        setExtendId(null);
        window.location.reload();
      } else {
        alert(res.error || "Failed");
      }
    } catch (e: any) {
      alert(e?.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((m) => (
          <div
            key={m.id}
            className="bg-slate-950/80 p-4 rounded-xl border border-amber-900/40 flex flex-col gap-3"
          >
            <div>
              <p className="font-semibold text-white text-sm">{m.product?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {m.batch_quantity} bottle{m.batch_quantity !== 1 ? "s" : ""} — Ended{" "}
                {formatDate(m.end_date)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => handleAddToStock(m.id)}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Add to Stock
              </button>
              <button
                disabled={busy}
                onClick={() => openExtend(m.id)}
                className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                Extend
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Extend Modal */}
      {extendId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Extend Maceration Period</h3>
            <div className="space-y-4">
              <CalendarDatePicker
                label="New End Date"
                required
                value={newEndDate}
                onChange={setNewEndDate}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setExtendId(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={busy || !newEndDate}
                  onClick={handleExtend}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm transition-all"
                >
                  {busy ? "Saving..." : "Extend Period"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
