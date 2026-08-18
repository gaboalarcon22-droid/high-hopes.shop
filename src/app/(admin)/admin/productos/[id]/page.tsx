import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProductoForm } from '@/components/admin/producto-form'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function EditarProductoPage({ params }: Props) {
  const { id } = await params
  const [producto, categorias] = await Promise.all([
    db.producto.findUnique({ where: { id }, include: { variantes: true } }),
    db.categoria.findMany({ where: { activa: true }, orderBy: { orden: 'asc' } }),
  ])

  if (!producto) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/productos" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Editar: {producto.nombre}</h1>
        </div>
        <a
          href={`/tienda/${producto.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-green-700 hover:underline"
        >
          Ver en tienda <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <ProductoForm categorias={categorias} producto={producto} />
    </div>
  )
}
