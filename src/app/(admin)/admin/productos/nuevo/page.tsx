import { db } from '@/lib/db'
import { ProductoForm } from '@/components/admin/producto-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NuevoProductoPage() {
  const categorias = await db.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/productos" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo producto</h1>
      </div>
      <ProductoForm categorias={categorias} />
    </div>
  )
}
