import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { pedidoEstadoSchema } from '@/lib/validations'
import { z } from 'zod'

const idSchema = z.string().min(1, 'ID inválido')

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const parsed = pedidoEstadoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Estado inválido' },
      { status: 400 }
    )
  }

  const pedido = await db.pedido.findUnique({ where: { id }, select: { id: true } })
  if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

  const updated = await db.pedido.update({
    where: { id },
    data: {
      estado: parsed.data.estado,
      historial: {
        create: {
          estado: parsed.data.estado,
          nota: `Actualizado por ${session.email ?? session.sub}`,
        },
      },
    },
    select: { estado: true },
  })

  return NextResponse.json({ estado: updated.estado })
}
