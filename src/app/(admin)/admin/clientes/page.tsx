import { db } from '@/lib/db'
import { ClientesLista } from '@/components/admin/clientes-lista'

export default async function ClientesPage() {
  const clientes = await db.cliente.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      _count: { select: { pedidos: true } },
      pedidos: {
        orderBy: { creadoEn: 'desc' },
        take: 1,
        select: { creadoEn: true, total: true, estado: true },
      },
    },
  })

  // Calcular total gastado (pedidos aprobados)
  const clientesConStats = await Promise.all(
    clientes.map(async c => {
      const agg = await db.pedido.aggregate({
        where: { clienteId: c.id, estadoPago: 'APROBADO' },
        _sum: { total: true },
      })
      return {
        ...c,
        totalGastado: agg._sum.total ?? 0,
        ultimoPedido: c.pedidos[0]
          ? { ...c.pedidos[0], creadoEn: c.pedidos[0].creadoEn.toISOString() }
          : null,
        creadoEn: c.creadoEn.toISOString(),
      }
    })
  )

  return <ClientesLista clientes={clientesConStats} />
}
