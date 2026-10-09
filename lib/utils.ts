import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number): string {
  const isNegative = amount < 0;
  const absFormatted = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount || 0));

  return isNegative ? `-${absFormatted}` : absFormatted;
}

export function formatDate(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export const PAYMENT_STATUS_COLORS = {
  PENDING: "badge-warning",
  PAYED: "badge-success",
  REFUNDED: "badge-error",
};

export const PAYMENT_OPTION_LABELS = {
  CASH: "Cash",
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  BANK_TRANSFER: "Bank Transfer",
};

export const MATERIAL_CATEGORY_LABELS = {
  OIL: "Fragrance Oil (ml)",
  SOLVENT: "Solvent / Ethanol (ml)",
  BOTTLE: "Glass Bottle (pcs)",
  CAP_SPRAY: "Atomizer Spray / Cap (pcs)",
  STICKER: "Product Sticker (pcs)",
  BOX: "Packaging Box (pcs)",
  CARD: "Thank You Card (pcs)",
  OTHER: "Other Material",
};

export const TXN_TYPE_LABELS: Record<string, string> = {
  CAPITAL_CONTRIBUTION: "Capital Contribution",
  REVENUE: "Revenue",
  REFUND: "Refund",
  EXPENSE: "Expense",
  PROFIT_WITHDRAWAL: "Profit Withdrawal",
};

export const TXN_TYPE_BADGES: Record<string, string> = {
  CAPITAL_CONTRIBUTION: "badge-info",
  REVENUE: "badge-success",
  REFUND: "badge-error",
  EXPENSE: "badge-warning",
  PROFIT_WITHDRAWAL: "badge-neutral",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  INVENTORY: "Inventory Restock",
  ADS: "Marketing & Ads",
  RENT: "Rent",
  PACKAGING: "Boxes & Packaging",
  UTILITIES: "Utilities & Bills",
  SALARY: "Salaries & Wages",
  TRANSPORT: "Delivery & Courier",
  OTHER: "Other Expenses",
};

