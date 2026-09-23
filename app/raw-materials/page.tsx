"use client";

import { useState, useEffect } from "react";
import { 
  getRawMaterials, 
  createRawMaterial, 
  updateRawMaterial, 
  restockRawMaterial, 
  deleteRawMaterial 
} from "../actions";
import { formatPKR, MATERIAL_CATEGORY_LABELS } from "@/lib/utils";
import { 
  Boxes, 
  Plus, 
  Pencil,
  AlertTriangle, 
  TrendingUp, 
  Trash2, 
  X
} from "lucide-react";
import { MaterialCategory, UnitOfMeasure } from "@prisma/client";

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | MaterialCategory>("ALL");

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

  function openCreateModal() {
    setEditingMaterialId(null);
    setName("");
    setCategory("OIL");
    setUnitOfMeasure("ML");
    setCurrentStock(500);
    setMinStockAlert(100);
    setCostPerUnit(15);
    setIsModalOpen(true);
  }

  function openEditModal(mat: any) {
    setEditingMaterialId(mat.id);
    setName(mat.name);
    setCategory(mat.category);
    setUnitOfMeasure(mat.unit_of_measure);
    setCurrentStock(mat.current_stock);
    setMinStockAlert(mat.min_stock_alert);
    setCostPerUnit(mat.cost_per_unit);
    setIsModalOpen(true);
  }

  async function handleAddOrEditSubmit(e: React.FormEvent) {
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
      setIsModalOpen(false);
      setEditingMaterialId(null);
      await loadMaterials();
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

  const categories: { value: "ALL" | MaterialCategory; label: string }[] = [
    { value: "ALL", label: "All Materials" },
    { value: "OIL", label: "Fragrance Oil" },
    { value: "SOLVENT", label: "Solvent / Ethanol" },
    { value: "BOTTLE", label: "Glass Bottle" },
    { value: "CAP_SPRAY", label: "Spray / Cap" },
    { value: "STICKER", label: "Sticker" },
    { value: "BOX", label: "Packaging Box" },
    { value: "CARD", label: "Thank You Card" },
    { value: "OTHER", label: "Other" },
  ];

  const filteredMaterials = categoryFilter === "ALL"
    ? materials
    : materials.filter((m) => m.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Inventory / Raw Materials</p>
          <h1 className="text-h2 text-ink">Raw Materials Inventory & Restock Hub</h1>
          <p className="text-body text-base leading-6 mt-3 max-w-xl">
            Track fragrance oils, ethanol, bottles, stickers, boxes, and cards. Log incoming shipments ("Got Supply").
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsRestockModalOpen(true)}
            className="btn btn-primary btn-pill"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Got Supply (Restock)</span>
          </button>
          
          <button
            onClick={openCreateModal}
            className="btn btn-secondary btn-pill"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Material</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {!loading && materials.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count = cat.value === "ALL"
              ? materials.length
              : materials.filter((m) => m.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`btn btn-sm ${
                  categoryFilter === cat.value ? "btn-primary" : "btn-secondary"
                }`}
              >
                {cat.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${
                  categoryFilter === cat.value
                    ? "bg-on-primary/20 text-on-primary"
                    : "bg-hairline-soft text-mute"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Materials List Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-hairline border-t-ink rounded-full mx-auto mb-3"></div>
          <p className="text-body text-sm">Loading raw materials inventory...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="card border-dashed text-center py-16">
          <Boxes className="w-12 h-12 text-faint mx-auto mb-3" />
          <h3 className="text-h3 text-ink">No Raw Materials Defined</h3>
          <p className="text-body text-sm max-w-sm mx-auto mt-1">
            Add raw materials like fragrance oils, ethanol, bottles, boxes, and cards to track manufacturing stock.
          </p>
          <button
            onClick={openCreateModal}
            className="btn btn-sm btn-primary mt-4"
          >
            <Plus className="w-4 h-4" />
            Add First Material
          </button>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="card border-dashed text-center py-16">
          <Boxes className="w-12 h-12 text-faint mx-auto mb-3" />
          <h3 className="text-h3 text-ink">No Materials in This Category</h3>
          <p className="text-body text-sm max-w-sm mx-auto mt-1">
            Add materials to this category or switch to a different filter.
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Alert Threshold</th>
                  <th>Cost / Unit</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((mat) => {
                  const isLow = mat.current_stock <= mat.min_stock_alert;
                  return (
                    <tr key={mat.id}>
                      <td className="font-medium">
                        <span className="flex items-center gap-2">
                          <span>{mat.name}</span>
                          {isLow && (
                            <span className="badge badge-error">
                              <AlertTriangle className="w-3 h-3" />
                              LOW STOCK
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-xs text-body">
                        {MATERIAL_CATEGORY_LABELS[mat.category as keyof typeof MATERIAL_CATEGORY_LABELS] || mat.category}
                      </td>
                      <td className="font-medium tabular-nums">
                        <span className={isLow ? "text-error" : "text-ink"}>
                          {mat.current_stock} {mat.unit_of_measure}
                        </span>
                      </td>
                      <td className="text-xs text-mute tabular-nums">
                        {mat.min_stock_alert} {mat.unit_of_measure}
                      </td>
                      <td className="font-medium tabular-nums">
                        {formatPKR(mat.cost_per_unit)} / {mat.unit_of_measure}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(mat)}
                          className="btn btn-sm btn-secondary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => openRestockFor(mat)}
                          className="btn btn-sm btn-secondary"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Got Supply</span>
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id, mat.name)}
                          className="btn btn-sm btn-danger"
                          title="Delete material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <h3 className="text-h3 text-ink flex items-center gap-2">
                {editingMaterialId ? (
                  <>
                    <Pencil className="w-4 h-4 text-mute" />
                    <span>Edit Raw Material</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-mute" />
                    <span>Add New Raw Material</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOrEditSubmit} className="space-y-4">
              {/* Material Name */}
              <div>
                <label className="field-label">
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanilla Fragrance Oil, 50ml Glass Bottle, Logo Sticker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="field-label">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                    className="input"
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
                  <label className="field-label">
                    Unit of Measure *
                  </label>
                  <select
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
                    className="input"
                  >
                    <option value="ML">Milliliters (ml)</option>
                    <option value="PIECES">Pieces (pcs)</option>
                    <option value="GRAMS">Grams (g)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Stock */}
                <div>
                  <label className="field-label">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="input"
                  />
                </div>

                {/* Min Alert */}
                <div>
                  <label className="field-label">
                    Min Alert *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="input"
                  />
                </div>

                {/* Cost per unit */}
                <div>
                  <label className="field-label">
                    Cost / Unit (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-sm btn-primary"
                >
                  {submitting ? "Saving..." : editingMaterialId ? "Update Material" : "Save Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "Got Supply" Restock Modal */}
      {isRestockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <h3 className="text-h3 text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-mute" />
                <span>Log Incoming Supply (Restock Intake)</span>
              </h3>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="btn btn-sm btn-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              {/* Material Select */}
              <div>
                <label className="field-label">
                  Select Raw Material Item *
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    const mat = materials.find((m) => m.id === e.target.value);
                    if (mat) setRestockUnitCost(mat.cost_per_unit || 0);
                  }}
                  className="input"
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
                  <label className="field-label">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0.1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="input"
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="field-label">
                    Cost / Unit (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    step="any"
                    min="0"
                    value={restockUnitCost}
                    onChange={(e) => setRestockUnitCost(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              {/* Total Spending Preview */}
              <div className="well p-3 flex justify-between items-center">
                <span className="text-xs text-mute font-medium">Total Shipment Spend:</span>
                <span className="text-h3 tabular-nums text-ink">
                  {formatPKR(restockQty * restockUnitCost)}
                </span>
              </div>

              {/* Supplier Name */}
              <div>
                <label className="field-label">
                  Supplier / Vendor Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. French Fragrance Oil Imports Ltd"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="input"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-sm btn-primary"
                >
                  {submitting ? "Processing..." : "Confirm Restock Intake"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
