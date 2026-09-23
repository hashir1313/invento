"use client";

import { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, updateProductStock, deleteProduct } from "../actions";
import { formatPKR } from "@/lib/utils";
import { compressImageToWebP } from "@/lib/webp-compressor";
import { 
  Plus, 
  Upload, 
  Trash2, 
  Pencil,
  Sparkles, 
  Layers, 
  Tag, 
  Check, 
  X,
  Droplets
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [perfumeQuantityMl, setPerfumeQuantityMl] = useState(50);
  const [impression, setImpression] = useState(false);
  const [impressionOf, setImpressionOf] = useState("");
  const [price, setPrice] = useState(2500);
  const [makingCost, setMakingCost] = useState(0);
  const [stock, setStock] = useState(10);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function openCreateModal() {
    setEditingProductId(null);
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(product: any) {
    setEditingProductId(product.id);
    setName(product.name);
    setPerfumeQuantityMl(product.perfume_quantity_ml);
    setImpression(product.impression);
    setImpressionOf(product.impression_of || "");
    setPrice(product.price);
    setMakingCost(product.making_cost || 0);
    setStock(product.stock);
    setImageFile(null);
    setImagePreview(product.image_url || null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      let imageUrl: string | undefined = undefined;

      // If a new image file was selected, compress to WebP
      if (imageFile) {
        const webpBlob = await compressImageToWebP(imageFile);
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(webpBlob);
        });
        imageUrl = await base64Promise;
      } else if (editingProductId && imagePreview) {
        // Retain existing image URL if not uploading a new file
        imageUrl = imagePreview;
      }

      let res;
      if (editingProductId) {
        res = await updateProduct(editingProductId, {
          name,
          perfume_quantity_ml: Number(perfumeQuantityMl),
          impression,
          impression_of: impression ? impressionOf : undefined,
          price: Number(price),
          making_cost: Number(makingCost),
          stock: Number(stock),
          image_url: imageUrl,
        });
      } else {
        res = await createProduct({
          name,
          perfume_quantity_ml: Number(perfumeQuantityMl),
          impression,
          impression_of: impression ? impressionOf : undefined,
          price: Number(price),
          making_cost: Number(makingCost),
          stock: Number(stock),
          image_url: imageUrl,
        });
      }

      if (res.success) {
        setIsModalOpen(false);
        resetForm();
        loadProducts();
      } else {
        alert(res.error || "Failed to save product");
      }
    } catch (err: any) {
      alert("Error saving product: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setEditingProductId(null);
    setName("");
    setPerfumeQuantityMl(50);
    setImpression(false);
    setImpressionOf("");
    setPrice(2500);
    setMakingCost(0);
    setStock(10);
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleStockChange(id: string, currentStock: number, delta: number) {
    const newStock = Math.max(0, currentStock + delta);
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
    await updateProductStock(id, newStock);
  }

  async function handleDelete(id: string, productName: string) {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      setProducts(products.filter(p => p.id !== id));
      await deleteProduct(id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Inventory / Perfume Catalog</p>
          <h1 className="text-h2 text-ink">Perfume Products Catalog</h1>
          <p className="text-body text-sm mt-1">
            Manage your finished perfume bottles, stock counts, ml volumes, and prices.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary btn-pill self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Perfume</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-hairline border-t-ink rounded-full mx-auto mb-3"></div>
          <p className="text-body text-sm">Loading perfume catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="card border-dashed text-center py-16">
          <Droplets className="w-6 h-6 text-faint mx-auto mb-3" />
          <h3 className="text-h3">No Perfumes Added Yet</h3>
          <p className="text-body text-sm max-w-sm mx-auto mt-1">
            Click the button below to add your first perfume product to the inventory.
          </p>
          <button
            onClick={openCreateModal}
            className="btn btn-sm btn-primary mt-4"
          >
            <Plus className="w-4 h-4" />
            Add First Perfume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="card p-0 overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-whisper"
            >
              {/* Product Image Preview Header */}
              <div className="relative h-48 bg-hairline-soft flex items-center justify-center border-b border-hairline overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6">
                    <Droplets className="w-10 h-10 text-faint mx-auto mb-2" />
                    <span className="text-xs text-mute">No Image Uploaded</span>
                  </div>
                )}

                {/* ml volume tag */}
                <div className="absolute top-3 left-3 badge badge-neutral bg-elevated border border-hairline shadow-whisper">
                  {product.perfume_quantity_ml} ml
                </div>

                {/* Impression badge */}
                {product.impression && (
                  <div className="absolute top-3 right-3 badge badge-neutral bg-elevated border border-hairline shadow-whisper">
                    <Sparkles className="w-3 h-3" />
                    <span>Impression</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{product.name}</h3>
                  {product.impression && product.impression_of && (
                    <p className="text-xs text-mute mt-0.5">
                      Inspired by: <span className="text-ink font-medium">{product.impression_of}</span>
                    </p>
                  )}
                  <p className="text-h3 tabular-nums text-ink mt-2">
                    {formatPKR(product.price)}
                  </p>
                </div>

                {/* Stock Counter Controls */}
                <div className="well p-3 flex items-center justify-between">
                  <div>
                    <span className="eyebrow block">Available Stock</span>
                    <span className={`text-h3 tabular-nums ${product.stock <= 5 ? "text-error" : "text-ink"}`}>
                      {product.stock} bottle{product.stock === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleStockChange(product.id, product.stock, -1)}
                      className="btn btn-sm btn-secondary w-8"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStockChange(product.id, product.stock, 1)}
                      className="btn btn-sm btn-secondary w-8"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="btn btn-sm btn-secondary"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="btn btn-sm btn-danger"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Perfume Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <h3 className="text-h3 flex items-center gap-2">
                {editingProductId ? (
                  <>
                    <Pencil className="w-4 h-4 text-mute" />
                    <span>Edit Perfume Product</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-mute" />
                    <span>Add New Perfume Product</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-secondary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="field-label">
                  Perfume Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velvet Oud, Santal Dream"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Volume in ml */}
                <div>
                  <label className="field-label">
                    Volume (ml) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={perfumeQuantityMl}
                    onChange={(e) => setPerfumeQuantityMl(Number(e.target.value))}
                    className="input"
                  />
                </div>

                {/* Sale Price */}
                <div>
                  <label className="field-label">
                    Selling Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Making Cost */}
                <div>
                  <label className="field-label">
                    Making Cost (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={makingCost}
                    onChange={(e) => setMakingCost(Number(e.target.value))}
                    className="input"
                  />
                </div>

                {/* Initial / Current Stock */}
                <div>
                  <label className="field-label">
                    {editingProductId ? "Current Stock (Bottles) *" : "Initial Finished Bottle Stock *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              {/* Impression Toggle */}
              <div className="well p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-ink flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-mute" />
                    <span>Is this an Impression Scent?</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={impression}
                    onChange={(e) => setImpression(e.target.checked)}
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                </div>

                {impression && (
                  <div>
                    <label className="field-label">
                      Impression Of (Original Designer Fragrance)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tom Ford Tobacco Vanille, Creed Aventus"
                      value={impressionOf}
                      onChange={(e) => setImpressionOf(e.target.value)}
                      className="input"
                    />
                  </div>
                )}
              </div>

              {/* Image Picker with Auto WebP Compression */}
              <div>
                <label className="field-label">
                  Product Image (Auto WebP Compressed)
                </label>
                <div className="border border-dashed border-hairline bg-canvas rounded-md p-4 text-center hover:border-link transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="perfume-img-upload"
                  />
                  <label htmlFor="perfume-img-upload" className="cursor-pointer flex flex-col items-center">
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-28 object-contain rounded-sm mx-auto"
                        />
                        <span className="text-xs text-link hover:text-link-deep font-medium block">Click to replace image</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-mute mb-1" />
                        <span className="text-xs font-medium text-ink">Click to select photo</span>
                        <span className="text-xs text-mute">Auto-converts to lightweight WebP (&lt;100KB)</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {submitting ? "Saving..." : editingProductId ? "Update Perfume" : "Save Perfume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
