"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentStatus, PaymentOption, MaterialCategory, UnitOfMeasure } from "@prisma/client";

// ==========================================
// PRODUCTS ACTIONS
// ==========================================

export async function getProducts() {
  try {
    return await prisma.product.findMany({
      orderBy: { created_at: "desc" },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function createProduct(data: {
  name: string;
  perfume_quantity_ml: number;
  impression: boolean;
  impression_of?: string;
  price: number;
  stock: number;
  image_url?: string;
}) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        perfume_quantity_ml: Number(data.perfume_quantity_ml),
        impression: Boolean(data.impression),
        impression_of: data.impression_of || null,
        price: Number(data.price),
        stock: Number(data.stock),
        image_url: data.image_url || null,
      },
    });
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: error?.message || "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    perfume_quantity_ml: number;
    impression: boolean;
    impression_of?: string;
    price: number;
    stock: number;
    image_url?: string;
  }
) {
  try {
    const updateData: any = {
      name: data.name,
      perfume_quantity_ml: Number(data.perfume_quantity_ml),
      impression: Boolean(data.impression),
      impression_of: data.impression_of || null,
      price: Number(data.price),
      stock: Number(data.stock),
    };
    if (data.image_url !== undefined) {
      updateData.image_url = data.image_url;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { success: false, error: error?.message || "Failed to update product" };
  }
}

export async function updateProductStock(id: string, newStock: number) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: { stock: Math.max(0, Number(newStock)) },
    });
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update stock" };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete product" };
  }
}

// ==========================================
// SALES ACTIONS
// ==========================================

export async function getSales(filterStatus?: string, filterOption?: string) {
  try {
    const where: any = {};
    if (filterStatus && filterStatus !== "ALL") {
      where.payment_status = filterStatus as PaymentStatus;
    }
    if (filterOption && filterOption !== "ALL") {
      where.payment_option = filterOption as PaymentOption;
    }

    return await prisma.sale.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { date_purchased: "desc" },
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}

export async function createSale(data: {
  customer_name: string;
  date_purchased?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  payment_status: PaymentStatus;
  payment_option: PaymentOption;
  review_given: boolean;
  notes?: string;
}) {
  try {
    const qty = Number(data.quantity);
    const unitPrice = Number(data.unit_price);
    const totalPrice = qty * unitPrice;

    // Execute in Prisma Transaction for stock safety
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.product_id },
      });

      if (!product) {
        throw new Error("Selected product not found");
      }

      if (product.stock < qty) {
        throw new Error(
          `Insufficient stock! Available: ${product.stock} bottle(s), Requested: ${qty}`
        );
      }

      // Decrement stock
      await tx.product.update({
        where: { id: data.product_id },
        data: { stock: product.stock - qty },
      });

      // Create Sale record
      const sale = await tx.sale.create({
        data: {
          customer_name: data.customer_name,
          date_purchased: data.date_purchased ? new Date(data.date_purchased) : new Date(),
          product_id: data.product_id,
          quantity: qty,
          unit_price: unitPrice,
          total_price: totalPrice,
          payment_status: data.payment_status,
          payment_option: data.payment_option,
          review_given: Boolean(data.review_given),
          notes: data.notes || null,
        },
      });

      return sale;
    });

    revalidatePath("/sales");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, sale: result };
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return { success: false, error: error?.message || "Failed to create sale" };
  }
}

export async function updateSalePaymentStatus(id: string, newStatus: PaymentStatus) {
  try {
    const sale = await prisma.sale.update({
      where: { id },
      data: { payment_status: newStatus },
    });
    revalidatePath("/sales");
    revalidatePath("/");
    return { success: true, sale };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update payment status" };
  }
}

export async function toggleSaleReview(id: string, currentStatus: boolean) {
  try {
    const sale = await prisma.sale.update({
      where: { id },
      data: { review_given: !currentStatus },
    });
    revalidatePath("/sales");
    revalidatePath("/");
    return { success: true, sale };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to toggle review status" };
  }
}

