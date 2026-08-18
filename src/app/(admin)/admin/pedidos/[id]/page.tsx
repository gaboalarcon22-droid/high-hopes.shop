import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatPrecio, formatFecha, ESTADOS_PEDIDO, METODOS_PAGO } from '@/lib/utils'
import { PedidoEstado } from '@/components/admin/pedido-estado'
import { PedidoNota } from '@/components/admin/pedido-nota'
import { ArrowLeft, Package, User, MapPin, CreditCard, Clock } from 'lucide-react'

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const pedido = await db.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      items: {
        include: {
          producto: { select: { id: true, nombre: true, imagenes: true, slug: true } },
          variante: { select: { nombre: true, valor: true } },
        },
      },
      historial: { orderBy: { creadoEn: 'asc' } },
    },
  })

  if (!pedido) notFound()

  const direccion = (() => {
    try {
      return JSON.parse(pedido.direccionEnvio ?? '{}') as Record<string, string>
    } catch {
      return {}
    }
  })()

  const estadoInfo = ESTADOS_PEDIDO[pedido.estado as keyof typeof ESTADOS_PEDIDO]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pedidos"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedido #{pedido.numero}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{formatFecha(pedido.creadoEn)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${estadoInfo?.color ?? 'bg-gray-100 text-gray-700'}`}>
            {estadoInfo?.label ?? pedido.estado}
          </span>
          <PedidoEstado pedidoId={pedido.id} estadoActual={pedido.estado} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-5">

          {/* Items del pedido */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Package className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900 text-sm">
                Productos ({pedido.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {pedido.items.map(item => {
                const imagenes = (() => {
                  try { return JSON.parse(item.producto.imagenes) as string[] } catch { return [] }
                })()
                return (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagenes[0] ?? '/placeholder.png'}
                      alt={item.nombreSnap}
                      className="h-12 w-12 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">{item.producto.nombre}</div>
                      {item.variante && (
                        <div className="text-xs text-gray-500">{item.variante.nombre}: {item.variante.valor}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatPrecio(item.precioUnit)} × {item.cantidad}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatPrecio(item.subtotal)}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Totales */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrecio(pedido.subtotal)}</span>
              </div>
              {pedido.costoEnvio > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Envío</span>
                  <span>{formatPrecio(pedido.costoEnvio)}</span>
                </div>
              )}
              {pedido.descuento > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento</span>
                  <span>−{formatPrecio(pedido.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
                <span>Total</span>
                <span>{formatPrecio(pedido.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline de historial */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Clock className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900 text-sm">Historial</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              {pedido.historial.length === 0 ? (
                <p className="text-sm text-gray-400">Sin entradas en el historial.</p>
              ) : (
                <ol className="relative border-l border-gray-200 ml-3 space-y-5">
                  {pedido.historial.map((h, idx) => {
                    const eInfo = ESTADOS_PEDIDO[h.estado as keyof typeof ESTADOS_PEDIDO]
                    return (
                      <li key={h.id} className="ml-4">
                        <div className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white ${
                          idx === pedido.historial.length - 1 ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${eInfo?.color ?? 'bg-gray-100 text-gray-600'}`}>
                            {eInfo?.label ?? h.estado}
                          </span>
                          <span className="text-xs text-gray-400">{formatFecha(h.creadoEn)}</span>
                        </div>
                        {h.nota && (
                          <p className="text-sm text-gray-600 mt-1">{h.nota}</p>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}

              <div className="pt-2">
                <PedidoNota pedidoId={pedido.id} estadoActual={pedido.estado} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar del pedido */}
        <div className="space-y-5">

          {/* Cliente */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <User className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900 text-sm">Cliente</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              <div className="font-medium text-gray-900">{pedido.cliente.nombre}</div>
              <div className="text-sm text-gray-500">{pedido.cliente.email}</div>
              {pedido.cliente.telefono && (
                <div className="text-sm text-gray-500">{pedido.cliente.telefono}</div>
              )}
              {pedido.cliente.empresa && (
                <div className="text-sm text-gray-500">{pedido.cliente.empresa}</div>
              )}
              <Link
                href={`/admin/clientes/${pedido.cliente.id}`}
                className="text-xs text-green-700 hover:underline block mt-1"
              >
                Ver ficha del cliente →
              </Link>
            </div>
          </div>

          {/* Dirección */}
          {Object.keys(direccion).length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <MapPin className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900 text-sm">Dirección de envío</h2>
              </div>
              <div className="px-5 py-4 text-sm text-gray-600 space-y-0.5">
                {direccion.calle && <div>{direccion.calle}</div>}
                {(direccion.ciudad || direccion.provincia) && (
                  <div>{[direccion.ciudad, direccion.provincia].filter(Boolean).join(', ')}</div>
                )}
                {direccion.cp && <div>CP {direccion.cp}</div>}
              </div>
            </div>
          )}

          {/* Pago */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900 text-sm">Pago</h2>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Método</span>
                <span className="font-medium text-gray-900">
                  {METODOS_PAGO[pedido.metodoPago as keyof typeof METODOS_PAGO] ?? pedido.metodoPago ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${
                  pedido.estadoPago === 'APROBADO' ? 'bg-green-100 text-green-700' :
                  pedido.estadoPago === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {pedido.estadoPago}
                </span>
              </div>
              {pedido.mpPaymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">ID MP</span>
                  <span className="text-gray-700 font-mono text-xs">{pedido.mpPaymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notas del cliente */}
          {pedido.notas && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">Nota del cliente</p>
              <p className="text-sm text-amber-700">{pedido.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
