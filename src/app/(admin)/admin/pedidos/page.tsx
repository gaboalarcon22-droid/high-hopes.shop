import { db } from '@/lib/db'
import { formatPrecio, formatFecha, ESTADOS_PEDIDO } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { PedidoEstado } from '@/components/admin/pedido-estado'

export default async function PedidosAdminPage() {
  const pedidos = await db.pedido.findMany({
    orderBy: { creadoEn: 'desc' },
    include: { cliente: true, items: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500">{pedidos.length} pedidos en total</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pago</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No hay pedidos todavía.
                </td>
              </tr>
            ) : pedidos.map(pedido => (
              <tr key={pedido.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-semibold text-gray-900">#{pedido.numero}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{pedido.cliente.nombre}</div>
                  <div className="text-xs text-gray-400">{pedido.cliente.email}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">{formatFecha(pedido.creadoEn)}</td>
                <td className="px-6 py-4 text-gray-600 text-xs">{pedido.metodoPago ?? '—'}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatPrecio(pedido.total)}</td>
                <td className="px-6 py-4 text-center">
                  <PedidoEstado pedidoId={pedido.id} estadoActual={pedido.estado} />
                </td>
                <td className="px-4 py-4 text-right">
                  <a href={`/admin/pedidos/${pedido.id}`} className="text-xs text-green-700 hover:underline font-medium">
                    Ver →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
