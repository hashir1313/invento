import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking sales for migration to multi-item structure...");

  const sales = await prisma.sale.findMany({
    include: {
      items: true,
      product: true,
    },
  });

  console.log(`Found ${sales.length} total sales in database.`);

  let migratedCount = 0;
  let alreadyHasItemsCount = 0;
  let skippedCount = 0;

  for (const sale of sales) {
    if (sale.items && sale.items.length > 0) {
      alreadyHasItemsCount++;
      continue;
    }

    if (!sale.product_id) {
      console.warn(`Sale ${sale.id} has no product_id and no items. Skipping.`);
      skippedCount++;
      continue;
    }

    const qty = sale.quantity || 1;
    const unitPrice = sale.unit_price ?? (sale.total_price / qty);

    await prisma.saleItem.create({
      data: {
        sale_id: sale.id,
        product_id: sale.product_id,
        quantity: qty,
        unit_price: unitPrice,
        total_price: sale.total_price,
      },
    });

    migratedCount++;
    console.log(`✓ Migrated sale ${sale.id} (${sale.customer_name}) -> ${qty}x ${sale.product?.name || sale.product_id}`);
  }

  console.log("\n==========================================");
  console.log(`Migration Summary:`);
  console.log(`- Newly migrated: ${migratedCount}`);
  console.log(`- Already had items: ${alreadyHasItemsCount}`);
  console.log(`- Skipped: ${skippedCount}`);
  console.log("==========================================");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
