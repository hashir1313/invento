"use client";

import { useState, useEffect } from "react";
import {
  getProducts,
  getMacerationBatches,
  createMacerationBatch,
  addMacerationToStock,
  extendMaceration,
} from "../actions";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  Plus,
  Package,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import CalendarDatePicker from "@/components/CalendarDatePicker";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

export default function MacerationPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [macerations, setMacerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [batchQuantity, setBatchQuantity] = useState<number>(1);
  const [startDate, setStartDate] = useState(getTodayString);
  const [endDate, setEndDate] = useState(getTodayString);
  const [notes, setNotes] = useState("");

  // Extend modal state
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendingMacerationId, setExtendingMacerationId] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [prods, macs] = await Promise.all([getProducts(), getMacerationBatches()]);
    setProducts(prods);
    setMacerations(macs);

    if (prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id);
    }
    setLoading(false);
  }

  const activeMacerations = macerations.filter((m) => m.status === "MACERATING");
  const completedMacerations = macerations.filter((m) => m.status !== "MACERATING");
  const readyForAction = activeMacerations.filter(
    (m) => new Date(m.end_date) <= new Date()
  );

  async function handleCreateMaceration(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId || batchQuantity <= 0 || !startDate || !endDate) return;

    setSubmitting(true);
    try {
      const res = await createMacerationBatch({
        product_id: selectedProductId,
        batch_quantity: batchQuantity,
        start_date: startDate,
        end_date: endDate,
        notes: notes || undefined,
      });

      if (res.success) {
        alert("Maceration batch created successfully!");
        setBatchQuantity(1);
        setNotes("");
        loadData();
      } else {
        alert(res.error || "Failed to create maceration");
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddToStock(id: string) {
    if (!confirm("Are you sure you want to add this batch to available stock?")) return;

    try {
      const res = await addMacerationToStock(id);
      if (res.success) {
        alert("Products added to stock successfully!");
        loadData();
      } else {
        alert(res.error || "Failed to add to stock");
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    }
  }

  function openExtendModal(id: string) {
    setExtendingMacerationId(id);
    const maceration = macerations.find((m) => m.id === id);
    if (maceration) {
      const nextDay = new Date(maceration.end_date);
      nextDay.setDate(nextDay.getDate() + 1);
      setNewEndDate(nextDay.toISOString().split("T")[0]);
    }
    setExtendModalOpen(true);
  }

  async function handleExtendMaceration() {
    if (!extendingMacerationId || !newEndDate) return;

    try {
      const res = await extendMaceration(extendingMacerationId, newEndDate);
      if (res.success) {
        alert("Maceration period extended!");
        setExtendModalOpen(false);
        loadData();
      } else {
        alert(res.error || "Failed to extend maceration");
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    }
  }

  function getDaysRemaining(endDate: string) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-400" />
          <span>Maceration Management</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage perfume maceration periods. Track which batches are aging and when they are ready for stock.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      ) : (
        <>
          {/* Ready for Action Alert */}
          {readyForAction.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-900/60 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-amber-300">
                  {readyForAction.length} Batch{readyForAction.length !== 1 ? "es" : ""} Ready for Action
                </h2>
              </div>
              <p className="text-sm text-amber-200/80 mb-4">
                These maceration periods have ended. Choose to add to stock or extend the period.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {readyForAction.map((maceration) => (
                  <div
                    key={maceration.id}
                    className="bg-slate-950/80 p-4 rounded-xl border border-amber-900/40"
                  >
                    <p className="font-semibold text-white text-sm">{maceration.product?.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {maceration.batch_quantity} bottle{maceration.batch_quantity !== 1 ? "s" : ""} — Ended{" "}
                      {formatDate(maceration.end_date)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAddToStock(maceration.id)}
                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                      >
                        Add to Stock
                      </button>
                      <button
                        onClick={() => openExtendModal(maceration.id)}
                        className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
                      >
                        Extend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New Maceration Form */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg sticky top-24">
                <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4" />
                  <span>Add New Maceration</span>
                </h2>

                <form onSubmit={handleCreateMaceration} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Select Perfume *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 font-semibold"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.perfume_quantity_ml}ml
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Quantity (Bottles) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={batchQuantity}
                      onChange={(e) => setBatchQuantity(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <CalendarDatePicker
                    label="Start Date"
                    required
                    value={startDate}
                    onChange={setStartDate}
                  />

                  <CalendarDatePicker
                    label="End Date"
                    required
                    value={endDate}
                    onChange={setEndDate}
                    minDate={startDate}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
                      placeholder="e.g., Batch #42 from production..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedProductId || batchQuantity <= 0}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Clock className="w-4 h-4" />
                    {submitting ? "Creating..." : "Start Maceration"}
                  </button>
                </form>
              </div>
            </div>

            {/* Active Macerations List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Macerations */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Active Macerations ({activeMacerations.length})</span>
                </h2>

                {activeMacerations.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                    <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No active macerations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeMacerations.map((maceration) => {
                      const daysRemaining = getDaysRemaining(maceration.end_date);
                      const isReady = daysRemaining <= 0;

                      return (
                        <div
                          key={maceration.id}
                          className={`p-4 rounded-xl border ${
                            isReady
                              ? "bg-amber-950/30 border-amber-900/40"
                              : "bg-slate-950 border-slate-800"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-white text-sm">
                                  {maceration.product?.name}
                                </p>
                                {isReady && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                                    READY
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {maceration.batch_quantity} bottle{maceration.batch_quantity !== 1 ? "s" : ""}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(maceration.start_date)} — {formatDate(maceration.end_date)}
                                </span>
                              </div>
                              {maceration.notes && (
                                <p className="text-xs text-slate-500 mt-2 italic">{maceration.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <div className="text-right mr-2">
                                {isReady ? (
                                  <span className="text-xs font-bold text-amber-300">Ended</span>
                                ) : (
                                  <span className="text-xs font-bold text-slate-300">
                                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleAddToStock(maceration.id)}
                                className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                                title="Add to Stock"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openExtendModal(maceration.id)}
                                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
                                title="Extend Maceration"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Completed Macerations */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Completed ({completedMacerations.length})</span>
                </h2>

                {completedMacerations.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                    <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No completed macerations yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Qty</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {completedMacerations.map((maceration) => (
                          <tr key={maceration.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="px-4 py-3.5 font-semibold text-white">
                              {maceration.product?.name}
                            </td>
                            <td className="px-4 py-3.5 font-bold">
                              {maceration.batch_quantity}
                            </td>
                            <td className="px-4 py-3.5 text-slate-400 text-xs">
                              {formatDate(maceration.start_date)} — {formatDate(maceration.end_date)}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                                  maceration.status === "ADDED_TO_STOCK"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-slate-100 text-slate-800 border-slate-300"
                                }`}
                              >
                                {maceration.status === "ADDED_TO_STOCK" ? "Added to Stock" : maceration.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Extend Maceration Modal */}
      {extendModalOpen && (
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
                  onClick={() => setExtendModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendMaceration}
                  disabled={!newEndDate}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm transition-all"
                >
                  Extend Period
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
