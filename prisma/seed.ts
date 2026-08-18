import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const url = (process.env.DATABASE_URL ?? 'file:./dev.db').replace(/^file:/, '')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${url}` }) } as any)

const CATEGORIAS = [
  { nombre: 'Remeras', slug: 'remeras', icono: '👕', descripcion: 'Remeras estampadas, básicas y de diseño', orden: 1 },
  { nombre: 'Buzos', slug: 'buzos', icono: '🧥', descripcion: 'Buzos y hoodies estampados', orden: 2 },
  { nombre: 'Oversize', slug: 'oversize', icono: '👔', descripcion: 'Calce oversize / box fit', orden: 3 },
  { nombre: 'Personalizados', slug: 'personalizados', icono: '🎨', descripcion: 'Diseños a medida hechos con el mockup 3D', orden: 4 },
  { nombre: 'Accesorios', slug: 'accesorios', icono: '🔧', descripcion: 'Gorras, bolsos y accesorios varios', orden: 5 },
]

async function main() {
  console.log('🌱 Iniciando seed High Hopes...')

  for (const cat of CATEGORIAS) {
    await db.categoria.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    })
  }
  console.log(`✅ ${CATEGORIAS.length} categorías creadas`)

  const hash = await bcrypt.hash('HighHopes2026!', 12)
  await db.usuario.upsert({
    where: { email: 'admin@highhopes.store' },
    update: {},
    create: { email: 'admin@highhopes.store', password: hash, nombre: 'Administrador', rol: 'ADMIN' },
  })

  const hashOp = await bcrypt.hash('Operador2026!', 12)
  await db.usuario.upsert({
    where: { email: 'operador@highhopes.store' },
    update: {},
    create: { email: 'operador@highhopes.store', password: hashOp, nombre: 'Operador Demo', rol: 'OPERADOR' },
  })
  console.log('✅ Usuarios creados')

  console.log('\n📋 Accesos:')
  console.log('  Admin: admin@highhopes.store / HighHopes2026!')
  console.log('  Operador: operador@highhopes.store / Operador2026!')
  console.log('\n  Tienda: http://localhost:3001/tienda')
  console.log('  Admin:  http://localhost:3001/admin')
  console.log('\n  ⚠️  Sin productos demo — cargar desde /admin/productos/nuevo')
}

main().catch(console.error).finally(() => db.$disconnect())
