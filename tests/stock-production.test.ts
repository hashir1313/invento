import { describe, expect, test } from "bun:test";
import { calculateBatchV2Plan, validateSaleStockRequirements } from "@/lib/domain-math";

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
