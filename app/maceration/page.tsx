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
      <div>
        <p className="eyebrow mb-3">Production / Maceration</p>
        <h1 className="text-h2 text-ink flex items-center gap-2">
          <Clock className="w-6 h-6 text-mute" />
          <span>Maceration Management</span>
        </h1>
        <p className="text-body text-sm mt-2 max-w-xl">
          Manage perfume maceration periods. Track which batches are aging and when they are ready for stock.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-hairline border-t-ink rounded-full mx-auto mb-3"></div>
          <p className="text-mute text-sm">Loading...</p>
        </div>
      ) : (
        <>
          {/* Ready for Action Alert */}
          {readyForAction.length > 0 && (
            <div className="card border-warning/50">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="badge badge-warning">
                  <AlertTriangle className="w-3 h-3" />
                  Action needed
                </span>
                <h2 className="text-h3">
                  {readyForAction.length} Batch{readyForAction.length !== 1 ? "es" : ""} Ready for Action
                </h2>
              </div>
              <p className="text-sm text-body mb-4">
                These maceration periods have ended. Choose to add to stock or extend the period.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {readyForAction.map((maceration) => (
                  <div key={maceration.id} className="card-sm">
                    <p className="font-semibold text-ink text-sm">{maceration.product?.name}</p>
                    <p className="text-xs text-mute mt-1">
                      {maceration.batch_quantity} bottle{maceration.batch_quantity !== 1 ? "s" : ""} — Ended{" "}
                      {formatDate(maceration.end_date)}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAddToStock(maceration.id)}
                        className="btn btn-sm btn-primary flex-1"
                      >
                        Add to Stock
                      </button>
                      <button
                        onClick={() => openExtendModal(maceration.id)}
                        className="btn btn-sm btn-secondary flex-1"
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
              <div className="card sticky top-24">
                <h2 className="eyebrow flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4" />
                  <span>Add New Maceration</span>
                </h2>

                <form onSubmit={handleCreateMaceration} className="space-y-4">
                  <div>
                    <label className="field-label">
                      Select Perfume *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="input"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.perfume_quantity_ml}ml
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="field-label">
                      Quantity (Bottles) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={batchQuantity}
                      onChange={(e) => setBatchQuantity(Number(e.target.value))}
                      className="input tabular-nums"
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
                    <label className="field-label">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="input resize-none"
                      placeholder="e.g., Batch #42 from production..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedProductId || batchQuantity <= 0}
                    className="btn btn-primary w-full"
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
              <div className="card">
                <h2 className="text-h3 flex items-center gap-2 border-b border-hairline pb-3 mb-4">
                  <Clock className="w-5 h-5 text-mute" />
                  <span>Active Macerations ({activeMacerations.length})</span>
                </h2>

                {activeMacerations.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-hairline rounded-md">
                    <Package className="w-8 h-8 text-faint mx-auto mb-2" />
                    <p className="text-body text-sm">No active macerations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeMacerations.map((maceration) => {
                      const daysRemaining = getDaysRemaining(maceration.end_date);
                      const isReady = daysRemaining <= 0;

                      return (
                        <div
                          key={maceration.id}
                          className={`p-4 rounded-md border ${
                            isReady ? "bg-elevated border-warning/50" : "bg-elevated border-hairline"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-ink text-sm">
                                  {maceration.product?.name}
                                </p>
                                {isReady && (
                                  <span className="badge badge-warning">READY</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-mute">
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
                                <p className="text-xs text-mute mt-2">{maceration.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <div className="text-right mr-2">
                                {isReady ? (
                                  <span className="text-xs font-medium text-warning-deep">Ended</span>
                                ) : (
                                  <span className="text-xs font-medium text-ink">
                                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleAddToStock(maceration.id)}
                                className="btn btn-sm btn-primary"
                                title="Add to Stock"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openExtendModal(maceration.id)}
                                className="btn btn-sm btn-secondary"
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
              <div className="card">
                <h2 className="text-h3 flex items-center gap-2 border-b border-hairline pb-3 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-mute" />
                  <span>Completed ({completedMacerations.length})</span>
                </h2>

                {completedMacerations.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-hairline rounded-md">
                    <Package className="w-8 h-8 text-faint mx-auto mb-2" />
                    <p className="text-body text-sm">No completed macerations yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Period</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedMacerations.map((maceration) => (
                          <tr key={maceration.id}>
                            <td className="font-medium">
                              {maceration.product?.name}
                            </td>
                            <td className="font-medium tabular-nums">
                              {maceration.batch_quantity}
                            </td>
                            <td className="text-mute text-xs">
                              {formatDate(maceration.start_date)} — {formatDate(maceration.end_date)}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  maceration.status === "ADDED_TO_STOCK"
                                    ? "badge-success"
                                    : "badge-neutral"
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
                  onClick={() => setExtendModalOpen(false)}
                  className="btn btn-sm btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtendMaceration}
                  disabled={!newEndDate}
                  className="btn btn-sm btn-primary flex-1"
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
