import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatPrecio, formatFecha, ESTADOS_PEDIDO } from '@/lib/utils'
import { ArrowLeft, ShoppingBag, Phone, Building2, Mail, Calendar } from 'lucide-react'

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cliente = await db.cliente.findUnique({
    where: { id },
    include: {
      pedidos: {
        orderBy: { creadoEn: 'desc' },
        include: {
          items: { select: { nombreSnap: true, cantidad: true, subtotal: true } },
        },
      },
    },
  })

  if (!cliente) notFound()

  const stats = await db.pedido.aggregate({
    where: { clienteId: id },
    _sum: { total: true },
    _count: { id: true },
    _avg: { total: true },
  })

  const aprobados = await db.pedido.aggregate({
    where: { clienteId: id, estadoPago: 'APROBADO' },
    _sum: { total: true },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/clientes"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-lg">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cliente.nombre}</h1>
            <p className="text-gray-500 text-sm">{cliente.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pedidos totales', value: String(stats._count.id) },
          { label: 'Total gastado (aprobado)', value: formatPrecio(aprobados._sum.total ?? 0) },
          { label: 'Ticket promedio', value: stats._avg.total ? formatPrecio(stats._avg.total) : '—' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Información</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              {cliente.email}
            </div>
            {cliente.telefono && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                {cliente.telefono}
              </div>
            )}
            {cliente.empresa && (
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                {cliente.empresa}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Cliente desde {formatFecha(cliente.creadoEn)}
            </div>
          </div>
        </div>

        {/* Pedidos */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <ShoppingBag className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">
              Pedidos ({cliente.pedidos.length})
            </h2>
          </div>
          {cliente.pedidos.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Sin pedidos.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {cliente.pedidos.map(pedido => {
                const estadoInfo = ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO]
                return (
                  <div key={pedido.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/pedidos/${pedido.id}`}
                          className="font-semibold text-green-700 hover:underline text-sm"
                        >
                          #{pedido.numero}
                        </Link>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoInfo?.color ?? 'bg-gray-100 text-gray-600'}`}>
                          {estadoInfo?.label ?? pedido.estado}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatFecha(pedido.creadoEn)}</div>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        {pedido.items.slice(0, 2).map((it, i) => (
                          <div key={i}>{it.nombreSnap} ×{it.cantidad}</div>
                        ))}
                        {pedido.items.length > 2 && (
                          <div className="text-gray-400">+{pedido.items.length - 2} más...</div>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-gray-900 text-sm flex-shrink-0">
                      {formatPrecio(pedido.total)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
