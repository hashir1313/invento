"use client";

import { useState, useEffect } from "react";
import {
  getProducts,
  getRawMaterials,
  produceBatchV2,
  blendBulkFragrance,
  bottleProductFromFragrance,
  getRecipesForProduct,
} from "../actions";
import { formatPKR } from "@/lib/utils";
import {
  FlaskConical,
  Package,
  Droplets,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";

export default function BatchProductionV2Page() {
  const [products, setProducts] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Active top-level workflow tab
  const [activeTab, setActiveTab] = useState<"bottle_from_fragrance" | "blend_fragrance" | "all_in_one">(
    "bottle_from_fragrance"
  );

  // ----------------------------------------------------
  // TAB 1: BOTTLE FROM PREPARED FRAGRANCE (STAGE 2)
  // ----------------------------------------------------
  const [bottleProductId, setBottleProductId] = useState("");
  const [bottleFragranceId, setBottleFragranceId] = useState("");
  const [bottleCount, setBottleCount] = useState<number>(5);
  const [bottleGlassId, setBottleGlassId] = useState("");
  const [bottleCapId, setBottleCapId] = useState("");
  const [bottleBoxId, setBottleBoxId] = useState("");
  const [bottleStickerId, setBottleStickerId] = useState("");
  const [saveAsRecipe, setSaveAsRecipe] = useState(true);
  const [bottlingNotes, setBottlingNotes] = useState("");

  // ----------------------------------------------------
  // TAB 2: BLEND BULK FRAGRANCE LIQUID (STAGE 1)
  // ----------------------------------------------------
  const [blendOilId, setBlendOilId] = useState("");
  const [blendSolventId, setBlendSolventId] = useState("");
  const [blendTotalMl, setBlendTotalMl] = useState<number>(500);
  const [blendConcentration, setBlendConcentration] = useState<number>(30);
  const [blendDestinationMode, setBlendDestinationMode] = useState<"existing" | "new">("new");
  const [blendTargetMaterialId, setBlendTargetMaterialId] = useState("");
  const [blendNewFragranceName, setBlendNewFragranceName] = useState("");
  const [blendMacerationDays, setBlendMacerationDays] = useState<number>(0);
  const [blendNotes, setBlendNotes] = useState("");

  // ----------------------------------------------------
  // TAB 3: DIRECT ALL-IN-ONE (LEGACY)
  // ----------------------------------------------------
  const [directProductId, setDirectProductId] = useState("");
  const [directMode, setDirectMode] = useState<"bottle" | "mass">("bottle");
  const [directQuantity, setDirectQuantity] = useState<number>(10);
  const [directConcentration, setDirectConcentration] = useState<number>(40);
  const [directMacerationDays, setDirectMacerationDays] = useState<number>(0);
  const [directOilId, setDirectOilId] = useState("");
  const [directEthanolId, setDirectEthanolId] = useState("");
  const [directBottleId, setDirectBottleId] = useState("");
  const [directBoxId, setDirectBoxId] = useState("");
  const [directStickerId, setDirectStickerId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [prods, mats] = await Promise.all([getProducts(), getRawMaterials()]);
    setProducts(prods);
    setRawMaterials(mats);

    if (prods.length > 0) {
      setBottleProductId(prods[0].id);
      setDirectProductId(prods[0].id);
    }

    const oils = mats.filter((m) => m.category === "OIL");
    const solvents = mats.filter((m) => m.category === "SOLVENT");
    const preparedFragrances = mats.filter((m) => m.category === "PREPARED_FRAGRANCE");
    const bottles = mats.filter((m) => m.category === "BOTTLE");
    const caps = mats.filter((m) => m.category === "CAP_SPRAY");
    const boxes = mats.filter((m) => m.category === "BOX");
    const stickers = mats.filter((m) => m.category === "STICKER");

    // Initialize Tab 1 (Bottle from Fragrance)
    if (preparedFragrances.length > 0) setBottleFragranceId(preparedFragrances[0].id);
    if (bottles.length > 0) setBottleGlassId(bottles[0].id);
    if (caps.length > 0) setBottleCapId(caps[0].id);
    if (boxes.length > 0) setBottleBoxId(boxes[0].id);
    if (stickers.length > 0) setBottleStickerId(stickers[0].id);

    // Initialize Tab 2 (Blend Fragrance)
    if (oils.length > 0) setBlendOilId(oils[0].id);
    if (solvents.length > 0) setBlendSolventId(solvents[0].id);
    if (preparedFragrances.length > 0) {
      setBlendTargetMaterialId(preparedFragrances[0].id);
      setBlendDestinationMode("existing");
    } else {
      setBlendDestinationMode("new");
      setBlendNewFragranceName("Prepared Fragrance Blend");
    }

    // Initialize Tab 3 (Direct All-in-one)
    if (oils.length > 0) setDirectOilId(oils[0].id);
    if (solvents.length > 0) setDirectEthanolId(solvents[0].id);
    if (bottles.length > 0) setDirectBottleId(bottles[0].id);
    if (boxes.length > 0) setDirectBoxId(boxes[0].id);
    if (stickers.length > 0) setDirectStickerId(stickers[0].id);

    setLoading(false);
  }

  // Load recipe when changing product in Tab 1
  useEffect(() => {
    if (!bottleProductId) return;
    async function loadRecipe() {
      const recipes = await getRecipesForProduct(bottleProductId);
      if (recipes && recipes.length > 0) {
        for (const r of recipes) {
          const mat = r.raw_material;
          if (!mat) continue;
          if (mat.category === "PREPARED_FRAGRANCE") setBottleFragranceId(mat.id);
          else if (mat.category === "BOTTLE") setBottleGlassId(mat.id);
          else if (mat.category === "CAP_SPRAY") setBottleCapId(mat.id);
          else if (mat.category === "BOX") setBottleBoxId(mat.id);
          else if (mat.category === "STICKER") setBottleStickerId(mat.id);
        }
      }
    }
    loadRecipe();
  }, [bottleProductId]);

  // Derived filtered materials
  const oils = rawMaterials.filter((m) => m.category === "OIL");
  const solvents = rawMaterials.filter((m) => m.category === "SOLVENT");
  const preparedFragrances = rawMaterials.filter((m) => m.category === "PREPARED_FRAGRANCE");
  const bottles = rawMaterials.filter((m) => m.category === "BOTTLE");
  const caps = rawMaterials.filter((m) => m.category === "CAP_SPRAY");
  const boxes = rawMaterials.filter((m) => m.category === "BOX");
  const stickers = rawMaterials.filter((m) => m.category === "STICKER");

  // --------------------------------------------------------------------------
  // CALCULATIONS: TAB 1 (BOTTLE FROM FRAGRANCE)
  // --------------------------------------------------------------------------
  const selectedBottleProduct = products.find((p) => p.id === bottleProductId);
  const selectedFragranceMat = preparedFragrances.find((m) => m.id === bottleFragranceId);
  const selectedGlassMat = bottles.find((m) => m.id === bottleGlassId);
  const selectedCapMat = caps.find((m) => m.id === bottleCapId);
  const selectedBoxMat = boxes.find((m) => m.id === bottleBoxId);
  const selectedStickerMat = stickers.find((m) => m.id === bottleStickerId);

  const bottleVolumeMl = selectedBottleProduct?.perfume_quantity_ml || 50;
  const totalFragranceMlNeeded = Math.max(1, bottleCount) * bottleVolumeMl;

  const isFragranceInsufficient =
    selectedFragranceMat && selectedFragranceMat.current_stock < totalFragranceMlNeeded;
  const isBottleGlassInsufficient =
    selectedGlassMat && bottleCount > 0 && selectedGlassMat.current_stock < bottleCount;
  const isCapInsufficient =
    selectedCapMat && bottleCount > 0 && selectedCapMat.current_stock < bottleCount;
  const isBoxInsufficient =
    selectedBoxMat && bottleCount > 0 && selectedBoxMat.current_stock < bottleCount;
  const isStickerInsufficient =
    selectedStickerMat && bottleCount > 0 && selectedStickerMat.current_stock < bottleCount;

  const fragranceUnitCost = bottleVolumeMl * (selectedFragranceMat?.cost_per_unit || 0);
  const packagingUnitCost =
    (selectedGlassMat?.cost_per_unit || 0) +
    (selectedCapMat?.cost_per_unit || 0) +
    (selectedBoxMat?.cost_per_unit || 0) +
    (selectedStickerMat?.cost_per_unit || 0);
  const calculatedMakingCost = Math.round((fragranceUnitCost + packagingUnitCost) * 100) / 100;
  const totalBottlingBatchCost = calculatedMakingCost * Math.max(1, bottleCount);

  const canBottle =
    Boolean(bottleProductId) &&
    Boolean(bottleFragranceId) &&
    bottleCount > 0 &&
    !isFragranceInsufficient &&
    !isBottleGlassInsufficient &&
    !isCapInsufficient &&
    !isBoxInsufficient &&
    !isStickerInsufficient;

  async function handleBottleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canBottle) return;

    setSubmitting(true);
    try {
      const res = await bottleProductFromFragrance({
        product_id: bottleProductId,
        fragrance_material_id: bottleFragranceId,
        bottle_count: bottleCount,
        bottle_material_id: bottleGlassId || undefined,
        cap_material_id: bottleCapId || undefined,
        box_material_id: bottleBoxId || undefined,
        sticker_material_id: bottleStickerId || undefined,
        save_as_recipe: saveAsRecipe,
        notes: bottlingNotes.trim() || undefined,
      });

      if (res.success) {
        alert(
          `Success! Produced ${bottleCount} bottle(s) of "${selectedBottleProduct?.name}".\n` +
            `Deducted ${totalFragranceMlNeeded}ml of prepared fragrance and packaging items.\n` +
            `Stock increased by +${bottleCount} ready bottles.`
        );
        setBottlingNotes("");
        loadData();
      } else {
        alert(res.error || "Bottling failed");
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------------------------------
  // CALCULATIONS: TAB 2 (BLEND BULK FRAGRANCE)
  // --------------------------------------------------------------------------
  const selectedOilMat = oils.find((m) => m.id === blendOilId);
  const selectedSolventMat = solvents.find((m) => m.id === blendSolventId);

  const blendOilGrams = blendTotalMl * (blendConcentration / 100);
  const blendEthanolMl = blendTotalMl - blendOilGrams;

  const isBlendOilInsufficient = selectedOilMat && selectedOilMat.current_stock < blendOilGrams;
  const isBlendSolventInsufficient =
    selectedSolventMat && selectedSolventMat.current_stock < blendEthanolMl;

  const blendOilCost = blendOilGrams * (selectedOilMat?.cost_per_unit || 0);
  const blendSolventCost = blendEthanolMl * (selectedSolventMat?.cost_per_unit || 0);
  const blendTotalCost = blendOilCost + blendSolventCost;
  const blendCostPerMl = blendTotalMl > 0 ? Math.round((blendTotalCost / blendTotalMl) * 100) / 100 : 0;

  const canBlend =
    blendTotalMl > 0 &&
    blendConcentration > 0 &&
    blendConcentration < 100 &&
    Boolean(blendOilId) &&
    Boolean(blendSolventId) &&
    !isBlendOilInsufficient &&
    !isBlendSolventInsufficient &&
    (blendDestinationMode === "existing" ? Boolean(blendTargetMaterialId) : Boolean(blendNewFragranceName.trim()));

  async function handleBlendSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canBlend) return;

    setSubmitting(true);
    try {
      const res = await blendBulkFragrance({
        raw_material_id: blendDestinationMode === "existing" ? blendTargetMaterialId : undefined,
        new_fragrance_name: blendDestinationMode === "new" ? blendNewFragranceName.trim() : undefined,
        total_ml: blendTotalMl,
        concentration: blendConcentration,
        oil_material_id: blendOilId,
        ethanol_material_id: blendSolventId,
        maceration_days: blendMacerationDays,
        notes: blendNotes.trim() || undefined,
      });

      if (res.success) {
        const destName =
          blendDestinationMode === "existing"
            ? preparedFragrances.find((m) => m.id === blendTargetMaterialId)?.name
            : blendNewFragranceName;
        const macerationMsg =
          blendMacerationDays > 0
            ? `\nBulk Maceration: ${blendMacerationDays} days — tracking under /maceration.`
            : `\nAdded directly to "${destName}" inventory (${blendTotalMl} ml).`;

        alert(
          `Success! Blended ${blendTotalMl}ml fragrance liquid at ${blendConcentration}% concentration.\n` +
            `Consumed ${blendOilGrams.toFixed(1)}g oil + ${blendEthanolMl.toFixed(1)}ml solvent.\n` +
            `Unit Cost: ${formatPKR(blendCostPerMl)}/ml.` +
            macerationMsg
        );
        setBlendNotes("");
        if (blendDestinationMode === "new") setBlendNewFragranceName("");
        loadData();
      } else {
        alert(res.error || "Fragrance blending failed");
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------------------------------
  // CALCULATIONS: TAB 3 (DIRECT ALL-IN-ONE)
  // --------------------------------------------------------------------------
  const selectedDirectProduct = products.find((p) => p.id === directProductId);
  const directTotalMl =
    directMode === "bottle"
      ? (Number(directQuantity) || 0) * (selectedDirectProduct?.perfume_quantity_ml || 0)
      : Number(directQuantity) || 0;

  const directOilGrams = directTotalMl * ((Number(directConcentration) || 0) / 100);
  const directEthanolMl = directTotalMl - directOilGrams;

  const directBottlesProduced =
    directMode === "bottle"
      ? Number(directQuantity) || 0
      : selectedDirectProduct
      ? Math.floor((Number(directQuantity) || 0) / selectedDirectProduct.perfume_quantity_ml)
      : 0;

  const directOilMat = oils.find((m) => m.id === directOilId);
  const directEthanolMat = solvents.find((m) => m.id === directEthanolId);
  const directBottleMat = bottles.find((m) => m.id === directBottleId);
  const directBoxMat = boxes.find((m) => m.id === directBoxId);
  const directStickerMat = stickers.find((m) => m.id === directStickerId);

  const directOilInsufficient = directOilMat && directOilMat.current_stock < directOilGrams;
  const directEthanolInsufficient = directEthanolMat && directEthanolMat.current_stock < directEthanolMl;
  const directBottleInsufficient =
    directBottleMat && directBottlesProduced > 0 && directBottleMat.current_stock < directBottlesProduced;
  const directBoxInsufficient =
    directBoxMat && directBottlesProduced > 0 && directBoxMat.current_stock < directBottlesProduced;
  const directStickerInsufficient =
    directStickerMat && directBottlesProduced > 0 && directStickerMat.current_stock < directBottlesProduced;

  const canProduceDirect =
    directProductId &&
    directQuantity > 0 &&
    directConcentration > 0 &&
    directConcentration < 100 &&
    directOilId &&
    directEthanolId &&
    !directOilInsufficient &&
    !directEthanolInsufficient &&
    !directBottleInsufficient &&
    !directBoxInsufficient &&
    !directStickerInsufficient;

  async function handleDirectProduce(e: React.FormEvent) {
    e.preventDefault();
    if (!canProduceDirect) return;

    setSubmitting(true);
    try {
      const res = await produceBatchV2({
        product_id: directProductId,
        production_mode: directMode,
        quantity: Number(directQuantity),
        concentration: Number(directConcentration),
        oil_material_id: directOilId,
        ethanol_material_id: directEthanolId,
        bottle_material_id: directBottleId || undefined,
        box_material_id: directBoxId || undefined,
        sticker_material_id: directStickerId || undefined,
        maceration_days: directMacerationDays,
      });

      if (res.success) {
        const r = res.result as any;
        const macerationMsg =
          directMacerationDays > 0
            ? `\nMaceration: ${directMacerationDays} days — product will not be in stock yet.`
            : `\n${r.bottlesProduced} bottle(s) added to available stock.`;
        alert(
          `Success! Produced ${r.bottlesProduced} bottle(s) of ${selectedDirectProduct?.name}.\n` +
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
        <p className="eyebrow mb-2">Manufacturing & Compounding Hub</p>
        <h1 className="text-h2 text-ink flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-mute" />
          <span>Batch Production & Bottling</span>
        </h1>
        <p className="text-body text-sm mt-1 max-w-2xl">
          Blend fragrance oils and ethanol into prepared bulk fragrance liquid, or assemble prepared fragrances
          into bottled & packaged products ready for customer delivery.
        </p>
      </div>

      {/* Top-Level Workflow Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("bottle_from_fragrance")}
          className={`btn btn-sm btn-pill flex items-center gap-2 ${
            activeTab === "bottle_from_fragrance" ? "btn-primary" : "btn-secondary"
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="font-medium">1. Bottle from Fragrance Liquid</span>
          <span className="badge badge-neutral text-[10px] ml-1">Assembly</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("blend_fragrance")}
          className={`btn btn-sm btn-pill flex items-center gap-2 ${
            activeTab === "blend_fragrance" ? "btn-primary" : "btn-secondary"
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span className="font-medium">2. Blend Fragrance Liquid (Bulk)</span>
          <span className="badge badge-neutral text-[10px] ml-1">Compounding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all_in_one")}
          className={`btn btn-sm btn-pill flex items-center gap-2 ${
            activeTab === "all_in_one" ? "btn-primary" : "btn-secondary"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="font-medium">Direct All-In-One</span>
          <span className="text-[10px] text-mute ml-1">(Legacy)</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-hairline border-t-ink rounded-full mx-auto mb-3"></div>
          <p className="text-mute text-sm">Loading production workstation...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 card border-dashed">
          <Package className="w-12 h-12 text-faint mx-auto mb-3" />
          <h3 className="text-h3">No Perfume Products Available</h3>
          <p className="text-body text-sm mt-1">Add perfume products first to start bottling.</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: BOTTLE FROM PREPARED FRAGRANCE                                     */}
          {/* ========================================================================= */}
          {activeTab === "bottle_from_fragrance" && (
            <form onSubmit={handleBottleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {/* Notice if no prepared fragrances exist */}
                {preparedFragrances.length === 0 && (
                  <div className="card p-4 border-warning/40 bg-warning/5 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-ink">No Prepared Fragrances Found</h4>
                      <p className="text-xs text-body mt-0.5">
                        You have not compounded any bulk prepared fragrance blends yet. Use the{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("blend_fragrance")}
                          className="text-ink font-semibold underline"
                        >
                          Blend Fragrance Liquid (Bulk)
                        </button>{" "}
                        tab to mix fragrance oil and solvent first, or restock one in Raw Materials.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. Select Product & Fragrance Blend */}
                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <Package className="w-4 h-4 text-mute" />
                    <span>1. Target Perfume & Fragrance Source</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Target Perfume Product *</label>
                      <select
                        value={bottleProductId}
                        onChange={(e) => setBottleProductId(e.target.value)}
                        className="input"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.perfume_quantity_ml}ml) — Stock: {p.stock} pcs
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Prepared Fragrance Blend *</label>
                      <select
                        value={bottleFragranceId}
                        onChange={(e) => setBottleFragranceId(e.target.value)}
                        className="input"
                      >
                        {preparedFragrances.length === 0 && (
                          <option value="">— No Prepared Fragrances in Stock —</option>
                        )}
                        {preparedFragrances.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} ml available • {formatPKR(m.cost_per_unit)}/ml)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="well p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-mute">
                      Bottle Size: <strong className="text-ink">{bottleVolumeMl} ml</strong>
                    </span>
                    <span className="text-mute">
                      Fragrance Needed per Bottle: <strong className="text-ink">{bottleVolumeMl} ml</strong>
                    </span>
                    <span className="text-mute">
                      Current Finished Stock:{" "}
                      <strong className="text-ink">{selectedBottleProduct?.stock || 0} bottles</strong>
                    </span>
                  </div>
                </div>

                {/* 2. Bottling Quantity */}
                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <Zap className="w-4 h-4 text-mute" />
                    <span>2. Bottling Quantity</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="field-label">Number of Bottles to Pack (pcs) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={bottleCount}
                        onChange={(e) => setBottleCount(Math.max(1, Number(e.target.value)))}
                        className="input tabular-nums"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-5">
                      {[1, 5, 10, 20, 50].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setBottleCount(preset)}
                          className={`btn btn-xs ${
                            bottleCount === preset ? "btn-primary" : "btn-secondary"
                          }`}
                        >
                          {preset} {preset === 1 ? "bottle" : "bottles"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sufficiency metric */}
                  <div className="well p-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-mute block">Total Liquid Required</span>
                      <span
                        className={`text-2xl font-bold tabular-nums ${
                          isFragranceInsufficient ? "text-error" : "text-ink"
                        }`}
                      >
                        {totalFragranceMlNeeded} ml
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-mute block">Fragrance Available</span>
                      <span className="text-sm font-semibold text-ink tabular-nums">
                        {selectedFragranceMat?.current_stock || 0} ml
                      </span>
                      {isFragranceInsufficient && (
                        <span className="badge badge-error block mt-1">INSUFFICIENT LIQUID</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Packaging Materials */}
                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-mute" />
                    <span>3. Packaging Components (1 each per bottle)</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Glass Bottle</label>
                      <select
                        value={bottleGlassId}
                        onChange={(e) => setBottleGlassId(e.target.value)}
                        className="input"
                      >
                        <option value="">— None —</option>
                        {bottles.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} pcs • {formatPKR(m.cost_per_unit)})
                          </option>
                        ))}
                      </select>
                      {isBottleGlassInsufficient && (
                        <p className="text-[11px] text-error mt-1">Insufficient stock for bottles!</p>
                      )}
                    </div>

                    <div>
                      <label className="field-label">Spray Atomizer / Cap</label>
                      <select
                        value={bottleCapId}
                        onChange={(e) => setBottleCapId(e.target.value)}
                        className="input"
                      >
                        <option value="">— None —</option>
                        {caps.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} pcs • {formatPKR(m.cost_per_unit)})
                          </option>
                        ))}
                      </select>
                      {isCapInsufficient && (
                        <p className="text-[11px] text-error mt-1">Insufficient stock for caps!</p>
                      )}
                    </div>

                    <div>
                      <label className="field-label">Packaging Box</label>
                      <select
                        value={bottleBoxId}
                        onChange={(e) => setBottleBoxId(e.target.value)}
                        className="input"
                      >
                        <option value="">— None —</option>
                        {boxes.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} pcs • {formatPKR(m.cost_per_unit)})
                          </option>
                        ))}
                      </select>
                      {isBoxInsufficient && (
                        <p className="text-[11px] text-error mt-1">Insufficient stock for boxes!</p>
                      )}
                    </div>

                    <div>
                      <label className="field-label">Product Sticker / Label</label>
                      <select
                        value={bottleStickerId}
                        onChange={(e) => setBottleStickerId(e.target.value)}
                        className="input"
                      >
                        <option value="">— None —</option>
                        {stickers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} pcs • {formatPKR(m.cost_per_unit)})
                          </option>
                        ))}
                      </select>
                      {isStickerInsufficient && (
                        <p className="text-[11px] text-error mt-1">Insufficient stock for stickers!</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-hairline pt-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-body select-none">
                      <input
                        type="checkbox"
                        checked={saveAsRecipe}
                        onChange={(e) => setSaveAsRecipe(e.target.checked)}
                        className="rounded border-hairline accent-primary"
                      />
                      <span>Save this selection as the default packaging recipe for &ldquo;{selectedBottleProduct?.name}&rdquo;</span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className="card space-y-2">
                  <label className="field-label">Production Batch Notes (Optional)</label>
                  <textarea
                    value={bottlingNotes}
                    onChange={(e) => setBottlingNotes(e.target.value)}
                    rows={2}
                    className="input resize-none"
                    placeholder="e.g. Bottled on demand for weekend rush..."
                  />
                </div>
              </div>

              {/* Sidebar Summary */}
              <div className="card space-y-4 h-fit sticky top-20">
                <h3 className="text-h3 flex items-center gap-2 border-b border-hairline pb-3">
                  <Sparkles className="w-5 h-5 text-mute" />
                  <span>Bottling Summary</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Target Perfume</span>
                    <span className="font-semibold text-ink text-right">
                      {selectedBottleProduct?.name || "—"} ({bottleVolumeMl}ml)
                    </span>
                  </div>

                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Bottles to Produce</span>
                    <span className="font-bold text-ink tabular-nums text-sm">
                      +{bottleCount} pcs
                    </span>
                  </div>

                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Fragrance Liquid Needed</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        isFragranceInsufficient ? "text-error" : "text-ink"
                      }`}
                    >
                      {totalFragranceMlNeeded} ml
                    </span>
                  </div>

                  <div className="border-t border-hairline pt-3 space-y-1.5">
                    <span className="eyebrow block mb-2">Cost Breakdown per Bottle</span>
                    <div className="flex justify-between items-center">
                      <span className="text-mute">Fragrance ({bottleVolumeMl}ml)</span>
                      <span className="tabular-nums font-medium text-ink">
                        {formatPKR(fragranceUnitCost)}
                      </span>
                    </div>
                    {selectedGlassMat && (
                      <div className="flex justify-between items-center">
                        <span className="text-mute">Glass Bottle</span>
                        <span className="tabular-nums text-ink">
                          {formatPKR(selectedGlassMat.cost_per_unit)}
                        </span>
                      </div>
                    )}
                    {selectedCapMat && (
                      <div className="flex justify-between items-center">
                        <span className="text-mute">Cap / Atomizer</span>
                        <span className="tabular-nums text-ink">
                          {formatPKR(selectedCapMat.cost_per_unit)}
                        </span>
                      </div>
                    )}
                    {selectedBoxMat && (
                      <div className="flex justify-between items-center">
                        <span className="text-mute">Packaging Box</span>
                        <span className="tabular-nums text-ink">
                          {formatPKR(selectedBoxMat.cost_per_unit)}
                        </span>
                      </div>
                    )}
                    {selectedStickerMat && (
                      <div className="flex justify-between items-center">
                        <span className="text-mute">Sticker</span>
                        <span className="tabular-nums text-ink">
                          {formatPKR(selectedStickerMat.cost_per_unit)}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-hairline pt-2 flex justify-between items-center font-bold text-sm text-ink">
                      <span>Making Cost / Bottle</span>
                      <span className="tabular-nums text-primary">
                        {formatPKR(calculatedMakingCost)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-mute text-[11px]">
                      <span>Total Batch Cost ({bottleCount}x)</span>
                      <span className="tabular-nums font-medium">
                        {formatPKR(totalBottlingBatchCost)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card p-3 bg-elevated border-hairline">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-ink">Instant Stock Addition</span>
                  </div>
                  <p className="text-[11px] text-mute mt-1">
                    Ready stock will increase by <strong>+{bottleCount}</strong> bottles immediately. No maceration is applied during bottling.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !canBottle}
                  className="btn btn-primary btn-pill w-full h-12 text-sm font-semibold shadow-whisper hover:shadow-float active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>
                    {submitting
                      ? "Bottling..."
                      : `Bottle ${bottleCount} Bottle${bottleCount !== 1 ? "s" : ""} (+${bottleCount} Stock)`}
                  </span>
                </button>

                {!canBottle && (
                  <p className="text-[11px] text-center text-error font-medium">
                    {!bottleProductId
                      ? "Select target perfume"
                      : !bottleFragranceId
                      ? "Select prepared fragrance blend"
                      : isFragranceInsufficient
                      ? "Insufficient fragrance liquid"
                      : isBottleGlassInsufficient || isCapInsufficient || isBoxInsufficient || isStickerInsufficient
                      ? "Insufficient packaging stock"
                      : "Fill required fields to bottle"}
                  </p>
                )}
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BLEND BULK FRAGRANCE LIQUID                                        */}
          {/* ========================================================================= */}
          {activeTab === "blend_fragrance" && (
            <form onSubmit={handleBlendSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {/* 1. Raw Ingredients */}
                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-mute" />
                    <span>1. Raw Ingredients (Oil + Solvent)</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Fragrance Oil *</label>
                      <select
                        value={blendOilId}
                        onChange={(e) => setBlendOilId(e.target.value)}
                        className="input"
                      >
                        {oils.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} g/ml • {formatPKR(m.cost_per_unit)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Solvent / Ethanol *</label>
                      <select
                        value={blendSolventId}
                        onChange={(e) => setBlendSolventId(e.target.value)}
                        className="input"
                      >
                        {solvents.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} ml • {formatPKR(m.cost_per_unit)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Volume & Concentration */}
                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <Zap className="w-4 h-4 text-mute" />
                    <span>2. Batch Volume & Concentration</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Total Liquid Volume (ml) *</label>
                      <input
                        type="number"
                        required
                        min="10"
                        step="10"
                        value={blendTotalMl}
                        onChange={(e) => setBlendTotalMl(Number(e.target.value))}
                        className="input tabular-nums"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[100, 250, 500, 1000, 2000].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setBlendTotalMl(v)}
                            className={`btn btn-xs ${
                              blendTotalMl === v ? "btn-primary" : "btn-secondary"
                            }`}
                          >
                            {v} ml
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Concentration (% Oil) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="99"
                        step="1"
                        value={blendConcentration}
                        onChange={(e) => setBlendConcentration(Number(e.target.value))}
                        className="input tabular-nums"
                      />
                      <p className="text-xs text-mute mt-2">
                        {blendConcentration}% Fragrance Oil • {100 - blendConcentration}% Solvent
                      </p>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="well p-4">
                      <span className="eyebrow block mb-1">Fragrance Oil Needed</span>
                      <span
                        className={`text-2xl font-bold tabular-nums ${
                          isBlendOilInsufficient ? "text-error" : "text-ink"
                        }`}
                      >
                        {blendOilGrams.toFixed(1)} g
                      </span>
                      {selectedOilMat && (
                        <p
                          className={`text-xs mt-1 ${
                            isBlendOilInsufficient ? "text-error font-medium" : "text-mute"
                          }`}
                        >
                          Available: {selectedOilMat.current_stock} g
                          {isBlendOilInsufficient && " — INSUFFICIENT"}
                        </p>
                      )}
                    </div>

                    <div className="well p-4">
                      <span className="eyebrow block mb-1">Solvent Needed</span>
                      <span
                        className={`text-2xl font-bold tabular-nums ${
                          isBlendSolventInsufficient ? "text-error" : "text-ink"
                        }`}
                      >
                        {blendEthanolMl.toFixed(1)} ml
                      </span>
                      {selectedSolventMat && (
                        <p
                          className={`text-xs mt-1 ${
                            isBlendSolventInsufficient ? "text-error font-medium" : "text-mute"
                          }`}
                        >
                          Available: {selectedSolventMat.current_stock} ml
                          {isBlendSolventInsufficient && " — INSUFFICIENT"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Destination Prepared Fragrance */}
                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-mute" />
                    <span>3. Target Prepared Fragrance Item</span>
                  </h2>

                  <div className="flex gap-4 border-b border-hairline pb-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink">
                      <input
                        type="radio"
                        name="dest_mode"
                        checked={blendDestinationMode === "new"}
                        onChange={() => setBlendDestinationMode("new")}
                        className="accent-primary"
                      />
                      <span>Create New Fragrance Blend</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink">
                      <input
                        type="radio"
                        name="dest_mode"
                        checked={blendDestinationMode === "existing"}
                        onChange={() => setBlendDestinationMode("existing")}
                        className="accent-primary"
                      />
                      <span>Add to Existing Prepared Fragrance</span>
                    </label>
                  </div>

                  {blendDestinationMode === "new" ? (
                    <div>
                      <label className="field-label">New Fragrance Blend Name *</label>
                      <input
                        type="text"
                        required
                        value={blendNewFragranceName}
                        onChange={(e) => setBlendNewFragranceName(e.target.value)}
                        placeholder="e.g. Creed Aventus Bulk Blend, Sauvage Elixir 35%..."
                        className="input"
                      />
                      <p className="text-xs text-mute mt-1">
                        Will automatically create a new raw material item with category &ldquo;Prepared Fragrance&rdquo;.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="field-label">Select Prepared Fragrance Item *</label>
                      <select
                        value={blendTargetMaterialId}
                        onChange={(e) => setBlendTargetMaterialId(e.target.value)}
                        className="input"
                      >
                        {preparedFragrances.length === 0 && (
                          <option value="">— No existing blends found —</option>
                        )}
                        {preparedFragrances.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (Stock: {m.current_stock} ml • Cost: {formatPKR(m.cost_per_unit)}/ml)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 4. Maceration Period */}
                <div className="card space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-mute" />
                    <label className="eyebrow">Bulk Maceration Period (Days)</label>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="1"
                      value={blendMacerationDays}
                      onChange={(e) => setBlendMacerationDays(Number(e.target.value))}
                      className="flex-1 h-2 bg-hairline rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <div className="w-20 well px-3 py-2 text-center">
                      <span className="text-lg font-semibold tabular-nums text-ink">
                        {blendMacerationDays}
                      </span>
                      <span className="text-[10px] text-mute block">days</span>
                    </div>
                  </div>
                  <p className="text-xs text-mute">
                    {blendMacerationDays === 0
                      ? "0 days — Ready immediately (added straight to raw materials stock)"
                      : `Aging in bulk maceration for ${blendMacerationDays} days before being added to available stock`}
                  </p>
                </div>

                {/* Notes */}
                <div className="card space-y-2">
                  <label className="field-label">Compounding Notes (Optional)</label>
                  <textarea
                    value={blendNotes}
                    onChange={(e) => setBlendNotes(e.target.value)}
                    rows={2}
                    className="input resize-none"
                    placeholder="e.g. Master batch #14 compounded with fresh premium oil..."
                  />
                </div>
              </div>

              {/* Sidebar Summary */}
              <div className="card space-y-4 h-fit sticky top-20">
                <h3 className="text-h3 flex items-center gap-2 border-b border-hairline pb-3">
                  <Sparkles className="w-5 h-5 text-mute" />
                  <span>Compounding Summary</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Batch Volume</span>
                    <span className="font-bold text-ink tabular-nums text-sm">{blendTotalMl} ml</span>
                  </div>

                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Concentration</span>
                    <span className="font-semibold text-ink tabular-nums">{blendConcentration}%</span>
                  </div>

                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Oil Required</span>
                    <span
                      className={`tabular-nums font-medium ${
                        isBlendOilInsufficient ? "text-error" : "text-ink"
                      }`}
                    >
                      {blendOilGrams.toFixed(1)} g ({formatPKR(blendOilCost)})
                    </span>
                  </div>

                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Solvent Required</span>
                    <span
                      className={`tabular-nums font-medium ${
                        isBlendSolventInsufficient ? "text-error" : "text-ink"
                      }`}
                    >
                      {blendEthanolMl.toFixed(1)} ml ({formatPKR(blendSolventCost)})
                    </span>
                  </div>

                  <div className="border-t border-hairline pt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold text-ink">
                      <span>Total Batch Cost</span>
                      <span className="tabular-nums text-primary">{formatPKR(blendTotalCost)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold text-ink">
                      <span>Calculated Cost / ml</span>
                      <span className="tabular-nums text-primary">{formatPKR(blendCostPerMl)} / ml</span>
                    </div>
                  </div>
                </div>

                <div className="card p-3 bg-elevated border-hairline">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-ink">
                      {blendMacerationDays > 0 ? "Bulk Aging" : "Instant Inventory"}
                    </span>
                  </div>
                  <p className="text-[11px] text-mute mt-1">
                    {blendMacerationDays > 0
                      ? `Batch will age in /maceration for ${blendMacerationDays} days.`
                      : `Will be added to Prepared Fragrance stock immediately.`}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !canBlend}
                  className="btn btn-primary btn-pill w-full h-12 text-sm font-semibold shadow-whisper hover:shadow-float active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Droplets className="w-4 h-4" />
                  <span>
                    {submitting
                      ? "Blending..."
                      : `Blend ${blendTotalMl}ml Fragrance (${formatPKR(blendCostPerMl)}/ml)`}
                  </span>
                </button>

                {!canBlend && (
                  <p className="text-[11px] text-center text-error font-medium">
                    {!blendOilId
                      ? "Select fragrance oil"
                      : !blendSolventId
                      ? "Select solvent"
                      : isBlendOilInsufficient || isBlendSolventInsufficient
                      ? "Insufficient oil or solvent stock"
                      : blendDestinationMode === "new" && !blendNewFragranceName.trim()
                      ? "Enter new blend name"
                      : "Fill required fields to blend"}
                  </p>
                )}
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DIRECT ALL-IN-ONE (LEGACY)                                         */}
          {/* ========================================================================= */}
          {activeTab === "all_in_one" && (
            <form onSubmit={handleDirectProduce} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>1. Select Perfume</span>
                  </h2>
                  <select
                    value={directProductId}
                    onChange={(e) => setDirectProductId(e.target.value)}
                    className="input"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.perfume_quantity_ml}ml — Stock: {p.stock} bottles
                      </option>
                    ))}
                  </select>
                </div>

                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>2. Production Settings</span>
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDirectMode("bottle")}
                      className={`p-4 rounded-md border-2 text-left transition-all ${
                        directMode === "bottle"
                          ? "border-ink bg-elevated shadow-whisper"
                          : "border-hairline bg-elevated hover:border-mute"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Package
                          className={`w-5 h-5 ${directMode === "bottle" ? "text-ink" : "text-mute"}`}
                        />
                        <span
                          className={`text-sm font-semibold ${
                            directMode === "bottle" ? "text-ink" : "text-body"
                          }`}
                        >
                          Bottle Production
                        </span>
                      </div>
                      <p className="text-xs text-mute">Produce specific bottle count</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDirectMode("mass")}
                      className={`p-4 rounded-md border-2 text-left transition-all ${
                        directMode === "mass"
                          ? "border-ink bg-elevated shadow-whisper"
                          : "border-hairline bg-elevated hover:border-mute"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets
                          className={`w-5 h-5 ${directMode === "mass" ? "text-ink" : "text-mute"}`}
                        />
                        <span
                          className={`text-sm font-semibold ${
                            directMode === "mass" ? "text-ink" : "text-body"
                          }`}
                        >
                          Mass Production
                        </span>
                      </div>
                      <p className="text-xs text-mute">Produce bulk volume (ml)</p>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">
                        {directMode === "bottle" ? "Number of Bottles (pcs) *" : "Total Volume (ml) *"}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={directQuantity}
                        onChange={(e) => setDirectQuantity(Number(e.target.value))}
                        className="input tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="field-label">Concentration (%) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="99"
                        step="1"
                        value={directConcentration}
                        onChange={(e) => setDirectConcentration(Number(e.target.value))}
                        className="input tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="border-t border-hairline pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-mute" />
                      <label className="eyebrow">Maceration Period (Days)</label>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={directMacerationDays}
                        onChange={(e) => setDirectMacerationDays(Number(e.target.value))}
                        className="flex-1 h-2 bg-hairline rounded-full appearance-none cursor-pointer accent-primary"
                      />
                      <div className="w-20 well px-3 py-2 text-center">
                        <span className="text-lg font-semibold tabular-nums text-ink">
                          {directMacerationDays}
                        </span>
                        <span className="text-[10px] text-mute block">days</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card space-y-4">
                  <h2 className="eyebrow flex items-center gap-2">
                    <Boxes className="w-4 h-4" />
                    <span>3. Materials</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Fragrance Oil *</label>
                      <select
                        value={directOilId}
                        onChange={(e) => setDirectOilId(e.target.value)}
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
                      <label className="field-label">Solvent / Ethanol *</label>
                      <select
                        value={directEthanolId}
                        onChange={(e) => setDirectEthanolId(e.target.value)}
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
                        value={directBottleId}
                        onChange={(e) => setDirectBottleId(e.target.value)}
                        className="input"
                      >
                        <option value="">— None —</option>
                        {bottles.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} pcs)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Packaging Box</label>
                      <select
                        value={directBoxId}
                        onChange={(e) => setDirectBoxId(e.target.value)}
                        className="input"
                      >
                        <option value="">— None —</option>
                        {boxes.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.current_stock} pcs)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Sidebar */}
              <div className="card space-y-4 h-fit sticky top-20">
                <h3 className="text-h3 flex items-center gap-2 border-b border-hairline pb-3">
                  <Zap className="w-5 h-5 text-mute" />
                  <span>Production Summary</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Perfume</span>
                    <span className="font-medium text-ink">{selectedDirectProduct?.name || "—"}</span>
                  </div>
                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Volume</span>
                    <span className="font-medium tabular-nums text-ink">{directTotalMl} ml</span>
                  </div>
                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Oil Required</span>
                    <span className="font-medium tabular-nums text-ink">{directOilGrams.toFixed(1)} g</span>
                  </div>
                  <div className="well p-3 flex justify-between items-center">
                    <span className="text-mute">Ethanol Required</span>
                    <span className="font-medium tabular-nums text-ink">{directEthanolMl.toFixed(1)} ml</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !canProduceDirect}
                  className="btn btn-primary btn-pill w-full h-12 text-sm font-semibold shadow-whisper hover:shadow-float active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>
                    {submitting
                      ? "Producing..."
                      : `Produce ${directBottlesProduced} Bottle${directBottlesProduced !== 1 ? "s" : ""}`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
