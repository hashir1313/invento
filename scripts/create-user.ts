import { hashPassword } from "../lib/auth";
import { prisma } from "../lib/prisma";

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin";

  if (!username || !password) {
    console.log("\n  Usage: bun run scripts/create-user.ts <username> <password> [name]\n");
    console.log("  Creates or updates a user directly in the database.\n");
    console.log("  Example:");
    console.log('    bun run scripts/create-user.ts admin MySecureP@ss123 "Business Admin"\n');
    process.exit(1);
  }

  const cleanUsername = username.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.upsert({
      where: { username: cleanUsername },
      update: {
        name,
        password_hash: passwordHash,
      },
      create: {
        username: cleanUsername,
        name,
        password_hash: passwordHash,
      },
    });

    console.log("\n========================================");
    console.log("  User saved directly to database!");
    console.log("========================================");
    console.log(`  ID:       ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Name:     ${user.name}`);
    console.log("========================================\n");
  } catch (err) {
    console.warn("\n  Could not connect to database directly. Generated credentials:");
    console.log(`  Username: "${cleanUsername}"`);
    console.log(`  Password Hash: "${passwordHash}"\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
