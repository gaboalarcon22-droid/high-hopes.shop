import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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

  // Calcular total gastado por cliente
  const clientesConStats = await Promise.all(
    clientes.map(async c => {
      const stats = await db.pedido.aggregate({
        where: { clienteId: c.id, estadoPago: 'APROBADO' },
        _sum: { total: true },
      })
      return {
        ...c,
        totalGastado: stats._sum.total ?? 0,
        ultimoPedido: c.pedidos[0] ?? null,
      }
    })
  )

  return NextResponse.json(clientesConStats)
}
