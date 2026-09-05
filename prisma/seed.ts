import { PrismaClient, MaterialCategory, UnitOfMeasure, PaymentStatus, PaymentOption } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Invento database seed...");

  // 1. Seed Default Raw Materials
  const rawMaterialsData = [
    {
      name: "French Vanilla Fragrance Oil",
      category: MaterialCategory.OIL,
      unit_of_measure: UnitOfMeasure.ML,
      current_stock: 1000,
      min_stock_alert: 200,
      cost_per_unit: 25.0,
    },
    {
      name: "Santal Oud Fragrance Oil",
      category: MaterialCategory.OIL,
      unit_of_measure: UnitOfMeasure.ML,
      current_stock: 750,
      min_stock_alert: 150,
      cost_per_unit: 35.0,
    },
    {
      name: "99% Denatured Perfumery Ethanol",
      category: MaterialCategory.SOLVENT,
      unit_of_measure: UnitOfMeasure.ML,
      current_stock: 5000,
      min_stock_alert: 1000,
      cost_per_unit: 4.5,
    },
    {
      name: "50ml Heavy Glass Bottle",
      category: MaterialCategory.BOTTLE,
      unit_of_measure: UnitOfMeasure.PIECES,
      current_stock: 100,
      min_stock_alert: 20,
      cost_per_unit: 180.0,
    },
    {
      name: "Silver Atomizer Spray Pump & Cap",
      category: MaterialCategory.CAP_SPRAY,
      unit_of_measure: UnitOfMeasure.PIECES,
      current_stock: 120,
      min_stock_alert: 25,
      cost_per_unit: 65.0,
    },
    {
      name: "Logo Sticker 50ml",
      category: MaterialCategory.STICKER,
      unit_of_measure: UnitOfMeasure.PIECES,
      current_stock: 300,
      min_stock_alert: 50,
      cost_per_unit: 12.0,
    },
    {
      name: "Branded Outer Packaging Box 50ml",
      category: MaterialCategory.BOX,
      unit_of_measure: UnitOfMeasure.PIECES,
      current_stock: 150,
      min_stock_alert: 30,
      cost_per_unit: 85.0,
    },
    {
      name: "Thank You & Care Note Card",
      category: MaterialCategory.CARD,
      unit_of_measure: UnitOfMeasure.PIECES,
      current_stock: 500,
      min_stock_alert: 50,
      cost_per_unit: 8.0,
    },
  ];

  console.log("  -> Seeding raw materials catalog...");
  for (const mat of rawMaterialsData) {
    await prisma.rawMaterial.create({ data: mat });
  }

  // 2. Seed Sample Perfume Products
  console.log("  -> Seeding sample perfume products...");
  const p1 = await prisma.product.create({
    data: {
      name: "Velvet Oud",
      perfume_quantity_ml: 50,
      impression: true,
      impression_of: "Tom Ford Oud Wood",
      price: 3500,
      stock: 15,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Santal Dream",
      perfume_quantity_ml: 50,
      impression: true,
      impression_of: "Le Labo Santal 33",
      price: 3200,
      stock: 8,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: "Midnight Bloom",
      perfume_quantity_ml: 100,
      impression: false,
      price: 4800,
      stock: 5,
    },
  });

  // 3. Seed Sample Sales Records
  console.log("  -> Seeding sample sales records...");
  await prisma.sale.create({
    data: {
      customer_name: "Ali Raza",
      date_purchased: new Date(),
      product_id: p1.id,
      quantity: 2,
      unit_price: 3500,
      total_price: 7000,
      payment_status: PaymentStatus.PAYED,
      payment_option: PaymentOption.EASYPAISA,
      review_given: true,
      notes: "Delivered via TCS Courier",
    },
  });

  await prisma.sale.create({
    data: {
      customer_name: "Sara Ahmed",
      date_purchased: new Date(),
      product_id: p2.id,
      quantity: 1,
      unit_price: 3200,
      total_price: 3200,
      payment_status: PaymentStatus.PENDING,
      payment_option: PaymentOption.JAZZCASH,
      review_given: false,
      notes: "Awaiting JazzCash transfer verification",
    },
  });

  await prisma.sale.create({
    data: {
      customer_name: "Usman Malik",
      date_purchased: new Date(),
      product_id: p3.id,
      quantity: 1,
      unit_price: 4800,
      total_price: 4800,
      payment_status: PaymentStatus.PAYED,
      payment_option: PaymentOption.BANK_TRANSFER,
      review_given: false,
      notes: "HBL Bank Transfer",
    },
  });

  console.log("✅ Invento database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
