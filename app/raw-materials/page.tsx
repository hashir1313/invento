"use client";

import { useState, useEffect } from "react";
import { getRawMaterials, createRawMaterial, updateRawMaterial, restockRawMaterial, deleteRawMaterial } from "../actions";
import { formatPKR, formatDate, MATERIAL_CATEGORY_LABELS } from "@/lib/utils";
import { 
  Boxes, 
  Plus, 
  Pencil,
  AlertTriangle, 
  TrendingUp, 
  Trash2, 
  Layers, 
  X,
  PlusCircle,
  Truck,
  Droplets,
  PackageCheck
} from "lucide-react";
import { MaterialCategory, UnitOfMeasure } from "@prisma/client";

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add/Edit Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("OIL");
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>("ML");
  const [currentStock, setCurrentStock] = useState(500);
  const [minStockAlert, setMinStockAlert] = useState(100);
  const [costPerUnit, setCostPerUnit] = useState(15);

  // Restock Form State
  const [restockQty, setRestockQty] = useState(500);
  const [restockUnitCost, setRestockUnitCost] = useState(15);
  const [supplier, setSupplier] = useState("");

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    setLoading(true);
    const data = await getRawMaterials();
    setMaterials(data);
    if (data.length > 0 && !selectedMaterialId) {
      setSelectedMaterialId(data[0].id);
      setRestockUnitCost(data[0].cost_per_unit || 0);
    }
    setLoading(false);
  }

  function openAddModal() {
    setEditingMaterialId(null);
    setName("");
    setCategory("OIL");
    setUnitOfMeasure("ML");
    setCurrentStock(500);
    setMinStockAlert(100);
    setCostPerUnit(15);
    setIsAddModalOpen(true);
  }

  function openEditModal(mat: any) {
    setEditingMaterialId(mat.id);
    setName(mat.name);
    setCategory(mat.category);
    setUnitOfMeasure(mat.unit_of_measure);
    setCurrentStock(mat.current_stock);
    setMinStockAlert(mat.min_stock_alert);
    setCostPerUnit(mat.cost_per_unit);
    setIsAddModalOpen(true);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    let res;
    if (editingMaterialId) {
      res = await updateRawMaterial(editingMaterialId, {
        name,
        category,
        unit_of_measure: unitOfMeasure,
        current_stock: Number(currentStock),
        min_stock_alert: Number(minStockAlert),
        cost_per_unit: Number(costPerUnit),
      });
    } else {
      res = await createRawMaterial({
        name,
        category,
        unit_of_measure: unitOfMeasure,
        current_stock: Number(currentStock),
        min_stock_alert: Number(minStockAlert),
        cost_per_unit: Number(costPerUnit),
      });
    }

    setSubmitting(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setEditingMaterialId(null);
      setName("");
      loadMaterials();
    } else {
      alert(res.error || "Failed to save raw material");
    }
  }

  async function handleRestockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMaterialId) return;

    setSubmitting(true);
    const res = await restockRawMaterial({
      raw_material_id: selectedMaterialId,
      quantity_received: Number(restockQty),
      unit_cost: Number(restockUnitCost),
      supplier: supplier || undefined,
    });

    setSubmitting(false);

    if (res.success) {
      setIsRestockModalOpen(false);
      setSupplier("");
      loadMaterials();
    } else {
      alert(res.error || "Failed to restock raw material");
    }
  }

  async function handleDelete(id: string, matName: string) {
    if (confirm(`Are you sure you want to delete "${matName}"?`)) {
      setMaterials(materials.filter((m) => m.id !== id));
      await deleteRawMaterial(id);
    }
  }

  function openRestockFor(material: any) {
    setSelectedMaterialId(material.id);
    setRestockUnitCost(material.cost_per_unit || 0);
    setIsRestockModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-400" />
            <span>Raw Materials Inventory & Restock Hub</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track fragrance oils, ethanol, bottles, stickers, boxes, and cards. Log incoming shipments ("Got Supply").
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsRestockModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Got Supply (Restock)</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Material</span>
          </button>
        </div>
      </div>

      {/* Materials List Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading raw materials inventory...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Raw Materials Defined</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
            Add raw materials like fragrance oils, ethanol, bottles, boxes, and cards to track manufacturing stock.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add First Material
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Material Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Current Stock</th>
                  <th className="px-4 py-3.5">Min Alert Threshold</th>
                  <th className="px-4 py-3.5">Cost / Unit</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {materials.map((mat) => {
                  const isLow = mat.current_stock <= mat.min_stock_alert;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-white flex items-center gap-2">
                        <span>{mat.name}</span>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            LOW STOCK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-300">
                        {MATERIAL_CATEGORY_LABELS[mat.category as keyof typeof MATERIAL_CATEGORY_LABELS] || mat.category}
                      </td>
                      <td className="px-4 py-4 font-black">
                        <span className={isLow ? "text-rose-400" : "text-emerald-400"}>
                          {mat.current_stock} {mat.unit_of_measure}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-xs font-semibold">
                        {mat.min_stock_alert} {mat.unit_of_measure}
                      </td>
                      <td className="px-4 py-4 font-bold text-amber-300">
                        {formatPKR(mat.cost_per_unit)} / {mat.unit_of_measure}
                      </td>
                      <td className="px-4 py-4 text-right space-x-2">
                        <button
                          onClick={() => openRestockFor(mat)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-colors inline-flex items-center gap-1"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Got Supply</span>
                        </button>
                        <button
                          onClick={() => openEditModal(mat)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id, mat.name)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors inline-block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* "Got Supply" Restock Modal */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>Log Incoming Supply (Restock Intake)</span>
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              {/* Material Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Select Raw Material Item *
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    const mat = materials.find((m) => m.id === e.target.value);
                    if (mat) setRestockUnitCost(mat.cost_per_unit || 0);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category}) - Current: {m.current_stock} {m.unit_of_measure}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity Received */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0.1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cost / Unit (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={restockUnitCost}
                    onChange={(e) => setRestockUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Total Spending Preview */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Total Shipment Spend:</span>
                <span className="text-lg font-black text-amber-400">
                  {formatPKR(restockQty * restockUnitCost)}
                </span>
              </div>

              {/* Supplier Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Supplier / Vendor Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. French Fragrance Oil Imports Ltd"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {submitting ? "Processing..." : "Confirm Restock Intake"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingMaterialId ? (
                  <>
                    <Pencil className="w-5 h-5 text-amber-400" />
                    <span>Edit Raw Material Item</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-amber-400" />
                    <span>Add New Raw Material Item</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Material Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanilla Fragrance Oil, 50ml Glass Bottle, Logo Sticker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="OIL">Fragrance Oil</option>
                    <option value="SOLVENT">Solvent / Ethanol</option>
                    <option value="BOTTLE">Glass Bottle</option>
                    <option value="CAP_SPRAY">Spray Atomizer / Cap</option>
                    <option value="STICKER">Sticker / Label</option>
                    <option value="BOX">Packaging Box</option>
                    <option value="CARD">Thank You Card</option>
                    <option value="OTHER">Other Material</option>
                  </select>
                </div>

                {/* Unit of Measure */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="ML">Milliliters (ml)</option>
                    <option value="PIECES">Pieces (pcs)</option>
                    <option value="GRAMS">Grams (g)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Initial / Current Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Min Stock Alert */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Min Alert *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Cost per unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cost / Unit *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {submitting ? "Saving..." : editingMaterialId ? "Update Material" : "Save Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
