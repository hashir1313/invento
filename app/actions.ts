"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentStatus, PaymentOption, MaterialCategory, UnitOfMeasure, MacerationStatus } from "@prisma/client";

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
  making_cost: number;
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
        making_cost: Number(data.making_cost),
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
    making_cost: number;
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
      making_cost: Number(data.making_cost),
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

export async function updateSale(
  id: string,
  data: {
    customer_name: string;
    date_purchased?: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    payment_status: PaymentStatus;
    payment_option: PaymentOption;
    review_given: boolean;
    notes?: string;
  }
) {
  try {
    const qty = Number(data.quantity);
    const unitPrice = Number(data.unit_price);
    const totalPrice = qty * unitPrice;

    const result = await prisma.$transaction(async (tx) => {
      const existingSale = await tx.sale.findUnique({ where: { id } });
      if (!existingSale) throw new Error("Sale not found");

      const newProduct = await tx.product.findUnique({ where: { id: data.product_id } });
      if (!newProduct) throw new Error("Selected product not found");

      const oldProductId = existingSale.product_id;
      const oldQty = existingSale.quantity;

      if (oldProductId === data.product_id) {
        const stockDiff = qty - oldQty;
        if (stockDiff > 0 && newProduct.stock < stockDiff) {
          throw new Error(
            `Insufficient stock! Need ${stockDiff} more bottle(s), but only ${newProduct.stock} available.`
          );
        }
        await tx.product.update({
          where: { id: data.product_id },
          data: { stock: newProduct.stock - stockDiff },
        });
      } else {
        const oldProduct = await tx.product.findUnique({ where: { id: oldProductId } });
        if (oldProduct) {
          await tx.product.update({
            where: { id: oldProductId },
            data: { stock: oldProduct.stock + oldQty },
          });
        }

        if (newProduct.stock < qty) {
          throw new Error(
            `Insufficient stock for ${newProduct.name}! Available: ${newProduct.stock} bottle(s), Requested: ${qty}`
          );
        }
        await tx.product.update({
          where: { id: data.product_id },
          data: { stock: newProduct.stock - qty },
        });
      }

      const sale = await tx.sale.update({
        where: { id },
        data: {
          customer_name: data.customer_name,
          date_purchased: data.date_purchased ? new Date(data.date_purchased) : existingSale.date_purchased,
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
    console.error("Error updating sale:", error);
    return { success: false, error: error?.message || "Failed to update sale" };
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

export async function getRecipesForProduct(productId: string) {
  try {
    return await prisma.batchRecipeItem.findMany({
      where: { product_id: productId },
      include: { raw_material: true },
    });
  } catch (error) {
    return [];
  }
}

export async function saveRecipe(
  productId: string,
  items: { raw_material_id: string; quantity_required_per_unit: number }[]
) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.batchRecipeItem.deleteMany({ where: { product_id: productId } });

      if (items.length > 0) {
        await tx.batchRecipeItem.createMany({
          data: items.map((item) => ({
            product_id: productId,
            raw_material_id: item.raw_material_id,
            quantity_required_per_unit: Number(item.quantity_required_per_unit),
          })),
        });
      }
    });

    revalidatePath("/batch-production");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving recipe:", error);
    return { success: false, error: error?.message || "Failed to save recipe" };
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

export async function produceBatchV2(data: {
  product_id: string;
  production_mode: "bottle" | "mass";
  quantity: number;
  concentration: number;
  oil_material_id: string;
  ethanol_material_id: string;
  bottle_material_id?: string;
  box_material_id?: string;
  sticker_material_id?: string;
  maceration_days?: number;
  notes?: string;
}) {
  try {
    const qty = Number(data.quantity);
    const concentration = Number(data.concentration) / 100;
    const macerationDays = Number(data.maceration_days) || 0;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: data.product_id } });
      if (!product) throw new Error("Product not found");

      let totalMl: number;
      let bottlesProduced: number;

      if (data.production_mode === "bottle") {
        totalMl = qty * product.perfume_quantity_ml;
        bottlesProduced = qty;
      } else {
        totalMl = qty;
        bottlesProduced = Math.floor(qty / product.perfume_quantity_ml);
      }

      const oilNeeded = totalMl * concentration;
      const ethanolNeeded = totalMl - oilNeeded;

      const oilMaterial = await tx.rawMaterial.findUnique({ where: { id: data.oil_material_id } });
      if (!oilMaterial) throw new Error("Oil material not found");
      if (oilMaterial.current_stock < oilNeeded) {
        throw new Error(`Insufficient ${oilMaterial.name}! Need ${oilNeeded} ml, but only ${oilMaterial.current_stock} ml available.`);
      }

      const ethanolMaterial = await tx.rawMaterial.findUnique({ where: { id: data.ethanol_material_id } });
      if (!ethanolMaterial) throw new Error("Ethanol material not found");
      if (ethanolMaterial.current_stock < ethanolNeeded) {
        throw new Error(`Insufficient ${ethanolMaterial.name}! Need ${ethanolNeeded} ml, but only ${ethanolMaterial.current_stock} ml available.`);
      }

      await tx.rawMaterial.update({ where: { id: data.oil_material_id }, data: { current_stock: oilMaterial.current_stock - oilNeeded } });
      await tx.rawMaterial.update({ where: { id: data.ethanol_material_id }, data: { current_stock: ethanolMaterial.current_stock - ethanolNeeded } });

      if (data.bottle_material_id && bottlesProduced > 0) {
        const bottleMat = await tx.rawMaterial.findUnique({ where: { id: data.bottle_material_id } });
        if (bottleMat && bottleMat.current_stock < bottlesProduced) {
          throw new Error(`Insufficient ${bottleMat.name}! Need ${bottlesProduced} pcs, but only ${bottleMat.current_stock} available.`);
        }
        if (bottleMat) {
          await tx.rawMaterial.update({ where: { id: data.bottle_material_id }, data: { current_stock: bottleMat.current_stock - bottlesProduced } });
        }
      }

      if (data.box_material_id && bottlesProduced > 0) {
        const boxMat = await tx.rawMaterial.findUnique({ where: { id: data.box_material_id } });
        if (boxMat && boxMat.current_stock < bottlesProduced) {
          throw new Error(`Insufficient ${boxMat.name}! Need ${bottlesProduced} pcs, but only ${boxMat.current_stock} available.`);
        }
        if (boxMat) {
          await tx.rawMaterial.update({ where: { id: data.box_material_id }, data: { current_stock: boxMat.current_stock - bottlesProduced } });
        }
      }

      if (data.sticker_material_id && bottlesProduced > 0) {
        const stickerMat = await tx.rawMaterial.findUnique({ where: { id: data.sticker_material_id } });
        if (stickerMat && stickerMat.current_stock < bottlesProduced) {
          throw new Error(`Insufficient ${stickerMat.name}! Need ${bottlesProduced} pcs, but only ${stickerMat.current_stock} available.`);
        }
        if (stickerMat) {
          await tx.rawMaterial.update({ where: { id: data.sticker_material_id }, data: { current_stock: stickerMat.current_stock - bottlesProduced } });
        }
      }

      // Handle maceration
      if (macerationDays > 0) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + macerationDays);

        await tx.macerationBatch.create({
          data: {
            product_id: data.product_id,
            batch_quantity: bottlesProduced,
            start_date: startDate,
            end_date: endDate,
            status: "MACERATING",
            notes: `${data.production_mode === "bottle" ? "Bottle" : "Mass"} production: ${totalMl}ml (${oilNeeded}g oil + ${ethanolNeeded}ml ethanol) → ${bottlesProduced} bottles. Maceration: ${macerationDays} days.`,
          },
        });
      } else {
        // No maceration - add directly to stock
        await tx.product.update({
          where: { id: data.product_id },
          data: { stock: { increment: bottlesProduced } },
        });
      }

      const batchLog = await tx.batchProduction.create({
        data: {
          product_id: data.product_id,
          batch_quantity: bottlesProduced,
          notes: data.notes || `${data.production_mode === "bottle" ? "Bottle" : "Mass"} production: ${totalMl}ml (${oilNeeded}g oil + ${ethanolNeeded}ml ethanol) → ${bottlesProduced} bottles${macerationDays > 0 ? `. Maceration: ${macerationDays} days` : " (no maceration)"}`,
        },
      });

      return { batchLog, totalMl, oilNeeded, ethanolNeeded, bottlesProduced, macerationDays };
    });

    revalidatePath("/products");
    revalidatePath("/raw-materials");
    revalidatePath("/batch-production");
    revalidatePath("/batch-production-v2");
    revalidatePath("/maceration");
    revalidatePath("/");
    return { success: true, result };
  } catch (error: any) {
    console.error("Error producing batch v2:", error);
    return { success: false, error: error?.message || "Failed to produce batch" };
  }
}

