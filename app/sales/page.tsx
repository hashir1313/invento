"use client";

import { useState, useEffect } from "react";
import { getSales, getProducts, createSale, updateSale, updateSalePaymentStatus, toggleSaleReview } from "../actions";
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
  Pencil
} from "lucide-react";
import { PaymentStatus, PaymentOption } from "@prisma/client";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterOption, setFilterOption] = useState("ALL");

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [datePurchased, setDatePurchased] = useState(new Date().toISOString().split("T")[0]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAYED");
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("EASYPAISA");
  const [reviewGiven, setReviewGiven] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, [filterStatus, filterOption]);

  async function loadData() {
    setLoading(true);
    const [salesData, productsData] = await Promise.all([
      getSales(filterStatus, filterOption),
      getProducts(),
    ]);
    setSales(salesData);
    setProducts(productsData);
    if (productsData.length > 0 && !productId) {
      setProductId(productsData[0].id);
      setUnitPrice(productsData[0].price);
    }
    setLoading(false);
  }

  function handleProductSelect(id: string) {
    setProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setUnitPrice(prod.price);
    }
  }

  function openCreateModal() {
    setEditingSaleId(null);
    resetForm();
    if (products.length > 0) {
      setProductId(products[0].id);
      setUnitPrice(products[0].price);
    }
    setIsModalOpen(true);
  }

  function openEditModal(sale: any) {
    setEditingSaleId(sale.id);
    setCustomerName(sale.customer_name);
    setDatePurchased(new Date(sale.date_purchased).toISOString().split("T")[0]);
    setProductId(sale.product_id);
    setQuantity(sale.quantity);
    setUnitPrice(sale.unit_price);
    setPaymentStatus(sale.payment_status);
    setPaymentOption(sale.payment_option);
    setReviewGiven(sale.review_given);
    setNotes(sale.notes || "");
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !productId) return;

    setSubmitting(true);
    let res;
    if (editingSaleId) {
      res = await updateSale(editingSaleId, {
        customer_name: customerName,
        date_purchased: datePurchased,
        product_id: productId,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        payment_status: paymentStatus,
        payment_option: paymentOption,
        review_given: reviewGiven,
        notes,
      });
    } else {
      res = await createSale({
        customer_name: customerName,
        date_purchased: datePurchased,
        product_id: productId,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        payment_status: paymentStatus,
        payment_option: paymentOption,
        review_given: reviewGiven,
        notes,
      });
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

  function resetForm() {
    setEditingSaleId(null);
    setCustomerName("");
    setQuantity(1);
    setPaymentStatus("PAYED");
    setPaymentOption("EASYPAISA");
    setReviewGiven(false);
    setNotes("");
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

      {/* Filter Bar */}
      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-mute" />
          <span className="eyebrow">Filters:</span>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-mute">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-auto"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAYED">Payed (Completed)</option>
            <option value="PENDING">Pending (Unpaid)</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Payment Option Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-mute">Method:</span>
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="input w-auto"
          >
            <option value="ALL">All Payment Options</option>
            <option value="CASH">Cash</option>
            <option value="EASYPAISA">Easypaisa</option>
            <option value="JAZZCASH">JazzCash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-hairline border-t-ink rounded-full mx-auto mb-3"></div>
          <p className="text-body text-sm">Loading sales orders...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="card border-dashed text-center py-16">
          <ShoppingCart className="w-6 h-6 text-faint mx-auto mb-3" />
          <h3 className="text-h3">No Sales Orders Found</h3>
          <p className="text-body text-sm max-w-sm mx-auto mt-1">
            {filterStatus !== "ALL" || filterOption !== "ALL"
              ? "No sales match your active filter criteria."
              : "Click below to log your first customer purchase."}
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
          <div className="px-6 pt-6 pb-5">
            <h2 className="text-h3">Sales Orders</h2>
            <p className="text-xs text-mute mt-1">
              Every recorded customer order
            </p>
          </div>

          <div className="overflow-x-auto border-t border-hairline">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Perfume Purchased</th>
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
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-medium">
                      {sale.customer_name}
                      {sale.notes && (
                        <span className="block text-xs font-normal text-mute">
                          {sale.notes}
                        </span>
                      )}
                    </td>
                    <td className="text-body">
                      {sale.product?.name || "Deleted Product"}
                    </td>
                    <td className="tabular-nums">{sale.quantity}</td>
                    <td className="font-medium tabular-nums">
                      {formatPKR(sale.total_price)}
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {PAYMENT_OPTION_LABELS[sale.payment_option as keyof typeof PAYMENT_OPTION_LABELS] || sale.payment_option}
                      </span>
                    </td>

                    {/* Status Dropdown / Badge Toggle */}
                    <td>
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
                    <td>
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

                    <td className="text-mute text-xs">
                      {formatDate(sale.date_purchased)}
                    </td>
                    <td>
                      <button
                        onClick={() => openEditModal(sale)}
                        className="btn btn-sm btn-secondary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record New Sale Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-panel w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <h3 className="text-h3 flex items-center gap-2">
                {editingSaleId ? (
                  <>
                    <Pencil className="w-4 h-4 text-mute" />
                    <span>Edit Sale</span>
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

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Product Selection */}
              <div>
                <label className="field-label">
                  Perfume Product *
                </label>
                {products.length === 0 ? (
                  <p className="text-xs text-error">
                    No products available. Please add perfumes in the Products tab first!
                  </p>
                ) : (
                  <select
                    value={productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="input"
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.perfume_quantity_ml}ml) - Stock: {prod.stock} bottles - PKR {prod.price}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="field-label">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="input"
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="field-label">
                    Unit Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              {/* Total Price Display */}
              <div className="well p-3 flex justify-between items-center">
                <span className="text-xs text-mute font-medium">Total Price:</span>
                <span className="text-h3 tabular-nums text-ink">
                  {formatPKR(quantity * unitPrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="field-label">
                    Payment Status *
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

              {/* Review Given Checkbox */}
              <div className="well p-3.5 flex items-center justify-between">
                <label className="text-xs font-medium text-ink flex items-center gap-2">
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
              <div className="flex justify-end space-x-3 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || products.length === 0}
                  className="btn btn-sm btn-primary"
                >
                  {submitting ? "Saving..." : editingSaleId ? "Update Sale" : "Save Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
