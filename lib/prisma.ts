import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { serverEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  if (!serverEnv.databaseUrl) throw new Error("DATABASE_URL is not configured.");
  if (serverEnv.databaseUrl.startsWith("prisma://") || serverEnv.databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: serverEnv.databaseUrl });
  }
  const adapter = new PrismaPg({ connectionString: serverEnv.databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
