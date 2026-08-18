import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { usuarioUpdateSchema } from '@/lib/validations'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.rol !== 'ADMIN') return null
  return session
}

const idSchema = z.string().min(1, 'ID inválido')

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const usuario = await db.usuario.findUnique({ where: { id } })
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const parsed = usuarioUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const { nombre, rol, activo, password } = parsed.data

  // Protección: no puede desactivar ni quitar rol ADMIN al último admin
  if ((activo === false || rol === 'OPERADOR') && usuario.rol === 'ADMIN') {
    const totalAdmins = await db.usuario.count({ where: { rol: 'ADMIN', activo: true } })
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { error: 'No se puede modificar el único administrador activo' },
        { status: 409 }
      )
    }
  }

  const updateData: Record<string, unknown> = {}
  if (nombre !== undefined) updateData.nombre = nombre
  if (rol !== undefined) updateData.rol = rol
  if (activo !== undefined) updateData.activo = activo
  if (password) updateData.password = await bcrypt.hash(password, 12)

  const actualizado = await db.usuario.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, nombre: true, rol: true, activo: true, creadoEn: true },
  })

  return NextResponse.json(actualizado)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PATCH: toggle activo únicamente
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })

  const { id } = await params
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const usuario = await db.usuario.findUnique({ where: { id } })
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // No puede desactivarse a sí mismo
  if (String(session.sub) === id && usuario.activo) {
    return NextResponse.json({ error: 'No podés desactivar tu propio usuario' }, { status: 409 })
  }

  // Protección: último admin activo
  if (usuario.rol === 'ADMIN' && usuario.activo) {
    const totalAdmins = await db.usuario.count({ where: { rol: 'ADMIN', activo: true } })
    if (totalAdmins <= 1) {
      return NextResponse.json(
        { error: 'No se puede desactivar el único administrador activo' },
        { status: 409 }
      )
    }
  }

  const actualizado = await db.usuario.update({
    where: { id },
    data: { activo: !usuario.activo },
    select: { id: true, email: true, nombre: true, rol: true, activo: true, creadoEn: true },
  })

  return NextResponse.json(actualizado)
}
