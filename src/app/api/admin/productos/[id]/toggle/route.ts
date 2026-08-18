import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const idSchema = z.string().min(1, 'ID inválido')

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const producto = await db.producto.findUnique({ where: { id }, select: { activo: true } })
  if (!producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  const updated = await db.producto.update({
    where: { id },
    data: { activo: !producto.activo },
    select: { activo: true },
  })
  return NextResponse.json({ activo: updated.activo })
}
