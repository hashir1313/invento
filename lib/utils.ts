import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
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
