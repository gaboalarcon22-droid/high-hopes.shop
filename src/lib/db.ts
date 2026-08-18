import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient() {
  const url = (process.env.DATABASE_URL ?? 'file:./dev.db').replace(/^file:/, '')
  const adapter = new PrismaBetterSqlite3({ url: `file:${url}` })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any)
}

// Siempre cachear en globalThis — previene múltiples instancias en dev (HMR)
// y en prod si Next.js re-importa el módulo entre requests
export const db = globalForPrisma.prisma ?? createClient()
globalForPrisma.prisma ??= db
