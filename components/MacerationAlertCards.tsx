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
          <div key={m.id} className="card-sm flex flex-col gap-3">
            <div>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-ink">{m.product?.name}</p>
                <span className="badge badge-warning shrink-0">Complete</span>
              </div>
              <p className="text-xs text-mute mt-0.5">
                {m.batch_quantity} bottle{m.batch_quantity !== 1 ? "s" : ""} — Ended{" "}
                {formatDate(m.end_date)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => handleAddToStock(m.id)}
                className="btn btn-sm btn-primary flex-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Add to Stock
              </button>
              <button
                disabled={busy}
                onClick={() => openExtend(m.id)}
                className="btn btn-sm btn-secondary flex-1"
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
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-md p-6">
            <h3 className="text-h3 text-ink mb-4">Extend Maceration Period</h3>
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
                  className="btn btn-sm btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  disabled={busy || !newEndDate}
                  onClick={handleExtend}
                  className="btn btn-sm btn-primary flex-1"
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
