import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Package, ShoppingBag, Tag, TrendingUp } from 'lucide-react'
import { formatPrecio } from '@/lib/utils'

export default async function AdminDashboard() {
  const [totalProductos, totalPedidos, pedidosPendientes, categorias] = await Promise.all([
    db.producto.count({ where: { activo: true } }),
    db.pedido.count(),
    db.pedido.count({ where: { estado: 'PENDIENTE' } }),
    db.categoria.count({ where: { activa: true } }),
  ])

  const ventasHoy = await db.pedido.aggregate({
    where: {
      creadoEn: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      estadoPago: 'APROBADO',
    },
    _sum: { total: true },
  })

  const pedidosRecientes = await db.pedido.findMany({
    take: 8,
    orderBy: { creadoEn: 'desc' },
    include: { cliente: true },
  })

  const stats = [
    { label: 'Productos activos', value: totalProductos, icon: Package, color: 'bg-blue-500' },
    { label: 'Pedidos totales', value: totalPedidos, icon: ShoppingBag, color: 'bg-purple-500' },
    { label: 'Pendientes', value: pedidosPendientes, icon: TrendingUp, color: 'bg-yellow-500' },
    { label: 'Categorías', value: categorias, icon: Tag, color: 'bg-green-500' },
  ]

  const estadoColors: Record<string, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    CONFIRMADO: 'bg-blue-100 text-blue-800',
    PREPARANDO: 'bg-purple-100 text-purple-800',
    ENVIADO: 'bg-indigo-100 text-indigo-800',
    ENTREGADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ventas aprobadas hoy: <span className="font-semibold text-green-700">{formatPrecio(ventasHoy._sum.total ?? 0)}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pedidos recientes */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pedidos recientes</h2>
          <a href="/admin/pedidos" className="text-sm text-green-700 hover:underline">Ver todos</a>
        </div>
        <div className="divide-y divide-gray-50">
          {pedidosRecientes.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-400 text-sm">Sin pedidos aún.</p>
          ) : pedidosRecientes.map(pedido => (
            <div key={pedido.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">#{pedido.numero}</span>
                <div>
                  <div className="text-sm text-gray-800">{pedido.cliente.nombre}</div>
                  <div className="text-xs text-gray-400">{pedido.cliente.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${estadoColors[pedido.estado] ?? 'bg-gray-100 text-gray-700'}`}>
                  {pedido.estado}
                </span>
                <span className="text-sm font-semibold text-gray-900">{formatPrecio(pedido.total)}</span>
                <a href={`/admin/pedidos/${pedido.id}`} className="text-xs text-green-700 hover:underline">
                  Ver
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
