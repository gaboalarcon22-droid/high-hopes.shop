import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

const idSchema = z.string().min(1, 'ID inválido')

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

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

  if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  return NextResponse.json(pedido)
}
