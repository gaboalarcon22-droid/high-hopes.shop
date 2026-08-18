import { db } from '@/lib/db'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Badge de stock: productos activos con stock <= stockMinimo (incluye agotados)
  const productosActivos = await db.producto.findMany({
    where: { activo: true },
    select: { stock: true, stockMinimo: true },
  }).catch(() => [])

  const alertaCount = productosActivos.filter(p => p.stock <= p.stockMinimo).length

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar stockAlerta={alertaCount} />
      <div className="ml-64">
        <main className="p-6 max-w-screen-xl">
          {children}
        </main>
      </div>
    </div>
  )
}
