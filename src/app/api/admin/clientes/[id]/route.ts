import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!z.string().min(1).safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

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

  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const stats = await db.pedido.aggregate({
    where: { clienteId: id },
    _sum: { total: true },
    _count: { id: true },
    _avg: { total: true },
  })

  return NextResponse.json({
    ...cliente,
    stats: {
      totalPedidos: stats._count.id,
      totalGastado: stats._sum.total ?? 0,
      ticketPromedio: stats._avg.total ?? 0,
    },
  })
}