// ==========================================
// DASHBOARD METRICS ACTION
// ==========================================

export async function getDashboardMetrics() {
  try {
    const [sales, products, rawMaterials, completedMacerations] = await Promise.all([
      prisma.sale.findMany({ include: { product: true }, orderBy: { date_purchased: "desc" } }),
      prisma.product.findMany(),
      prisma.rawMaterial.findMany(),
      prisma.macerationBatch.findMany({
        where: {
          status: "MACERATING",
          end_date: { lte: new Date() },
        },
        include: { product: true },
        orderBy: { end_date: "asc" },
      }),
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

    const lowStockProducts = products.filter((p) => p.stock <= 5);

    const pendingReviews = sales.filter((s) => !s.review_given);

    return {
      totalRevenue,
      pendingReceivables,
      refundedAmount,
      totalSalesCount: sales.length,
      productsCount: products.length,
      lowStockCount: lowStockMaterials.length,
      lowStockMaterials,
      lowStockProducts,
      lowStockProductCount: lowStockProducts.length,
      pendingReviewsCount: pendingReviews.length,
      pendingReviews: pendingReviews.slice(0, 5),
      paymentOptionBreakdown,
      recentSales: sales.slice(0, 5),
      completedMacerations,
      completedMacerationsCount: completedMacerations.length,
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
      lowStockProducts: [],
      lowStockProductCount: 0,
      pendingReviewsCount: 0,
      pendingReviews: [],
      paymentOptionBreakdown: { CASH: 0, EASYPAISA: 0, JAZZCASH: 0, BANK_TRANSFER: 0 },
      recentSales: [],
      completedMacerations: [],
      completedMacerationsCount: 0,
    };
  }
}

// ==========================================
// FINANCES METRICS ACTION
// ==========================================

export async function getFinancesMetrics() {
  try {
    const sales = await prisma.sale.findMany({
      include: { product: true },
      orderBy: { date_purchased: "desc" },
    });

    let totalRevenue = 0;
    let totalMakingCost = 0;
    let totalNetProfit = 0;

    for (const sale of sales) {
      if (sale.payment_status === "PAYED") {
        const revenue = sale.total_price;
        const makingCost = sale.quantity * (sale.product?.making_cost || 0);
        const netProfit = revenue - makingCost;

        totalRevenue += revenue;
        totalMakingCost += makingCost;
        totalNetProfit += netProfit;
      }
    }

    const hashirProfit = totalNetProfit * 0.35;
    const badarProfit = totalNetProfit * 0.65;

    return {
      totalRevenue,
      totalMakingCost,
      totalNetProfit,
      hashirProfit,
      badarProfit,
      totalPayedSales: sales.filter((s) => s.payment_status === "PAYED").length,
    };
  } catch (error) {
    console.error("Error calculating finances metrics:", error);
    return {
      totalRevenue: 0,
      totalMakingCost: 0,
      totalNetProfit: 0,
      hashirProfit: 0,
      badarProfit: 0,
      totalPayedSales: 0,
    };
  }
}

// ==========================================
// MACERATION ACTIONS
// ==========================================

export async function getMacerationBatches(status?: MacerationStatus) {
  try {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return await prisma.macerationBatch.findMany({
      where,
      include: { product: true },
      orderBy: { created_at: "desc" },
    });
  } catch (error) {
    console.error("Error fetching maceration batches:", error);
    return [];
  }
}

export async function createMacerationBatch(data: {
  product_id: string;
  batch_quantity: number;
  start_date: string;
  end_date: string;
  notes?: string;
}) {
  try {
    const batchQty = Number(data.batch_quantity);
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: data.product_id } });
      if (!product) throw new Error("Product not found");

      const macerationBatch = await tx.macerationBatch.create({
        data: {
          product_id: data.product_id,
          batch_quantity: batchQty,
          start_date: startDate,
          end_date: endDate,
          status: "MACERATING",
          notes: data.notes || null,
        },
        include: { product: true },
      });

      return macerationBatch;
    });

    revalidatePath("/maceration");
    revalidatePath("/");
    return { success: true, maceration: result };
  } catch (error: any) {
    console.error("Error creating maceration batch:", error);
    return { success: false, error: error?.message || "Failed to create maceration batch" };
  }
}

