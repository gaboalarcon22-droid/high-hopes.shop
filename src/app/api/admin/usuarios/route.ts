import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { usuarioCreateSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.rol !== 'ADMIN') return null
  return session
}

export async function GET() {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })

  const usuarios = await db.usuario.findMany({
    orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      activo: true,
      creadoEn: true,
      // nunca exponer password
    },
  })
  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await requireSuperAdmin()
  if (!session) return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const parsed = usuarioCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const { email, nombre, rol, password } = parsed.data

  // Email único
  const existente = await db.usuario.findUnique({ where: { email } })
  if (existente) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const usuario = await db.usuario.create({
    data: { email, nombre, rol, password: hashedPassword },
    select: { id: true, email: true, nombre: true, rol: true, activo: true, creadoEn: true },
  })

  return NextResponse.json(usuario, { status: 201 })
}
