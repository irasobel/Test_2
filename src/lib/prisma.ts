import { PrismaClient } from "@prisma/client";

// בפיתוח Next יוצר מודולים מחדש בכל hot reload; שמירת המופע על globalThis
// מונעת מיצוי של חיבורי בסיס הנתונים.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
