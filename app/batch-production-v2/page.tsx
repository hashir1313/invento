"use client";

import { useState, useEffect } from "react";
import { getProducts, getRawMaterials, produceBatchV2 } from "../actions";
import { formatPKR } from "@/lib/utils";
import {
  FlaskConical,
  Package,
  Droplets,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

export default function BatchProductionV2Page() {
  const [products, setProducts] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productionMode, setProductionMode] = useState<"bottle" | "mass">("bottle");
  const [quantity, setQuantity] = useState<number>(10);
  const [concentration, setConcentration] = useState<number>(40);

  // Material selections
  const [oilMaterialId, setOilMaterialId] = useState("");
  const [ethanolMaterialId, setEthanolMaterialId] = useState("");
  const [bottleMaterialId, setBottleMaterialId] = useState("");
  const [boxMaterialId, setBoxMaterialId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [prods, mats] = await Promise.all([getProducts(), getRawMaterials()]);
    setProducts(prods);
    setRawMaterials(mats);

    if (prods.length > 0) setSelectedProductId(prods[0].id);

    const oils = mats.filter((m) => m.category === "OIL");
    const solvents = mats.filter((m) => m.category === "SOLVENT");
    const bottles = mats.filter((m) => m.category === "BOTTLE");
    const boxes = mats.filter((m) => m.category === "BOX");

    if (oils.length > 0) setOilMaterialId(oils[0].id);
    if (solvents.length > 0) setEthanolMaterialId(solvents[0].id);
    if (bottles.length > 0) setBottleMaterialId(bottles[0].id);
    if (boxes.length > 0) setBoxMaterialId(boxes[0].id);

    setLoading(false);
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const oils = rawMaterials.filter((m) => m.category === "OIL");
  const solvents = rawMaterials.filter((m) => m.category === "SOLVENT");
  const bottles = rawMaterials.filter((m) => m.category === "BOTTLE");
  const boxes = rawMaterials.filter((m) => m.category === "BOX");

  // Auto-calculate
  const totalMl =
    productionMode === "bottle"
      ? (Number(quantity) || 0) * (selectedProduct?.perfume_quantity_ml || 0)
      : Number(quantity) || 0;

  const oilMl = totalMl * ((Number(concentration) || 0) / 100);
  const ethanolMl = totalMl - oilMl;

  const bottlesProduced =
    productionMode === "bottle"
      ? Number(quantity) || 0
      : selectedProduct
      ? Math.floor((Number(quantity) || 0) / selectedProduct.perfume_quantity_ml)
      : 0;

  const oilMaterial = oils.find((m) => m.id === oilMaterialId);
  const ethanolMaterial = solvents.find((m) => m.id === ethanolMaterialId);
  const bottleMat = bottles.find((m) => m.id === bottleMaterialId);
  const boxMat = boxes.find((m) => m.id === boxMaterialId);

  const oilInsufficient = oilMaterial && oilMaterial.current_stock < oilMl;
  const ethanolInsufficient = ethanolMaterial && ethanolMaterial.current_stock < ethanolMl;
  const bottleInsufficient = bottleMat && bottlesProduced > 0 && bottleMat.current_stock < bottlesProduced;
  const boxInsufficient = boxMat && bottlesProduced > 0 && boxMat.current_stock < bottlesProduced;

  const canProduce =
    selectedProductId &&
    quantity > 0 &&
    concentration > 0 &&
    concentration < 100 &&
    oilMaterialId &&
    ethanolMaterialId &&
    !oilInsufficient &&
    !ethanolInsufficient &&
    !bottleInsufficient &&
    !boxInsufficient;

  async function handleProduce(e: React.FormEvent) {
    e.preventDefault();
    if (!canProduce) return;

    setSubmitting(true);
    try {
      const res = await produceBatchV2({
        product_id: selectedProductId,
        production_mode: productionMode,
        quantity: Number(quantity),
        concentration: Number(concentration),
        oil_material_id: oilMaterialId,
        ethanol_material_id: ethanolMaterialId,
        bottle_material_id: bottleMaterialId || undefined,
        box_material_id: boxMaterialId || undefined,
      });

      if (res.success) {
        const r = res.result as any;
        alert(
          `Success! Produced ${r.bottlesProduced} bottle(s) of ${selectedProduct?.name}.\n` +
            `Total: ${r.totalMl}ml (${r.oilNeeded}ml oil + ${r.ethanolNeeded}ml ethanol)`
        );
        loadData();
      } else {
        alert(res.error || "Production failed");
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-amber-400" />
          <span>Batch Production</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Select a perfume, choose production mode, set concentration — oil and ethanol are calculated automatically.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Products Available</h3>
          <p className="text-slate-400 text-sm">Add perfume products first.</p>
        </div>
      ) : (
        <form onSubmit={handleProduce} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Select Perfume */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>1. Select Perfume</span>
              </h2>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 font-semibold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.perfume_quantity_ml}ml — Stock: {p.stock} bottles
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Production Mode + Quantity + Concentration */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>2. Production Settings</span>
              </h2>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProductionMode("bottle")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    productionMode === "bottle"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Package
                      className={`w-5 h-5 ${productionMode === "bottle" ? "text-amber-400" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-bold ${productionMode === "bottle" ? "text-white" : "text-slate-300"}`}
                    >
                      Bottle Production
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Produce a specific number of bottles (pieces)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setProductionMode("mass")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    productionMode === "mass"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets
                      className={`w-5 h-5 ${productionMode === "mass" ? "text-amber-400" : "text-slate-400"}`}
                    />
                    <span
                      className={`text-sm font-bold ${productionMode === "mass" ? "text-white" : "text-slate-300"}`}
                    >
                      Mass Production
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Produce perfume in bulk milliliters (ml)</p>
                </button>
              </div>

              {/* Quantity + Concentration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {productionMode === "bottle" ? "Number of Bottles (pcs)" : "Total Volume (ml)"} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Concentration (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="99"
                    step="1"
                    value={concentration}
                    onChange={(e) => setConcentration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 font-bold text-lg"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {concentration}% oil, {100 - concentration}% ethanol
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Auto-Calculated Ingredients */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                <span>3. Auto-Calculated Ingredients</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block mb-1">Fragrance Oil Needed</span>
                  <span className={`text-2xl font-extrabold ${oilInsufficient ? "text-rose-400" : "text-amber-300"}`}>
                    {oilMl.toFixed(1)} ml
                  </span>
                  {oilMaterial && (
                    <p className={`text-[11px] mt-1 ${oilInsufficient ? "text-rose-400" : "text-slate-500"}`}>
                      Available: {oilMaterial.current_stock} ml
                      {oilInsufficient && " — INSUFFICIENT"}
                    </p>
                  )}
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block mb-1">Ethanol Needed</span>
                  <span
                    className={`text-2xl font-extrabold ${ethanolInsufficient ? "text-rose-400" : "text-amber-300"}`}
                  >
                    {ethanolMl.toFixed(1)} ml
                  </span>
                  {ethanolMaterial && (
                    <p className={`text-[11px] mt-1 ${ethanolInsufficient ? "text-rose-400" : "text-slate-500"}`}>
                      Available: {ethanolMaterial.current_stock} ml
                      {ethanolInsufficient && " — INSUFFICIENT"}
                    </p>
                  )}
                </div>
              </div>

              {productionMode === "mass" && selectedProduct && (
                <p className="text-xs text-slate-400">
                  From {totalMl}ml of {selectedProduct.perfume_quantity_ml}ml perfume ={" "}
                  <strong className="text-white">{bottlesProduced} full bottles</strong> produced
                </p>
              )}
            </div>

            {/* 4. Material Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                <span>4. Select Materials</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Fragrance Oil *</label>
                  <select
                    value={oilMaterialId}
                    onChange={(e) => setOilMaterialId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    {oils.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.current_stock} ml)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Solvent / Ethanol *
                  </label>
                  <select
                    value={ethanolMaterialId}
                    onChange={(e) => setEthanolMaterialId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    {solvents.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.current_stock} ml)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Glass Bottle</label>
                  <select
                    value={bottleMaterialId}
                    onChange={(e) => setBottleMaterialId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">— None —</option>
                    {bottles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.current_stock} pcs)
                        {bottleMat?.id === m.id && bottlesProduced > 0 && m.current_stock < bottlesProduced
                          ? " — LOW"
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Packaging Box</label>
                  <select
                    value={boxMaterialId}
                    onChange={(e) => setBoxMaterialId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="">— None —</option>
                    {boxes.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.current_stock} pcs)
                        {boxMat?.id === m.id && bottlesProduced > 0 && m.current_stock < bottlesProduced
                          ? " — LOW"
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Produce Button */}
            <button
              type="submit"
              disabled={submitting || !canProduce}
              className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <FlaskConical className="w-5 h-5" />
              {submitting
                ? "Producing..."
                : `Produce ${bottlesProduced} Bottle${bottlesProduced !== 1 ? "s" : ""} (+${bottlesProduced} Stock)`}
            </button>
          </div>

          {/* Summary Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 h-fit">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Production Summary</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Perfume</span>
                <span className="font-bold text-white text-right text-xs">
                  {selectedProduct?.name || "—"}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Mode</span>
                <span className="font-bold text-white text-xs">
                  {productionMode === "bottle" ? "Bottle (pcs)" : "Mass (ml)"}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">
                  {productionMode === "bottle" ? "Bottles" : "Volume"}
                </span>
                <span className="font-bold text-white text-xs">
                  {quantity} {productionMode === "bottle" ? "pcs" : "ml"}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Concentration</span>
                <span className="font-bold text-white text-xs">{concentration}%</span>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Total Perfume Volume</span>
                  <span className="font-bold text-amber-300">{totalMl} ml</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Oil Required</span>
                  <span className={`font-bold ${oilInsufficient ? "text-rose-400" : "text-amber-300"}`}>
                    {oilMl.toFixed(1)} ml
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Ethanol Required</span>
                  <span className={`font-bold ${ethanolInsufficient ? "text-rose-400" : "text-amber-300"}`}>
                    {ethanolMl.toFixed(1)} ml
                  </span>
                </div>
                {bottleMaterialId && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Bottles Needed</span>
                    <span className={`font-bold ${bottleInsufficient ? "text-rose-400" : "text-amber-300"}`}>
                      {bottlesProduced} pcs
                    </span>
                  </div>
                )}
                {boxMaterialId && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">Boxes Needed</span>
                    <span className={`font-bold ${boxInsufficient ? "text-rose-400" : "text-amber-300"}`}>
                      {bottlesProduced} pcs
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/60 mt-2">
                <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Stock Output</span>
                </p>
                <p className="text-sm font-extrabold text-white mt-1">
                  +{bottlesProduced} bottle{bottlesProduced !== 1 ? "s" : ""} of {selectedProduct?.name || "—"}
                </p>
              </div>

              {(oilInsufficient || ethanolInsufficient || bottleInsufficient || boxInsufficient) && (
                <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-900/60">
                  <p className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Insufficient stock for one or more materials</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