export async function addMacerationToStock(id: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const maceration = await tx.macerationBatch.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!maceration) throw new Error("Maceration batch not found");
      if (maceration.status !== "MACERATING") {
        throw new Error("This maceration batch is not in MACERATING status");
      }

      await tx.product.update({
        where: { id: maceration.product_id },
        data: { stock: { increment: maceration.batch_quantity } },
      });

      const updatedMaceration = await tx.macerationBatch.update({
        where: { id },
        data: { status: "ADDED_TO_STOCK" },
        include: { product: true },
      });

      return updatedMaceration;
    });

    revalidatePath("/maceration");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true, maceration: result };
  } catch (error: any) {
    console.error("Error adding maceration to stock:", error);
    return { success: false, error: error?.message || "Failed to add to stock" };
  }
}

export async function extendMaceration(id: string, newEndDate: string) {
  try {
    const endDate = new Date(newEndDate);

    const result = await prisma.$transaction(async (tx) => {
      const maceration = await tx.macerationBatch.findUnique({ where: { id } });
      if (!maceration) throw new Error("Maceration batch not found");
      if (maceration.status !== "MACERATING") {
        throw new Error("This maceration batch is not in MACERATING status");
      }

      if (endDate <= maceration.start_date) {
        throw new Error("New end date must be after start date");
      }

      const updatedMaceration = await tx.macerationBatch.update({
        where: { id },
        data: { end_date: endDate },
        include: { product: true },
      });

      return updatedMaceration;
    });

    revalidatePath("/maceration");
    revalidatePath("/");
    return { success: true, maceration: result };
  } catch (error: any) {
    console.error("Error extending maceration:", error);
    return { success: false, error: error?.message || "Failed to extend maceration" };
  }
}

export async function getCompletedMacerations() {
  try {
    return await prisma.macerationBatch.findMany({
      where: {
        status: "MACERATING",
        end_date: { lte: new Date() },
      },
      include: { product: true },
      orderBy: { end_date: "asc" },
    });
  } catch (error) {
    console.error("Error fetching completed macerations:", error);
    return [];
  }
}

export async function deleteMacerationBatch(id: string) {
  try {
    await prisma.macerationBatch.delete({ where: { id } });
    revalidatePath("/maceration");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete maceration batch" };
  }
}
