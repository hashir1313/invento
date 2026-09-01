"use client";

import { useState, useEffect } from "react";
import { getProducts, createProduct, updateProductStock, deleteProduct } from "../actions";
import { formatPKR } from "@/lib/utils";
import { compressImageToWebP } from "@/lib/webp-compressor";
import { 
  Package, 
  Plus, 
  Upload, 
  Trash2, 
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
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [perfumeQuantityMl, setPerfumeQuantityMl] = useState(50);
  const [impression, setImpression] = useState(false);
  const [impressionOf, setImpressionOf] = useState("");
  const [price, setPrice] = useState(2500);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      let imageUrl: string | undefined = undefined;

      // If an image was selected, compress to WebP & upload
      if (imageFile) {
        const webpBlob = await compressImageToWebP(imageFile);
        
        // Convert blob to base64 data URL for instant standalone/offline preview or direct storage
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(webpBlob);
        });
        imageUrl = await base64Promise;
      }

      const res = await createProduct({
        name,
        perfume_quantity_ml: Number(perfumeQuantityMl),
        impression,
        impression_of: impression ? impressionOf : undefined,
        price: Number(price),
        stock: Number(stock),
        image_url: imageUrl,
      });

      if (res.success) {
        setIsModalOpen(false);
        resetForm();
        loadProducts();
      } else {
        alert(res.error || "Failed to create product");
      }
    } catch (err: any) {
      alert("Error uploading or creating product: " + err?.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setName("");
    setPerfumeQuantityMl(50);
    setImpression(false);
    setImpressionOf("");
    setPrice(2500);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Perfume Products Catalog</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your finished perfume bottles, stock counts, ml volumes, and prices.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Perfume</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading perfume catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
          <Droplets className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Perfumes Added Yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
            Click the button below to add your first perfume product to the inventory.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
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
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              {/* Product Image Preview Header */}
              <div className="relative h-48 bg-slate-950 flex items-center justify-center border-b border-slate-800 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6">
                    <Droplets className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <span className="text-xs text-slate-500">No Image Uploaded</span>
                  </div>
                )}

                {/* ml volume tag */}
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 border border-amber-500/30">
                  {product.perfume_quantity_ml} ml
                </div>

                {/* Impression badge */}
                {product.impression && (
                  <div className="absolute top-3 right-3 bg-sky-500/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-sky-300 border border-sky-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Impression</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  {product.impression && product.impression_of && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Inspired by: <span className="text-slate-300 italic">{product.impression_of}</span>
                    </p>
                  )}
                  <p className="text-xl font-black text-amber-400 mt-2">
                    {formatPKR(product.price)}
                  </p>
                </div>

                {/* Stock Counter Controls */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Available Stock</span>
                    <span className={`text-base font-extrabold ${product.stock <= 5 ? "text-rose-400" : "text-emerald-400"}`}>
                      {product.stock} bottle{product.stock === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleStockChange(product.id, product.stock, -1)}
                      className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-lg flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleStockChange(product.id, product.stock, 1)}
                      className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-lg flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
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

      {/* Add New Perfume Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Add New Perfume Product</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Perfume Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velvet Oud, Santal Dream"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Volume in ml */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Volume (ml) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={perfumeQuantityMl}
                    onChange={(e) => setPerfumeQuantityMl(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Sale Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Selling Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Initial Stock */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Initial Finished Bottle Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Impression Toggle */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Is this an Impression Scent?</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={impression}
                    onChange={(e) => setImpression(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {impression && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Impression Of (Original Designer Fragrance)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tom Ford Tobacco Vanille, Creed Aventus"
                      value={impressionOf}
                      onChange={(e) => setImpressionOf(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Image Picker with Auto WebP Compression */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Product Image (Auto WebP Compressed)
                </label>
                <div className="border border-dashed border-slate-700 bg-slate-950 rounded-xl p-4 text-center cursor-pointer hover:border-amber-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="perfume-img-upload"
                  />
                  <label htmlFor="perfume-img-upload" className="cursor-pointer flex flex-col items-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-28 object-contain rounded-lg mb-2"
                      />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-slate-500 mb-1" />
                        <span className="text-xs text-slate-300 font-medium">Click to select photo</span>
                        <span className="text-[10px] text-slate-500">Auto-converts to lightweight WebP (&lt;100KB)</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {submitting ? "Saving..." : "Save Perfume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
