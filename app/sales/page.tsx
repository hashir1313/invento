"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  getSales, 
  getProducts, 
  createSale, 
  updateSale, 
  updateSalePaymentStatus, 
  toggleSaleReview, 
  deleteSale 
} from "../actions";
import { formatPKR, formatDate, PAYMENT_STATUS_COLORS, PAYMENT_OPTION_LABELS } from "@/lib/utils";
import { 
  ShoppingCart, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  MessageSquare, 
  X, 
  User, 
  Calendar, 
  CreditCard, 
  Pencil, 
  Search, 
  Sparkles, 
  DollarSign,
  Trash2
} from "lucide-react";
import { PaymentStatus, PaymentOption } from "@prisma/client";

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface FormItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPerfume, setFilterPerfume] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterOption, setFilterOption] = useState("ALL");

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [datePurchased, setDatePurchased] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<FormItem[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAYED");
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("EASYPAISA");
  const [reviewGiven, setReviewGiven] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [salesData, productsData] = await Promise.all([
      getSales("ALL", "ALL"),
      getProducts(),
    ]);
    setSales(salesData);
    setProducts(productsData);
    setLoading(false);
  }

  function applyDatePreset(preset: string) {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "TODAY") {
      const todayStr = toDateInputValue(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "LAST_7") {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      setStartDate(toDateInputValue(start));
      setEndDate(toDateInputValue(now));
    } else if (preset === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(toDateInputValue(start));
      setEndDate(toDateInputValue(end));
    } else if (preset === "LAST_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toDateInputValue(start));
      setEndDate(toDateInputValue(end));
    }
  }

  function resetModalFilters() {
    setFilterPerfume("ALL");
    setMinPrice("");
    setMaxPrice("");
    setStartDate("");
    setEndDate("");
    setDatePreset("ALL");
    setFilterStatus("ALL");
    setFilterOption("ALL");
  }

  function resetAllFilters() {
    setSearchQuery("");
    resetModalFilters();
  }

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPerfume !== "ALL") count++;
    if (minPrice !== "" || maxPrice !== "") count++;
    if (startDate !== "" || endDate !== "") count++;
    if (filterStatus !== "ALL") count++;
    if (filterOption !== "ALL") count++;
    return count;
  }, [filterPerfume, minPrice, maxPrice, startDate, endDate, filterStatus, filterOption]);

  const hasAnyFilterOrSearch = activeFilterCount > 0 || Boolean(searchQuery.trim());

  // Filtered sales memo
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // 1. Search by customer name (entry name)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = sale.customer_name?.toLowerCase().includes(q);
        if (!matchesName) {
          return false;
        }
      }

      // 2. Filter by Perfume
      if (filterPerfume !== "ALL") {
        const matchesPerfume =
          sale.items && sale.items.length > 0
            ? sale.items.some((it: any) => it.product_id === filterPerfume)
            : sale.product_id === filterPerfume;
        if (!matchesPerfume) {
          return false;
        }
      }

      // 3. Filter by Prices (Total Sale Amount)
      if (minPrice !== "") {
        const min = Number(minPrice);
        if (!isNaN(min) && (sale.total_price || 0) < min) {
          return false;
        }
      }
      if (maxPrice !== "") {
        const max = Number(maxPrice);
        if (!isNaN(max) && (sale.total_price || 0) > max) {
          return false;
        }
      }

      // 4. Filter by Dates
      if (startDate || endDate) {
        const saleDate = new Date(sale.date_purchased);
        const saleDateStr = toDateInputValue(saleDate);

        if (startDate && saleDateStr < startDate) {
          return false;
        }
        if (endDate && saleDateStr > endDate) {
          return false;
        }
      }

      // 5. Filter by Payment Status
      if (filterStatus !== "ALL") {
        if (sale.payment_status !== filterStatus) {
          return false;
        }
      }

      // 6. Filter by Payment Method / Option
      if (filterOption !== "ALL") {
        if (sale.payment_option !== filterOption) {
          return false;
        }
      }

      return true;
    });
  }, [sales, searchQuery, filterPerfume, minPrice, maxPrice, startDate, endDate, filterStatus, filterOption]);

  const totalFilteredAmount = useMemo(() => {
    return filteredSales.reduce((acc, sale) => acc + (sale.total_price || 0), 0);
  }, [filteredSales]);

  // Dynamic Item row operations
  function handleItemProductChange(index: number, newProductId: string) {
    const prod = products.find((p) => p.id === newProductId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: newProductId,
              unitPrice: prod ? prod.price : item.unitPrice,
            }
          : item
      )
    );
  }

  function handleItemQuantityChange(index: number, qty: number) {
    const safeQty = Math.max(1, isNaN(qty) ? 1 : qty);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: safeQty } : item))
    );
  }

  function handleItemUnitPriceChange(index: number, price: number) {
    const safePrice = Math.max(0, isNaN(price) ? 0 : price);
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unitPrice: safePrice } : item))
    );
  }

  function handleAddItem() {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: defaultProduct.id,
        quantity: 1,
        unitPrice: defaultProduct.price,
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const orderTotalPrice = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  }, [items]);

  const orderTotalBottles = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  }, [items]);

  function resetForm() {
    setEditingSaleId(null);
    setCustomerName("");
    setDatePurchased(new Date().toISOString().split("T")[0]);
    setPaymentStatus("PAYED");
    setPaymentOption("EASYPAISA");
    setReviewGiven(false);
    setNotes("");
    if (products.length > 0) {
      setItems([
        {
          id: crypto.randomUUID(),
          productId: products[0].id,
          quantity: 1,
          unitPrice: products[0].price,
        },
      ]);
    } else {
      setItems([]);
    }
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(sale: any) {
    setEditingSaleId(sale.id);
    setCustomerName(sale.customer_name);
    setDatePurchased(new Date(sale.date_purchased).toISOString().split("T")[0]);
    setPaymentStatus(sale.payment_status);
    setPaymentOption(sale.payment_option);
    setReviewGiven(sale.review_given);
    setNotes(sale.notes || "");

    if (sale.items && sale.items.length > 0) {
      setItems(
        sale.items.map((it: any) => ({
          id: it.id || crypto.randomUUID(),
          productId: it.product_id,
          quantity: it.quantity,
          unitPrice: it.unit_price,
        }))
      );
    } else if (sale.product_id) {
      setItems([
        {
          id: crypto.randomUUID(),
          productId: sale.product_id,
          quantity: sale.quantity || 1,
          unitPrice: sale.unit_price || sale.total_price || 0,
        },
      ]);
    } else if (products.length > 0) {
      setItems([
        {
          id: crypto.randomUUID(),
          productId: products[0].id,
          quantity: 1,
          unitPrice: products[0].price,
        },
      ]);
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;

    for (const it of items) {
      if (!it.productId) {
        alert("Please ensure all items have a perfume selected.");
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      customer_name: customerName.trim(),
      date_purchased: datePurchased,
      items: items.map((it) => ({
        product_id: it.productId,
        quantity: Number(it.quantity),
        unit_price: Number(it.unitPrice),
      })),
      payment_status: paymentStatus,
      payment_option: paymentOption,
      review_given: reviewGiven,
      notes: notes.trim() || undefined,
    };

    let res;
    if (editingSaleId) {
      res = await updateSale(editingSaleId, payload);
    } else {
      res = await createSale(payload);
    }

    setSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
      resetForm();
      loadData();
    } else {
      alert(res.error || "Failed to save sale");
    }
  }

  async function handleDeleteSale(saleId: string) {
    if (!confirm("Are you sure you want to delete this sale? This will restore stock for all perfumes in this order and remove any banking ledger entries.")) {
      return;
    }
    const res = await deleteSale(saleId);
    if (res.success) {
      setIsModalOpen(false);
      resetForm();
      loadData();
    } else {
      alert(res.error || "Failed to delete sale");
    }
  }

  async function handleStatusUpdate(saleId: string, newStatus: PaymentStatus) {
    setSales(sales.map(s => s.id === saleId ? { ...s, payment_status: newStatus } : s));
    await updateSalePaymentStatus(saleId, newStatus);
  }

  async function handleToggleReview(saleId: string, currentReview: boolean) {
    setSales(sales.map(s => s.id === saleId ? { ...s, review_given: !currentReview } : s));
    await toggleSaleReview(saleId, currentReview);
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Sales / Order Records</p>
          <h1 className="text-h2 text-ink">Customer Sales & Orders Register</h1>
          <p className="text-body text-sm mt-1">
            Record sales, track customer payment statuses, local payment channels, and review feedback.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary btn-pill self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Sales Table Card */}
      {loading ? (
        <div className="card text-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-hairline border-t-ink rounded-full mx-auto mb-3"></div>
          <p className="text-body text-sm">Loading sales orders...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="card border-dashed text-center py-16">
          <ShoppingCart className="w-6 h-6 text-faint mx-auto mb-3" />
          <h3 className="text-h3">No Sales Orders Found</h3>
          <p className="text-body text-sm max-w-sm mx-auto mt-1">
            Click below to log your first customer purchase.
          </p>
          <button
            onClick={openCreateModal}
            className="btn btn-sm btn-primary mt-4"
          >
            <Plus className="w-4 h-4" />
            Record Sale
          </button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Sales Table Header with Left: Title & Subtitle, Right: Filter button & Search Bar */}
          <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-h3">Sales Orders</h2>
              <p className="text-xs text-mute mt-1">
                Every recorded customer order ({sales.length} total)
              </p>
            </div>

            {/* Top Right: Filter Button (before search bar) + Search Bar */}
            <div className="flex items-center gap-2.5 self-stretch md:self-auto">
              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className={`btn btn-sm ${
                  activeFilterCount > 0 ? "btn-primary" : "btn-secondary"
                } flex items-center gap-1.5`}
                title="Open filters"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-semibold bg-white text-ink rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Search Bar */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries by name..."
                  className="input pl-9 pr-8 text-xs py-1.5 h-8 w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar (Shown when any filter or search query is applied) */}
          {hasAnyFilterOrSearch && (
            <div className="px-6 py-2.5 bg-canvas border-t border-hairline flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-mute mr-1 font-medium">Active:</span>
                {searchQuery && (
                  <span className="badge badge-neutral gap-1 pl-2 pr-1">
                    Name: &quot;{searchQuery}&quot;
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="hover:text-ink ml-0.5"
                      title="Clear name search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterPerfume !== "ALL" && (
                  <span className="badge badge-neutral gap-1 pl-2 pr-1">
                    Perfume: {products.find(p => p.id === filterPerfume)?.name || "Selected"}
                    <button
                      type="button"
                      onClick={() => setFilterPerfume("ALL")}
                      className="hover:text-ink ml-0.5"
                      title="Clear perfume filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(minPrice !== "" || maxPrice !== "") && (
                  <span className="badge badge-neutral gap-1 pl-2 pr-1">
                    Price: {minPrice ? `PKR ${minPrice}` : "0"} - {maxPrice ? `PKR ${maxPrice}` : "Any"}
                    <button
                      type="button"
                      onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                      className="hover:text-ink ml-0.5"
                      title="Clear price filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(startDate || endDate) && (
                  <span className="badge badge-neutral gap-1 pl-2 pr-1">
                    Date: {startDate || "Start"} to {endDate || "Today"}
                    <button
                      type="button"
                      onClick={() => applyDatePreset("ALL")}
                      className="hover:text-ink ml-0.5"
                      title="Clear date filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterStatus !== "ALL" && (
                  <span className="badge badge-neutral gap-1 pl-2 pr-1">
                    Status: {filterStatus}
                    <button
                      type="button"
                      onClick={() => setFilterStatus("ALL")}
                      className="hover:text-ink ml-0.5"
                      title="Clear status filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterOption !== "ALL" && (
                  <span className="badge badge-neutral gap-1 pl-2 pr-1">
                    Method: {filterOption}
                    <button
                      type="button"
                      onClick={() => setFilterOption("ALL")}
                      className="hover:text-ink ml-0.5"
                      title="Clear method filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-mute hover:text-ink underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="flex items-center gap-3 text-mute">
                <span>
                  Showing <strong className="text-ink">{filteredSales.length}</strong> of {sales.length}
                </span>
                <span>•</span>
                <span>
                  Filtered Total: <strong className="text-ink font-semibold tabular-nums">{formatPKR(totalFilteredAmount)}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Table or Filter Empty State */}
          {filteredSales.length === 0 ? (
            <div className="text-center py-16 px-4 border-t border-hairline">
              <Filter className="w-6 h-6 text-faint mx-auto mb-3" />
              <h3 className="text-h3">No Matching Sales Found</h3>
              <p className="text-body text-sm max-w-sm mx-auto mt-1">
                No sales orders match your active search and filter criteria. Try adjusting your parameters.
              </p>
              <button
                onClick={resetAllFilters}
                className="btn btn-sm btn-secondary mt-4"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-hairline">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Perfumes Purchased</th>
                    <th>Qty</th>
                    <th>Total Amount</th>
                    <th>Payment Method</th>
                    <th>Payment Status</th>
                    <th>Review Given</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-medium align-top">
                        <span className="font-semibold text-ink">{sale.customer_name}</span>
                        {sale.notes && (
                          <span className="block text-xs font-normal text-mute mt-0.5">
                            {sale.notes}
                          </span>
                        )}
                      </td>
                      <td className="text-body align-top">
                        {sale.items && sale.items.length > 0 ? (
                          <div className="space-y-1">
                            {sale.items.map((it: any) => (
                              <div key={it.id} className="text-xs flex items-center justify-between gap-3">
                                <span className="font-medium text-ink">
                                  {it.quantity}x {it.product?.name || "Perfume"}
                                </span>
                                <span className="text-mute text-[11px] tabular-nums shrink-0">
                                  {formatPKR(it.total_price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-ink">
                            {sale.product?.name || "Deleted Product"}
                          </span>
                        )}
                      </td>
                      <td className="tabular-nums align-top">
                        {sale.items && sale.items.length > 0 ? (
                          <span className="badge badge-neutral">
                            {sale.items.reduce((s: number, i: any) => s + (i.quantity || 0), 0)} bottle{sale.items.reduce((s: number, i: any) => s + (i.quantity || 0), 0) === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="badge badge-neutral">
                            {sale.quantity} bottle{sale.quantity === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>
                      <td className="font-medium tabular-nums align-top text-ink">
                        {formatPKR(sale.total_price)}
                      </td>
                      <td className="align-top">
                        <span className="badge badge-neutral">
                          {PAYMENT_OPTION_LABELS[sale.payment_option as keyof typeof PAYMENT_OPTION_LABELS] || sale.payment_option}
                        </span>
                      </td>

                      {/* Status Dropdown / Badge Toggle */}
                      <td className="align-top">
                        <select
                          value={sale.payment_status}
                          onChange={(e) => handleStatusUpdate(sale.id, e.target.value as PaymentStatus)}
                          className={`badge cursor-pointer ${
                            PAYMENT_STATUS_COLORS[sale.payment_status as keyof typeof PAYMENT_STATUS_COLORS] || ""
                          }`}
                        >
                          <option value="PAYED">PAYED</option>
                          <option value="PENDING">PENDING</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </td>

                      {/* Review Given Checkbox Toggle */}
                      <td className="align-top">
                        <button
                          onClick={() => handleToggleReview(sale.id, sale.review_given)}
                          className={`badge cursor-pointer ${
                            sale.review_given ? "badge-success" : "badge-neutral"
                          }`}
                        >
                          {sale.review_given ? (
                            <>
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Yes</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>No</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="text-mute text-xs align-top whitespace-nowrap">
                        {formatDate(sale.date_purchased)}
                      </td>
                      <td className="align-top">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(sale)}
                            className="btn btn-sm btn-secondary"
                            title="Edit Order"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="btn btn-sm btn-secondary text-mute hover:text-error"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filter Modal with Two-Line Layout */}
      {isFilterModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-mute" />
                <h3 className="text-h3">Filter Sales Orders</h3>
                {activeFilterCount > 0 && (
                  <span className="badge badge-neutral text-xs">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="btn btn-sm btn-secondary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Body: Filters in Two Lines */}
            <div className="space-y-4">
              {/* LINE 1: Perfume, Price Range, Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Filter by Perfume */}
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs text-mute">
                    <Sparkles className="w-3.5 h-3.5 text-mute" />
                    <span>Perfume</span>
                  </label>
                  <select
                    value={filterPerfume}
                    onChange={(e) => setFilterPerfume(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="ALL">All Perfumes ({products.length})</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.perfume_quantity_ml}ml)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter by Price Range */}
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs text-mute">
                    <DollarSign className="w-3.5 h-3.5 text-mute" />
                    <span>Price Range (PKR)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min PKR"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="input text-xs w-1/2"
                    />
                    <span className="text-mute text-xs">-</span>
                    <input
                      type="number"
                      placeholder="Max PKR"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="input text-xs w-1/2"
                    />
                  </div>
                </div>

                {/* 3. Filter by Date Range */}
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs text-mute">
                    <Calendar className="w-3.5 h-3.5 text-mute" />
                    <span>Date Range</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setDatePreset("CUSTOM");
                      }}
                      className="input text-xs w-1/2"
                      title="Start date"
                    />
                    <span className="text-mute text-xs">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setDatePreset("CUSTOM");
                      }}
                      className="input text-xs w-1/2"
                      title="End date"
                    />
                  </div>
                </div>
              </div>

              {/* LINE 2: Status, Method, Date Presets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-hairline">
                {/* 4. Payment Status */}
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs text-mute">
                    <CheckCircle2 className="w-3.5 h-3.5 text-mute" />
                    <span>Payment Status</span>
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="ALL">All Payment Statuses</option>
                    <option value="PAYED">Payed (Completed)</option>
                    <option value="PENDING">Pending (Unpaid)</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                {/* 5. Payment Method */}
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs text-mute">
                    <CreditCard className="w-3.5 h-3.5 text-mute" />
                    <span>Payment Method</span>
                  </label>
                  <select
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="CASH">Cash</option>
                    <option value="EASYPAISA">Easypaisa</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                {/* 6. Quick Date Presets */}
                <div>
                  <label className="field-label flex items-center gap-1.5 text-xs text-mute">
                    <Clock className="w-3.5 h-3.5 text-mute" />
                    <span>Quick Date Presets</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {[
                      { label: "All", value: "ALL" },
                      { label: "Today", value: "TODAY" },
                      { label: "7 Days", value: "LAST_7" },
                      { label: "Month", value: "THIS_MONTH" },
                      { label: "Last Mo", value: "LAST_MONTH" },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => applyDatePreset(preset.value)}
                        className={`btn btn-sm text-[11px] py-0 px-2.5 h-7 rounded-full border transition-colors ${
                          datePreset === preset.value
                            ? "bg-primary text-on-primary border-primary"
                            : "bg-canvas text-body border-hairline hover:border-mute"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-hairline">
              <div className="text-xs text-mute">
                <span>Matching: <strong className="text-ink">{filteredSales.length}</strong> orders</span>
                <span className="mx-2">•</span>
                <span>Revenue: <strong className="text-ink font-semibold">{formatPKR(totalFilteredAmount)}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetModalFilters}
                    className="btn btn-sm btn-secondary text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="btn btn-sm btn-primary text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record / Edit Sale Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <h3 className="text-h3 flex items-center gap-2">
                {editingSaleId ? (
                  <>
                    <Pencil className="w-4 h-4 text-mute" />
                    <span>Edit Sale Order</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 text-mute" />
                    <span>Record Customer Sale</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="btn btn-sm btn-secondary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer & Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div>
                  <label className="field-label flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-mute" />
                    <span>Customer Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ali Ahmed, Sara Khan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Date Purchased */}
                <div>
                  <label className="field-label flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-mute" />
                    <span>Date Purchased</span>
                  </label>
                  <input
                    type="date"
                    value={datePurchased}
                    onChange={(e) => setDatePurchased(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Payment Option */}
                <div>
                  <label className="field-label flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-mute" />
                    <span>Payment Option *</span>
                  </label>
                  <select
                    value={paymentOption}
                    onChange={(e) => setPaymentOption(e.target.value as PaymentOption)}
                    className="input"
                  >
                    <option value="EASYPAISA">Easypaisa</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="field-label flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-mute" />
                    <span>Payment Status *</span>
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="input"
                  >
                    <option value="PAYED">PAYED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>

              {/* Perfumes Ordered Section */}
              <div className="space-y-3 pt-2 border-t border-hairline">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="field-label flex items-center gap-1.5 mb-0 font-semibold text-ink">
                      <Sparkles className="w-4 h-4 text-mute" />
                      <span>Perfumes Purchased ({items.length})</span>
                    </label>
                    <p className="text-[11px] text-mute mt-0.5">
                      Add all perfumes bought in this order
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={products.length === 0}
                    className="btn btn-sm btn-secondary flex items-center gap-1.5 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Perfume</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <p className="text-xs text-error">
                    No products available. Please add perfumes in the Products tab first!
                  </p>
                ) : items.length === 0 ? (
                  <div className="card border-dashed text-center py-6">
                    <p className="text-xs text-mute">No perfumes in this order yet.</p>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn btn-sm btn-primary mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Perfume
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item, index) => {
                      const selectedProd = products.find((p) => p.id === item.productId);
                      const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-lg border border-hairline bg-canvas/60 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-elevated border border-hairline flex items-center justify-center text-[11px]">
                                {index + 1}
                              </span>
                              <span>Perfume #{index + 1}</span>
                            </span>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-mute hover:text-error transition-colors p-1"
                                title="Remove this perfume"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {/* Perfume Selector */}
                            <div>
                              <label className="text-[11px] text-mute mb-1 block">
                                Perfume *
                              </label>
                              <select
                                value={item.productId}
                                onChange={(e) => handleItemProductChange(index, e.target.value)}
                                className="input text-xs"
                              >
                                {products.map((prod) => (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.name} ({prod.perfume_quantity_ml}ml) - PKR {prod.price}
                                  </option>
                                ))}
                              </select>
                              {selectedProd && (
                                <p className="text-[11px] text-mute mt-1">
                                  Stock: <span className={selectedProd.stock <= 5 ? "text-error font-medium" : "text-ink font-medium"}>{selectedProd.stock} available</span>
                                </p>
                              )}
                            </div>

                            {/* Quantity and Unit Price in Same Row */}
                            <div className="grid grid-cols-2 gap-3">
                              {/* Quantity */}
                              <div>
                                <label className="text-[11px] text-mute mb-1 block">
                                  Qty *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={item.quantity}
                                  onChange={(e) => handleItemQuantityChange(index, Number(e.target.value))}
                                  className="input text-xs tabular-nums text-right pr-2"
                                />
                              </div>

                              {/* Unit Price */}
                              <div>
                                <label className="text-[11px] text-mute mb-1 block">
                                  Unit Price (PKR) *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemUnitPriceChange(index, Number(e.target.value))}
                                  className="input text-xs tabular-nums text-right pr-2"
                                />
                              </div>
                            </div>

                            {/* Line Total / Subtotal */}
                            <div>
                              <label className="text-[11px] text-mute mb-1 block">
                                Subtotal
                              </label>
                              <div className="h-9 flex items-center justify-end px-3 text-xs font-semibold tabular-nums text-ink bg-elevated rounded border border-hairline">
                                {formatPKR(lineTotal)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Total Summary Box */}
              <div className="well p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-mute block">Order Items Summary:</span>
                  <span className="text-sm font-medium text-ink">
                    {orderTotalBottles} bottle{orderTotalBottles === 1 ? "" : "s"} across {items.length} perfume{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs text-mute block">Order Grand Total:</span>
                  <span className="text-h3 font-bold tabular-nums text-ink">
                    {formatPKR(orderTotalPrice)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="field-label text-xs">Order Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Free sample included, gift packaging, delivery instructions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input text-xs"
                />
              </div>

              {/* Review Given Checkbox */}
              <div className="well p-3.5 flex items-center justify-between">
                <label className="text-xs font-medium text-ink flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="w-4 h-4 text-mute" />
                  <span>Has Customer Provided a Review?</span>
                </label>
                <input
                  type="checkbox"
                  checked={reviewGiven}
                  onChange={(e) => setReviewGiven(e.target.checked)}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-hairline">
                {editingSaleId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSale(editingSaleId)}
                    className="btn btn-sm btn-secondary text-error hover:bg-error/10 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    className="btn btn-sm btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || products.length === 0 || items.length === 0}
                    className="btn btn-sm btn-primary"
                  >
                    {submitting ? "Saving..." : editingSaleId ? "Update Sale" : "Save Sale"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
