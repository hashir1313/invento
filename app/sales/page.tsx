"use client";

import { useState, useEffect } from "react";
import { getSales, getProducts, createSale, updateSalePaymentStatus, toggleSaleReview } from "../actions";
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
  CreditCard
} from "lucide-react";
import { PaymentStatus, PaymentOption } from "@prisma/client";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !productId) return;

    setSubmitting(true);
    const res = await createSale({
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

    setSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
      resetForm();
      loadData();
    } else {
      alert(res.error || "Failed to record sale");
    }
  }

  function resetForm() {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-400" />
            <span>Customer Sales & Orders Register</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Record sales, track customer payment statuses, local payment channels, and review feedback.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
          <Filter className="w-4 h-4 text-amber-400" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAYED">Payed (Completed)</option>
            <option value="PENDING">Pending (Unpaid)</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Payment Option Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Method:</span>
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
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
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading sales orders...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Sales Orders Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1">
            {filterStatus !== "ALL" || filterOption !== "ALL"
              ? "No sales match your active filter criteria."
              : "Click below to log your first customer purchase."}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Record Sale
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Perfume Purchased</th>
                  <th className="px-4 py-3.5">Qty</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Payment Method</th>
                  <th className="px-4 py-3.5">Payment Status</th>
                  <th className="px-4 py-3.5">Review Given</th>
                  <th className="px-4 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-white">
                      {sale.customer_name}
                      {sale.notes && (
                        <span className="block text-[11px] font-normal text-slate-400 italic">
                          {sale.notes}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-amber-300 font-semibold">
                      {sale.product?.name || "Deleted Product"}
                    </td>
                    <td className="px-4 py-4 font-bold text-white">{sale.quantity}</td>
                    <td className="px-4 py-4 font-black text-amber-400">
                      {formatPKR(sale.total_price)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 text-xs bg-slate-800 text-slate-200 font-medium rounded-lg border border-slate-700">
                        {PAYMENT_OPTION_LABELS[sale.payment_option as keyof typeof PAYMENT_OPTION_LABELS] || sale.payment_option}
                      </span>
                    </td>

                    {/* Status Dropdown / Badge Toggle */}
                    <td className="px-4 py-4">
                      <select
                        value={sale.payment_status}
                        onChange={(e) => handleStatusUpdate(sale.id, e.target.value as PaymentStatus)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${
                          PAYMENT_STATUS_COLORS[sale.payment_status as keyof typeof PAYMENT_STATUS_COLORS] || ""
                        }`}
                      >
                        <option value="PAYED" className="bg-slate-900 text-white">PAYED</option>
                        <option value="PENDING" className="bg-slate-900 text-white">PENDING</option>
                        <option value="REFUNDED" className="bg-slate-900 text-white">REFUNDED</option>
                      </select>
                    </td>

                    {/* Review Given Checkbox Toggle */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleReview(sale.id, sale.review_given)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                          sale.review_given
                            ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        {sale.review_given ? (
                          <>
                            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
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

                    <td className="px-4 py-4 text-slate-400 text-xs">
                      {formatDate(sale.date_purchased)}
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <span>Record Customer Sale</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Customer Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ali Ahmed, Sara Khan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Perfume Product *
                </label>
                {products.length === 0 ? (
                  <p className="text-xs text-rose-400">
                    No products available. Please add perfumes in the Products tab first!
                  </p>
                ) : (
                  <select
                    value={productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Unit Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Total Price Display */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-semibold">Total Price:</span>
                <span className="text-lg font-black text-amber-400">
                  {formatPKR(quantity * unitPrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Payment Option *</span>
                  </label>
                  <select
                    value={paymentOption}
                    onChange={(e) => setPaymentOption(e.target.value as PaymentOption)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="EASYPAISA">Easypaisa</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Payment Status *
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="PAYED">PAYED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>

              {/* Date Purchased */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Date Purchased</span>
                </label>
                <input
                  type="date"
                  value={datePurchased}
                  onChange={(e) => setDatePurchased(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Review Given Checkbox */}
              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>Has Customer Provided a Review?</span>
                </label>
                <input
                  type="checkbox"
                  checked={reviewGiven}
                  onChange={(e) => setReviewGiven(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
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
                  disabled={submitting || products.length === 0}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {submitting ? "Saving..." : "Save Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