// ==========================================
// RAW MATERIALS ACTIONS
// ==========================================

export async function getRawMaterials() {
  try {
    return await prisma.rawMaterial.findMany({
      include: {
        restocks: {
          orderBy: { date_received: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return [];
  }
}

export async function createRawMaterial(data: {
  name: string;
  category: MaterialCategory;
  unit_of_measure: UnitOfMeasure;
  current_stock: number;
  min_stock_alert: number;
  cost_per_unit: number;
}) {
  try {
    const material = await prisma.rawMaterial.create({
      data: {
        name: data.name,
        category: data.category,
        unit_of_measure: data.unit_of_measure,
        current_stock: Number(data.current_stock),
        min_stock_alert: Number(data.min_stock_alert),
        cost_per_unit: Number(data.cost_per_unit),
      },
    });
    revalidatePath("/raw-materials");
    revalidatePath("/");
    return { success: true, material };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create raw material" };
  }
}

export async function updateRawMaterial(
  id: string,
  data: {
    name: string;
    category: MaterialCategory;
    unit_of_measure: UnitOfMeasure;
    current_stock: number;
    min_stock_alert: number;
    cost_per_unit: number;
  }
) {
  try {
    const material = await prisma.rawMaterial.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        unit_of_measure: data.unit_of_measure,
        current_stock: Number(data.current_stock),
        min_stock_alert: Number(data.min_stock_alert),
        cost_per_unit: Number(data.cost_per_unit),
      },
    });
    revalidatePath("/raw-materials");
    revalidatePath("/");
    return { success: true, material };
  } catch (error: any) {
    console.error("Error updating raw material:", error);
    return { success: false, error: error?.message || "Failed to update raw material" };
  }
}

export async function restockRawMaterial(data: {
  raw_material_id: string;
  quantity_received: number;
  unit_cost: number;
  supplier?: string;
  date_received?: string;
  notes?: string;
}) {
  try {
    const qty = Number(data.quantity_received);
    const unitCost = Number(data.unit_cost);
    const totalCost = qty * unitCost;

    const result = await prisma.$transaction(async (tx) => {
      const material = await tx.rawMaterial.findUnique({
        where: { id: data.raw_material_id },
      });

      if (!material) throw new Error("Raw material not found");

      // Increment stock & update cost_per_unit if changed
      await tx.rawMaterial.update({
        where: { id: data.raw_material_id },
        data: {
          current_stock: material.current_stock + qty,
          cost_per_unit: unitCost > 0 ? unitCost : material.cost_per_unit,
        },
      });

      // Log restock
      const restock = await tx.rawMaterialRestock.create({
        data: {
          raw_material_id: data.raw_material_id,
          quantity_received: qty,
          unit_cost: unitCost,
          total_cost: totalCost,
          supplier: data.supplier || null,
          date_received: data.date_received ? new Date(data.date_received) : new Date(),
          notes: data.notes || null,
        },
      });

      return restock;
    });

    revalidatePath("/raw-materials");
    revalidatePath("/");
    return { success: true, restock: result };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to restock raw material" };
  }
}

export async function deleteRawMaterial(id: string) {
  try {
    await prisma.rawMaterial.delete({ where: { id } });
    revalidatePath("/raw-materials");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete raw material" };
  }
}

// ==========================================
// BATCH PRODUCTION ACTIONS
// ==========================================

export async function getRecipes() {
  try {
    return await prisma.batchRecipeItem.findMany({
      include: {
        product: true,
        raw_material: true,
      },
    });
  } catch (error) {
    return [];
  }
}

export async function produceBatch(data: {
  product_id: string;
  batch_quantity: number;
  notes?: string;
}) {
  try {
    const batchQty = Number(data.batch_quantity);

    const result = await prisma.$transaction(async (tx) => {
      // Find product recipe
      const recipeItems = await tx.batchRecipeItem.findMany({
        where: { product_id: data.product_id },
        include: { raw_material: true },
      });

      if (recipeItems.length === 0) {
        throw new Error("No recipe found for this perfume! Please define recipe components first.");
      }

      // Check raw material stock availability
      for (const item of recipeItems) {
        const totalNeeded = item.quantity_required_per_unit * batchQty;
        if (item.raw_material.current_stock < totalNeeded) {
          throw new Error(
            `Insufficient ${item.raw_material.name}! Need ${totalNeeded} ${item.raw_material.unit_of_measure}, but only ${item.raw_material.current_stock} available.`
          );
        }
      }

      // Deduct raw materials
      for (const item of recipeItems) {
        const totalNeeded = item.quantity_required_per_unit * batchQty;
        await tx.rawMaterial.update({
          where: { id: item.raw_material_id },
          data: { current_stock: item.raw_material.current_stock - totalNeeded },
        });
      }

      // Increment finished product stock
      const updatedProduct = await tx.product.update({
        where: { id: data.product_id },
        data: { stock: { increment: batchQty } },
      });

      // Record production log
      const batchLog = await tx.batchProduction.create({
        data: {
          product_id: data.product_id,
          batch_quantity: batchQty,
          notes: data.notes || null,
        },
      });

      return { batchLog, updatedProduct };
    });

    revalidatePath("/products");
    revalidatePath("/raw-materials");
    revalidatePath("/batch-production");
    revalidatePath("/");
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to produce batch" };
  }
}

// ==========================================
// DASHBOARD METRICS ACTION
// ==========================================

export async function getDashboardMetrics() {
  try {
    const [sales, products, rawMaterials] = await Promise.all([
      prisma.sale.findMany({ include: { product: true }, orderBy: { date_purchased: "desc" } }),
      prisma.product.findMany(),
      prisma.rawMaterial.findMany(),
    ]);

    let totalRevenue = 0;
    let pendingReceivables = 0;
    let refundedAmount = 0;

    const paymentOptionBreakdown = {
      CASH: 0,
      EASYPAISA: 0,
      JAZZCASH: 0,
      BANK_TRANSFER: 0,
    };

    for (const sale of sales) {
      if (sale.payment_status === "PAYED") {
        totalRevenue += sale.total_price;
        if (sale.payment_option in paymentOptionBreakdown) {
          paymentOptionBreakdown[sale.payment_option as keyof typeof paymentOptionBreakdown] += sale.total_price;
        }
      } else if (sale.payment_status === "PENDING") {
        pendingReceivables += sale.total_price;
      } else if (sale.payment_status === "REFUNDED") {
        refundedAmount += sale.total_price;
      }
    }

    const lowStockMaterials = rawMaterials.filter(
      (m) => m.current_stock <= m.min_stock_alert
    );

    const pendingReviews = sales.filter((s) => !s.review_given);

    return {
      totalRevenue,
      pendingReceivables,
      refundedAmount,
      totalSalesCount: sales.length,
      productsCount: products.length,
      lowStockCount: lowStockMaterials.length,
      lowStockMaterials,
      pendingReviewsCount: pendingReviews.length,
      pendingReviews: pendingReviews.slice(0, 5),
      paymentOptionBreakdown,
      recentSales: sales.slice(0, 5),
    };
  } catch (error) {
    console.error("Error calculating dashboard metrics:", error);
    return {
      totalRevenue: 0,
      pendingReceivables: 0,
      refundedAmount: 0,
      totalSalesCount: 0,
      productsCount: 0,
      lowStockCount: 0,
      lowStockMaterials: [],
      pendingReviewsCount: 0,
      pendingReviews: [],
      paymentOptionBreakdown: { CASH: 0, EASYPAISA: 0, JAZZCASH: 0, BANK_TRANSFER: 0 },
      recentSales: [],
    };
  }
}
