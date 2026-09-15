"use client";

import { useState, useEffect } from "react";
import { getProducts, getRawMaterials, produceBatch, getRecipesForProduct, saveRecipe } from "../actions";
import { formatPKR } from "@/lib/utils";
import { 
  FlaskConical, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  Boxes,
  ArrowRight,
  Zap,
  Pencil,
  X,
  Plus,
  Trash2,
  Save
} from "lucide-react";

export default function BatchProductionPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState("");
  const [batchQuantity, setBatchQuantity] = useState(10);
  const [notes, setNotes] = useState("");

  // Recipe Components State (Quick Recipe Config)
  const [oilMlPerBottle, setOilMlPerBottle] = useState(15);
  const [ethanolMlPerBottle, setEthanolMlPerBottle] = useState(35);
  const [selectedOilId, setSelectedOilId] = useState("");
  const [selectedEthanolId, setSelectedEthanolId] = useState("");
  const [selectedBottleId, setSelectedBottleId] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState("");
  const [selectedStickerId, setSelectedStickerId] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");

  // Recipe Management State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeItems, setRecipeItems] = useState<{ raw_material_id: string; quantity_required_per_unit: number }[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadRecipeForProduct(selectedProductId);
    }
  }, [selectedProductId]);

  async function loadData() {
    setLoading(true);
    const [prods, mats] = await Promise.all([getProducts(), getRawMaterials()]);
    setProducts(prods);
    setRawMaterials(mats);

    if (prods.length > 0) setSelectedProductId(prods[0].id);

    // Auto-select initial materials if present
    const oils = mats.filter((m) => m.category === "OIL");
    const solvents = mats.filter((m) => m.category === "SOLVENT");
    const bottles = mats.filter((m) => m.category === "BOTTLE");
    const boxes = mats.filter((m) => m.category === "BOX");
    const stickers = mats.filter((m) => m.category === "STICKER");
    const cards = mats.filter((m) => m.category === "CARD");

    if (oils.length > 0) setSelectedOilId(oils[0].id);
    if (solvents.length > 0) setSelectedEthanolId(solvents[0].id);
    if (bottles.length > 0) setSelectedBottleId(bottles[0].id);
    if (boxes.length > 0) setSelectedBoxId(boxes[0].id);
    if (stickers.length > 0) setSelectedStickerId(stickers[0].id);
    if (cards.length > 0) setSelectedCardId(cards[0].id);

    setLoading(false);
  }

  async function loadRecipeForProduct(productId: string) {
    if (!productId) return;
    setRecipeLoading(true);
    const items = await getRecipesForProduct(productId);
    setRecipeItems(
      items.map((item) => ({
        raw_material_id: item.raw_material_id,
        quantity_required_per_unit: item.quantity_required_per_unit,
      }))
    );

    const oil = items.find((i) => i.raw_material.category === "OIL");
    const solvent = items.find((i) => i.raw_material.category === "SOLVENT");
    if (oil) {
      setSelectedOilId(oil.raw_material_id);
      setOilMlPerBottle(oil.quantity_required_per_unit);
    }
    if (solvent) {
      setSelectedEthanolId(solvent.raw_material_id);
      setEthanolMlPerBottle(solvent.quantity_required_per_unit);
    }
    setRecipeLoading(false);
  }

  function openRecipeModal() {
    if (selectedProductId) {
      loadRecipeForProduct(selectedProductId);
    }
    setIsRecipeModalOpen(true);
  }

  function addRecipeItem() {
    setRecipeItems([...recipeItems, { raw_material_id: rawMaterials[0]?.id || "", quantity_required_per_unit: 0 }]);
  }

  function updateRecipeItem(index: number, field: "raw_material_id" | "quantity_required_per_unit", value: any) {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: field === "quantity_required_per_unit" ? Number(value) : value };
    setRecipeItems(updated);
  }

  function removeRecipeItem(index: number) {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  }

  async function handleSaveRecipe() {
    if (!selectedProductId) return;
    setSavingRecipe(true);
    const res = await saveRecipe(selectedProductId, recipeItems);
    setSavingRecipe(false);
    if (res.success) {
      setIsRecipeModalOpen(false);
      loadRecipeForProduct(selectedProductId);
    } else {
      alert(res.error || "Failed to save recipe");
    }
  }

  async function handleProduce(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId) return;

    setSubmitting(true);
    try {
      const selectedProd = products.find((p) => p.id === selectedProductId);
      const res = await produceBatch({
        product_id: selectedProductId,
        batch_quantity: Number(batchQuantity),
        notes: notes || `Batch production of ${batchQuantity} bottles of ${selectedProd?.name}`,
      });

      if (res.success) {
        alert(`Success! Produced ${batchQuantity} bottle(s) of ${selectedProd?.name}. Stock updated!`);
        loadData();
      } else {
        alert(res.error || "Batch production failed");
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const totalOilNeeded = oilMlPerBottle * batchQuantity;
  const totalEthanolNeeded = ethanolMlPerBottle * batchQuantity;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-amber-400" />
            <span>Perfume Batch Production & Bottling</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Assemble finished perfume batches. Deducts required raw materials (oil, ethanol, bottles, stickers, boxes) and adds ready-to-sell perfume bottles.
          </p>
        </div>

        <button
          onClick={openRecipeModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all shadow-md self-start sm:self-auto"
        >
          <Pencil className="w-4 h-4 text-amber-400" />
          <span>Manage Recipe</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading batch production engine...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Products Available</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
            Please add perfume products in the Products tab first before producing batches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Production Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Production Batch Configuration</span>
            </h2>

            <form onSubmit={handleProduce} className="space-y-5">
              {/* Product Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Target Perfume Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.perfume_quantity_ml}ml) - Current Stock: {p.stock} bottles
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Batch Quantity (Bottles to Produce) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Fragrance Oil (ml / bottle)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={oilMlPerBottle}
                    onChange={(e) => setOilMlPerBottle(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Ethanol (ml / bottle)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={ethanolMlPerBottle}
                    onChange={(e) => setEthanolMlPerBottle(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Material Selections */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4" />
                  <span>Materials Required per Bottle</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Fragrance Oil Item</span>
                    <select
                      value={selectedOilId}
                      onChange={(e) => setSelectedOilId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                      {rawMaterials.filter(m => m.category === "OIL").map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.current_stock} ml available)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Solvent / Ethanol Item</span>
                    <select
                      value={selectedEthanolId}
                      onChange={(e) => setSelectedEthanolId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                      {rawMaterials.filter(m => m.category === "SOLVENT").map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.current_stock} ml available)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Glass Bottle Item</span>
                    <select
                      value={selectedBottleId}
                      onChange={(e) => setSelectedBottleId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                      {rawMaterials.filter(m => m.category === "BOTTLE").map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.current_stock} pcs available)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Packaging Box Item</span>
                    <select
                      value={selectedBoxId}
                      onChange={(e) => setSelectedBoxId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                      {rawMaterials.filter(m => m.category === "BOX").map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.current_stock} pcs available)</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <FlaskConical className="w-5 h-5" />
                <span>{submitting ? "Brewing Batch..." : `Execute Batch Production (+${batchQuantity} Bottles)`}</span>
              </button>
            </form>
          </div>

          {/* Batch Material Deduction Summary Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Boxes className="w-5 h-5 text-amber-400" />
              <span>Batch Deduction Summary</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Fragrance Oil Required:</span>
                <span className="font-bold text-amber-300">{totalOilNeeded} ml</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Ethanol Required:</span>
                <span className="font-bold text-amber-300">{totalEthanolNeeded} ml</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Glass Bottles Required:</span>
                <span className="font-bold text-amber-300">{batchQuantity} pcs</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Boxes & Stickers Required:</span>
                <span className="font-bold text-amber-300">{batchQuantity} pcs each</span>
              </div>

              <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/60 mt-4">
                <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Perfume Stock Output</span>
                </p>
                <p className="text-sm font-extrabold text-white mt-1">
                  +{batchQuantity} finished bottle(s) of {selectedProduct?.name || "Perfume"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Management Modal */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-amber-400" />
                  <span>Manage Recipe</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define which raw materials and quantities are needed per bottle of <strong className="text-white">{selectedProduct?.name || "selected product"}</strong>.
                </p>
              </div>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {recipeLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-slate-400 text-sm">Loading recipe...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recipeItems.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No recipe defined for this product.</p>
                    <p className="text-slate-500 text-xs mt-1">Add materials below to create a recipe.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase text-slate-500 px-1">
                      <div className="col-span-5">Raw Material</div>
                      <div className="col-span-4">Quantity per Bottle</div>
                      <div className="col-span-2">Unit</div>
                      <div className="col-span-1"></div>
                    </div>
                    {recipeItems.map((item, index) => {
                      const mat = rawMaterials.find((m) => m.id === item.raw_material_id);
                      return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <select
                              value={item.raw_material_id}
                              onChange={(e) => updateRecipeItem(index, "raw_material_id", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                            >
                              {rawMaterials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.category})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              required
                              min="0"
                              step="any"
                              value={item.quantity_required_per_unit}
                              onChange={(e) => updateRecipeItem(index, "quantity_required_per_unit", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs text-slate-400 font-medium">
                              {mat?.unit_of_measure || "—"}
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeRecipeItem(index)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={addRecipeItem}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Material</span>
                  </button>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsRecipeModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRecipe}
                      disabled={savingRecipe || !selectedProductId}
                      className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <Save className="w-4 h-4" />
                      {savingRecipe ? "Saving..." : "Save Recipe"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
