import { db } from '@/lib/db'
import Link from 'next/link'
import { formatPrecio } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Eye, EyeOff } from 'lucide-react'
import { ProductoToggle } from '@/components/admin/producto-toggle'

export default async function ProductosAdminPage() {
  const productos = await db.producto.findMany({
    orderBy: { creadoEn: 'desc' },
    include: { categoria: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">{productos.length} productos en total</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {productos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No hay productos. <Link href="/admin/productos/nuevo" className="text-green-700 hover:underline">Crear el primero</Link>
                </td>
              </tr>
            ) : productos.map(p => {
              const imagenes: string[] = JSON.parse(p.imagenes || '[]')
              return (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                        {imagenes[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imagenes[0]} alt="" className="h-full w-full object-contain p-1" />
                        ) : (
                          <div className="h-full w-full bg-gray-200" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{p.nombre}</div>
                        {p.sku && <div className="text-xs text-gray-400">SKU: {p.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.categoria.nombre}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatPrecio(p.precio)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${p.stock <= p.stockMinimo ? 'text-red-600' : 'text-gray-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ProductoToggle id={p.id} activo={p.activo} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
