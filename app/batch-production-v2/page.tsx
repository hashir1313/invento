"use client";

import { useState, useEffect } from "react";
import { getProducts, getRawMaterials, produceBatchV2 } from "../actions";
import {
  FlaskConical,
  Package,
  Droplets,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
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

  // Maceration state
  const [macerationDays, setMacerationDays] = useState<number>(0);

  // Material selections
  const [oilMaterialId, setOilMaterialId] = useState("");
  const [ethanolMaterialId, setEthanolMaterialId] = useState("");
  const [bottleMaterialId, setBottleMaterialId] = useState("");
  const [boxMaterialId, setBoxMaterialId] = useState("");
  const [stickerMaterialId, setStickerMaterialId] = useState("");

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
    const stickers = mats.filter((m) => m.category === "STICKER");

    if (oils.length > 0) setOilMaterialId(oils[0].id);
    if (solvents.length > 0) setEthanolMaterialId(solvents[0].id);
    if (bottles.length > 0) setBottleMaterialId(bottles[0].id);
    if (boxes.length > 0) setBoxMaterialId(boxes[0].id);
    if (stickers.length > 0) setStickerMaterialId(stickers[0].id);

    setLoading(false);
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const oils = rawMaterials.filter((m) => m.category === "OIL");
  const solvents = rawMaterials.filter((m) => m.category === "SOLVENT");
  const bottles = rawMaterials.filter((m) => m.category === "BOTTLE");
  const boxes = rawMaterials.filter((m) => m.category === "BOX");
  const stickers = rawMaterials.filter((m) => m.category === "STICKER");

  // Auto-calculate
  const totalMl =
    productionMode === "bottle"
      ? (Number(quantity) || 0) * (selectedProduct?.perfume_quantity_ml || 0)
      : Number(quantity) || 0;

  const oilGrams = totalMl * ((Number(concentration) || 0) / 100);
  const ethanolMl = totalMl - oilGrams;

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
  const stickerMat = stickers.find((m) => m.id === stickerMaterialId);

  const oilInsufficient = oilMaterial && oilMaterial.current_stock < oilGrams;
  const ethanolInsufficient = ethanolMaterial && ethanolMaterial.current_stock < ethanolMl;
  const bottleInsufficient = bottleMat && bottlesProduced > 0 && bottleMat.current_stock < bottlesProduced;
  const boxInsufficient = boxMat && bottlesProduced > 0 && boxMat.current_stock < bottlesProduced;
  const stickerInsufficient = stickerMat && bottlesProduced > 0 && stickerMat.current_stock < bottlesProduced;

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
    !boxInsufficient &&
    !stickerInsufficient;

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
        sticker_material_id: stickerMaterialId || undefined,
        maceration_days: macerationDays,
      });

      if (res.success) {
        const r = res.result as any;
        const macerationMsg = macerationDays > 0
          ? `\nMaceration: ${macerationDays} days — product will not be in stock yet.`
          : `\n${r.bottlesProduced} bottle(s) added to available stock.`;
        alert(
          `Success! Produced ${r.bottlesProduced} bottle(s) of ${selectedProduct?.name}.\n` +
            `Total: ${r.totalMl}ml (${r.oilNeeded}g oil + ${r.ethanolNeeded}ml ethanol)` +
            macerationMsg
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
      <div>
        <p className="eyebrow mb-3">Production / Batch Production</p>
        <h1 className="text-h2 text-ink flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-mute" />
          <span>Batch Production</span>
        </h1>
        <p className="text-body text-sm mt-2 max-w-xl">
          Select a perfume, choose production mode, set concentration — oil and ethanol are calculated automatically.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-hairline border-t-ink rounded-full mx-auto mb-3"></div>
          <p className="text-mute text-sm">Loading...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 card border-dashed">
          <Package className="w-12 h-12 text-faint mx-auto mb-3" />
          <h3 className="text-h3">No Products Available</h3>
          <p className="text-body text-sm mt-1">Add perfume products first.</p>
        </div>
      ) : (
        <form onSubmit={handleProduce} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Select Perfume */}
            <div className="card space-y-4">
              <h2 className="eyebrow flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>1. Select Perfume</span>
              </h2>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="input"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.perfume_quantity_ml}ml — Stock: {p.stock} bottles
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Production Mode + Quantity + Concentration */}
            <div className="card space-y-4">
              <h2 className="eyebrow flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>2. Production Settings</span>
              </h2>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProductionMode("bottle")}
                  className={`p-4 rounded-md border-2 text-left transition-all ${
                    productionMode === "bottle"
                      ? "border-ink bg-elevated shadow-whisper"
                      : "border-hairline bg-elevated hover:border-mute"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Package
                      className={`w-5 h-5 ${productionMode === "bottle" ? "text-ink" : "text-mute"}`}
                    />
                    <span
                      className={`text-sm font-semibold ${productionMode === "bottle" ? "text-ink" : "text-body"}`}
                    >
                      Bottle Production
                    </span>
                  </div>
                  <p className="text-xs text-mute">Produce a specific number of bottles (pieces)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setProductionMode("mass")}
                  className={`p-4 rounded-md border-2 text-left transition-all ${
                    productionMode === "mass"
                      ? "border-ink bg-elevated shadow-whisper"
                      : "border-hairline bg-elevated hover:border-mute"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets
                      className={`w-5 h-5 ${productionMode === "mass" ? "text-ink" : "text-mute"}`}
                    />
                    <span
                      className={`text-sm font-semibold ${productionMode === "mass" ? "text-ink" : "text-body"}`}
                    >
                      Mass Production
                    </span>
                  </div>
                  <p className="text-xs text-mute">Produce perfume in bulk milliliters (ml)</p>
                </button>
              </div>

              {/* Quantity + Concentration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">
                    {productionMode === "bottle" ? "Number of Bottles (pcs)" : "Total Volume (ml)"} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="input tabular-nums"
                  />
                </div>
                <div>
                  <label className="field-label">
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
                    className="input tabular-nums"
                  />
                  <p className="text-xs text-mute mt-1">
                    {concentration}% oil, {100 - concentration}% ethanol
                  </p>
                </div>
              </div>

              {/* Maceration Period */}
              <div className="border-t border-hairline pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-mute" />
                  <label className="eyebrow">
                    Maceration Period (Days)
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={macerationDays}
                    onChange={(e) => setMacerationDays(Number(e.target.value))}
                    className="flex-1 h-2 bg-hairline rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="w-20 well px-3 py-2 text-center">
                    <span className="text-lg font-semibold tabular-nums text-ink">{macerationDays}</span>
                    <span className="text-[10px] text-mute block">days</span>
                  </div>
                </div>
                <p className="text-xs text-mute mt-2">
                  {macerationDays === 0
                    ? "No maceration — product goes directly to available stock"
                    : `Product will macerate for ${macerationDays} day${macerationDays !== 1 ? "s" : ""} before becoming available`}
                </p>
              </div>
            </div>

            {/* 3. Auto-Calculated Ingredients */}
            <div className="card space-y-4">
              <h2 className="eyebrow flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                <span>3. Auto-Calculated Ingredients</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="well p-4">
                  <span className="eyebrow block mb-1">Fragrance Oil Needed</span>
                  <span className={`text-2xl font-semibold tabular-nums ${oilInsufficient ? "text-error" : "text-ink"}`}>
                    {oilGrams} g
                  </span>
                  {oilMaterial && (
                    <p className={`text-xs mt-1 ${oilInsufficient ? "text-error" : "text-mute"}`}>
                      Available: {oilMaterial.current_stock} g
                      {oilInsufficient && " — INSUFFICIENT"}
                    </p>
                  )}
                </div>
                <div className="well p-4">
                  <span className="eyebrow block mb-1">Ethanol Needed</span>
                  <span
                    className={`text-2xl font-semibold tabular-nums ${ethanolInsufficient ? "text-error" : "text-ink"}`}
                  >
                    {ethanolMl} ml
                  </span>
                  {ethanolMaterial && (
                    <p className={`text-xs mt-1 ${ethanolInsufficient ? "text-error" : "text-mute"}`}>
                      Available: {ethanolMaterial.current_stock} ml
                      {ethanolInsufficient && " — INSUFFICIENT"}
                    </p>
                  )}
                </div>
              </div>

              {productionMode === "mass" && selectedProduct && (
                <p className="text-xs text-mute">
                  From {totalMl}ml of {selectedProduct.perfume_quantity_ml}ml perfume ={" "}
                  <strong className="text-ink font-semibold">{bottlesProduced} full bottles</strong> produced
                </p>
              )}
            </div>

            {/* 4. Material Selection */}
            <div className="card space-y-4">
              <h2 className="eyebrow flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                <span>4. Select Materials</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Fragrance Oil *</label>
                  <select
                    value={oilMaterialId}
                    onChange={(e) => setOilMaterialId(e.target.value)}
                    className="input"
                  >
                    {oils.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.current_stock} g)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">
                    Solvent / Ethanol *
                  </label>
                  <select
                    value={ethanolMaterialId}
                    onChange={(e) => setEthanolMaterialId(e.target.value)}
                    className="input"
                  >
                    {solvents.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.current_stock} ml)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">Glass Bottle</label>
                  <select
                    value={bottleMaterialId}
                    onChange={(e) => setBottleMaterialId(e.target.value)}
                    className="input"
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
                  <label className="field-label">Packaging Box</label>
                  <select
                    value={boxMaterialId}
                    onChange={(e) => setBoxMaterialId(e.target.value)}
                    className="input"
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

                <div>
                  <label className="field-label">Packaging Sticker</label>
                  <select
                    value={stickerMaterialId}
                    onChange={(e) => setStickerMaterialId(e.target.value)}
                    className="input"
                  >
                    <option value="">— None —</option>
                    {stickers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.current_stock} pcs)
                        {stickerMat?.id === m.id && bottlesProduced > 0 && m.current_stock < bottlesProduced
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
              className="btn btn-primary w-full"
            >
              {macerationDays > 0 ? (
                <>
                  <Clock className="w-5 h-5" />
                  {submitting
                    ? "Producing..."
                    : `Produce & Start Maceration (${macerationDays} days)`}
                </>
              ) : (
                <>
                  <FlaskConical className="w-5 h-5" />
                  {submitting
                    ? "Producing..."
                    : `Produce ${bottlesProduced} Bottle${bottlesProduced !== 1 ? "s" : ""} (+${bottlesProduced} Stock)`}
                </>
              )}
            </button>
          </div>

          {/* Summary Sidebar */}
          <div className="card space-y-4 h-fit">
            <h3 className="text-h3 flex items-center gap-2 border-b border-hairline pb-3">
              <Zap className="w-5 h-5 text-mute" />
              <span>Production Summary</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="well p-3 flex justify-between items-center">
                <span className="text-xs text-mute">Perfume</span>
                <span className="font-medium text-ink text-right text-xs">
                  {selectedProduct?.name || "—"}
                </span>
              </div>

              <div className="well p-3 flex justify-between items-center">
                <span className="text-xs text-mute">Mode</span>
                <span className="font-medium text-ink text-xs">
                  {productionMode === "bottle" ? "Bottle (pcs)" : "Mass (ml)"}
                </span>
              </div>

              <div className="well p-3 flex justify-between items-center">
                <span className="text-xs text-mute">
                  {productionMode === "bottle" ? "Bottles" : "Volume"}
                </span>
                <span className="font-medium tabular-nums text-ink text-xs">
                  {quantity} {productionMode === "bottle" ? "pcs" : "ml"}
                </span>
              </div>

              <div className="well p-3 flex justify-between items-center">
                <span className="text-xs text-mute">Concentration</span>
                <span className="font-medium tabular-nums text-ink text-xs">{concentration}%</span>
              </div>

              <div className="border-t border-hairline pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-mute">Total Perfume Volume</span>
                  <span className="text-sm font-semibold tabular-nums text-ink">{totalMl} ml</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-mute">Oil Required</span>
                  <span className={`text-sm font-semibold tabular-nums ${oilInsufficient ? "text-error" : "text-ink"}`}>
                    {oilGrams} g
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-mute">Ethanol Required</span>
                  <span className={`text-sm font-semibold tabular-nums ${ethanolInsufficient ? "text-error" : "text-ink"}`}>
                    {ethanolMl} ml
                  </span>
                </div>
                {bottleMaterialId && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-mute">Bottles Needed</span>
                    <span className={`text-sm font-semibold tabular-nums ${bottleInsufficient ? "text-error" : "text-ink"}`}>
                      {bottlesProduced} pcs
                    </span>
                  </div>
                )}
                {boxMaterialId && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-mute">Boxes Needed</span>
                    <span className={`text-sm font-semibold tabular-nums ${boxInsufficient ? "text-error" : "text-ink"}`}>
                      {bottlesProduced} pcs
                    </span>
                  </div>
                )}
                {stickerMaterialId && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-mute">Stickers Needed</span>
                    <span className={`text-sm font-semibold tabular-nums ${stickerInsufficient ? "text-error" : "text-ink"}`}>
                      {bottlesProduced} pcs
                    </span>
                  </div>
                )}
              </div>

              <div className="card p-4 mt-2">
                <span className="badge badge-success">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{macerationDays > 0 ? "Maceration" : "Stock Output"}</span>
                </span>
                <p className="text-sm font-semibold text-ink mt-2">
                  {macerationDays > 0
                    ? `${bottlesProduced} bottle${bottlesProduced !== 1 ? "s" : ""} will macerate for ${macerationDays} day${macerationDays !== 1 ? "s" : ""}`
                    : `+${bottlesProduced} bottle${bottlesProduced !== 1 ? "s" : ""} of ${selectedProduct?.name || "—"}`
                  }
                </p>
                {macerationDays > 0 && (
                  <p className="text-xs text-mute mt-1">
                    Product will not be available for sale until maceration ends
                  </p>
                )}
              </div>

              {(oilInsufficient || ethanolInsufficient || bottleInsufficient || boxInsufficient || stickerInsufficient) && (
                <div className="card p-4 border-error/30">
                  <span className="badge badge-error h-auto py-1 whitespace-normal text-left">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Insufficient stock for one or more materials
                  </span>
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
