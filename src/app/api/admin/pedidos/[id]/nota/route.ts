import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

const notaSchema = z.object({
  nota: z.string().min(1, 'La nota no puede estar vacía').max(500).trim(),
  estado: z.enum(['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const pedido = await db.pedido.findUnique({ where: { id } })
  if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const parsed = notaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const { nota, estado } = parsed.data

  // Si se incluye un nuevo estado, actualizarlo también
  if (estado && estado !== pedido.estado) {
    await db.pedido.update({ where: { id }, data: { estado } })
  }

  const historial = await db.historialPedido.create({
    data: {
      pedidoId: id,
      estado: estado ?? pedido.estado,
      nota,
    },
  })

  return NextResponse.json(historial, { status: 201 })
}
