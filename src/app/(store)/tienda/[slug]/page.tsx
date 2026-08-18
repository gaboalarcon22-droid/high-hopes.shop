import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatPrecio } from '@/lib/utils'
import { ProductoDetalle } from '@/components/tienda/producto-detalle'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const producto = await db.producto.findUnique({ where: { slug } })
  if (!producto) return {}
  return {
    title: `${producto.nombre} — High Hopes`,
    description: producto.descripcionCorta ?? producto.descripcion ?? '',
  }
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params
  const producto = await db.producto.findUnique({
    where: { slug, activo: true },
    include: { categoria: true, variantes: { where: { activa: true } } },
  })

  if (!producto) notFound()

  const imagenes: string[] = JSON.parse(producto.imagenes || '[]')
  const relacionados = await db.producto.findMany({
    where: {
      categoriaId: producto.categoriaId,
      activo: true,
      id: { not: producto.id },
    },
    take: 4,
    include: { categoria: true },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <ProductoDetalle
        producto={producto}
        imagenes={imagenes}
        relacionados={relacionados}
      />
    </div>
  )
}
