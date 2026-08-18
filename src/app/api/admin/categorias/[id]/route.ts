import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { categoriaSchema } from '@/lib/validations'
import { z } from 'zod'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

const idSchema = z.string().min(1, 'ID inválido')

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (session.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })
  }

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const existente = await db.categoria.findUnique({ where: { id } })
  if (!existente) return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const parsed = categoriaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Verificar unicidad de nombre y slug si cambiaron
  if (data.nombre !== existente.nombre || data.slug !== existente.slug) {
    const conflicto = await db.categoria.findFirst({
      where: {
        id: { not: id },
        OR: [{ nombre: data.nombre }, { slug: data.slug }],
      },
    })
    if (conflicto) {
      return NextResponse.json(
        { error: conflicto.nombre === data.nombre ? 'Nombre ya en uso' : 'Slug ya en uso' },
        { status: 409 }
      )
    }
  }

  const categoria = await db.categoria.update({ where: { id }, data })
  return NextResponse.json(categoria)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  // PATCH soporta: toggle activa, cambiar orden
  const patchSchema = z.object({
    activa: z.boolean().optional(),
    orden: z.number().int().min(0).optional(),
  })

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const categoria = await db.categoria.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(categoria)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (session.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })
  }

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  // Verificar que no tenga productos activos
  const productosActivos = await db.producto.count({
    where: { categoriaId: id, activo: true },
  })
  if (productosActivos > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: tiene ${productosActivos} producto(s) activo(s)` },
      { status: 409 }
    )
  }

  await db.categoria.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
