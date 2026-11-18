import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

export const TRANSACTION_OPTIONS = {
  maxWait: 5000,
  timeout: 15000,
} as const;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
