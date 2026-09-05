import { hashPassword } from "../lib/auth";

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log("\n  Usage: bun run scripts/create-user.ts <username> <password>\n");
    console.log("  This generates hashed credentials for your .env file.\n");
    console.log("  Example:");
    console.log("    bun run scripts/create-user.ts admin MySecureP@ss123\n");
    process.exit(1);
  }

  const hash = await hashPassword(password);

  console.log("\n========================================");
  console.log("  Credentials Generated Successfully!");
  console.log("========================================\n");
  console.log("  Add these to your .env file:\n");
  console.log(`  AUTH_USERNAME="${username}"`);
  console.log(`  AUTH_PASSWORD_HASH="${hash}"`);
  console.log("\n========================================\n");
}

main();
