import { describe, expect, test } from "bun:test";
import { 
  calculateBatchV2Plan, 
  calculateBulkFragrancePlan,
  calculateBottlingPlan,
  validateSaleStockRequirements 
} from "@/lib/domain-math";

describe("Bulk Fragrance Compounding calculations", () => {
  test("calculates oil, ethanol requirements and weighted unit cost per ml", () => {
    const plan = calculateBulkFragrancePlan({
      totalMl: 1000,
      concentrationPct: 30,
      oilCostPerUnit: 20, // Rs. 20/g
      ethanolCostPerUnit: 1.5, // Rs. 1.5/ml
    });

    expect(plan.totalMl).toBe(1000);
    expect(plan.oilNeeded).toBe(300);
    expect(plan.ethanolNeeded).toBe(700);
    // (300 * 20 + 700 * 1.5) / 1000 = (6000 + 1050) / 1000 = 7.05
    expect(plan.costPerMl).toBeCloseTo(7.05, 4);
  });

  test("rejects invalid volume or concentration", () => {
    expect(() =>
      calculateBulkFragrancePlan({
        totalMl: 0,
        concentrationPct: 25,
      })
    ).toThrow();

    expect(() =>
      calculateBulkFragrancePlan({
        totalMl: 500,
        concentrationPct: -5,
      })
    ).toThrow();
  });
});

describe("Bottling & Packaging Assembly calculations", () => {
  test("calculates fragrance ml needed and unit making cost breakdown", () => {
    const plan = calculateBottlingPlan({
      bottleCount: 10,
      bottleSizeMl: 50,
      fragranceCostPerMl: 8,
      packagingUnitCosts: {
        bottle: 120,
        cap: 35,
        box: 45,
        sticker: 15,
      },
    });

    expect(plan.bottleCount).toBe(10);
    expect(plan.fragranceMlNeeded).toBe(500); // 10 * 50ml
    expect(plan.fragranceCostPerBottle).toBe(400); // 50 * 8
    expect(plan.packagingCostPerBottle).toBe(215); // 120 + 35 + 45 + 15
    expect(plan.makingCostPerBottle).toBe(615); // 400 + 215
    expect(plan.totalBatchCost).toBe(6150); // 615 * 10
  });

  test("handles zero or missing packaging items cleanly", () => {
    const plan = calculateBottlingPlan({
      bottleCount: 2,
      bottleSizeMl: 100,
      fragranceCostPerMl: 5,
    });

    expect(plan.fragranceMlNeeded).toBe(200);
    expect(plan.makingCostPerBottle).toBe(500); // 100 * 5
    expect(plan.totalBatchCost).toBe(1000);
  });
});

describe("Batch Production V2 calculations", () => {
  test("calculates bottle mode oil, ethanol, and total volume accurately", () => {
    const plan = calculateBatchV2Plan({
      productionMode: "bottle",
      quantity: 10,
      bottleSizeMl: 50,
      concentrationPct: 25,
    });

    expect(plan).toEqual({
      totalMl: 500,
      bottlesProduced: 10,
      oilNeeded: 125,
      ethanolNeeded: 375,
    });
  });

  test("calculates mass mode deriving full bottles via floor division", () => {
    const plan = calculateBatchV2Plan({
      productionMode: "mass",
      quantity: 520,
      bottleSizeMl: 50,
      concentrationPct: 20,
    });

    expect(plan.totalMl).toBe(520);
    expect(plan.bottlesProduced).toBe(10);
    expect(plan.oilNeeded).toBeCloseTo(104, 6);
    expect(plan.ethanolNeeded).toBeCloseTo(416, 6);
  });

  test("rejects invalid quantity, bottle size, or concentration", () => {
    expect(() =>
      calculateBatchV2Plan({
        productionMode: "bottle",
        quantity: 0,
        bottleSizeMl: 50,
        concentrationPct: 20,
      })
    ).toThrow();

    expect(() =>
      calculateBatchV2Plan({
        productionMode: "bottle",
        quantity: 5,
        bottleSizeMl: 50,
        concentrationPct: 120,
      })
    ).toThrow();
  });
});

describe("Multi-item sale stock validation", () => {
  const catalog = new Map([
    ["p1", { name: "Velvet Oud", stock: 4 }],
    ["p2", { name: "Santal Dream", stock: 2 }],
  ]);

  test("consolidates duplicate line items for the same product before checking stock", () => {
    expect(() =>
      validateSaleStockRequirements(
        [
          { product_id: "p1", quantity: 2 },
          { product_id: "p1", quantity: 3 },
        ],
        catalog
      )
    ).toThrow(/Insufficient stock for "Velvet Oud"/);
  });

  test("accepts orders within available stock and returns consolidated quantities", () => {
    const needed = validateSaleStockRequirements(
      [
        { product_id: "p1", quantity: 2 },
        { product_id: "p1", quantity: 2 },
        { product_id: "p2", quantity: 1 },
      ],
      catalog
    );

    expect(needed).toEqual({ p1: 4, p2: 1 });
  });

  test("rejects unknown products", () => {
    expect(() =>
      validateSaleStockRequirements([{ product_id: "missing", quantity: 1 }], catalog)
    ).toThrow(/not found/);
  });
});
