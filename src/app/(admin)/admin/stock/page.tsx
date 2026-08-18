import Link from 'next/link'
import { db } from '@/lib/db'
import { formatPrecio } from '@/lib/utils'
import { AlertTriangle, PackageX, ArrowRight } from 'lucide-react'

export default async function StockPage() {
  const productos = await db.producto.findMany({
    where: { activo: true },
    include: { categoria: { select: { nombre: true, icono: true } } },
    orderBy: [{ stock: 'asc' }, { nombre: 'asc' }],
  })

  const agotados = productos.filter(p => p.stock === 0)
  const criticos = productos.filter(p => p.stock > 0 && p.stock <= p.stockMinimo)
  const normales = productos.filter(p => p.stock > p.stockMinimo)

  const Section = ({
    titulo,
    icono,
    color,
    items,
  }: {
    titulo: string
    icono: React.ReactNode
    color: string
    items: typeof productos
  }) => {
    if (items.length === 0) return null
    return (
      <div>
        <div className={`flex items-center gap-2 mb-3 text-sm font-semibold ${color}`}>
          {icono}
          {titulo} ({items.length})
        </div>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock actual</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mínimo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{p.nombre}</div>
                    {p.sku && <div className="text-xs text-gray-400">SKU: {p.sku}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.categoria.icono} {p.categoria.nombre}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-sm ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-sm">{p.stockMinimo}</td>
                  <td className="px-4 py-3 text-right text-gray-700 text-sm">{formatPrecio(p.precio)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
                    >
                      Editar <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertas de stock</h1>
        <p className="text-gray-500 text-sm mt-1">
          {agotados.length} agotados · {criticos.length} críticos · {normales.length} en stock normal
        </p>
      </div>

      {agotados.length === 0 && criticos.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-green-700 font-medium">✅ Todo el stock está en niveles normales</p>
          <p className="text-green-600 text-sm mt-1">No hay productos agotados ni en nivel crítico.</p>
        </div>
      ) : (
        <>
          <Section
            titulo="Agotados"
            icono={<PackageX className="h-4 w-4" />}
            color="text-red-600"
            items={agotados}
          />
          <Section
            titulo="Nivel crítico (stock ≤ mínimo)"
            icono={<AlertTriangle className="h-4 w-4" />}
            color="text-orange-500"
            items={criticos}
          />
        </>
      )}

      {normales.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 select-none">
            <ArrowRight className="h-3.5 w-3.5 group-open:rotate-90 transition-transform" />
            Ver {normales.length} productos con stock normal
          </summary>
          <div className="mt-3">
            <Section
              titulo="Stock normal"
              icono={null}
              color="text-gray-600"
              items={normales}
            />
          </div>
        </details>
      )}
    </div>
  )
}
