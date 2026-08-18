import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { categoriaSchema } from '@/lib/validations'
import { slugify } from '@/lib/utils'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const categorias = await db.categoria.findMany({
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    include: {
      _count: { select: { productos: { where: { activo: true } } } },
    },
  })
  return NextResponse.json(categorias)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (session.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })
  }

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

  // Auto-generar slug si no se provee
  const slug = data.slug || slugify(data.nombre)

  // Verificar unicidad
  const existe = await db.categoria.findFirst({
    where: { OR: [{ nombre: data.nombre }, { slug }] },
  })
  if (existe) {
    return NextResponse.json(
      { error: existe.nombre === data.nombre ? 'Ya existe una categoría con ese nombre' : 'Slug ya en uso' },
      { status: 409 }
    )
  }

  // Calcular orden siguiente
  const maxOrden = await db.categoria.aggregate({ _max: { orden: true } })
  const orden = data.orden ?? (maxOrden._max.orden ?? 0) + 1

  const categoria = await db.categoria.create({
    data: { ...data, slug, orden },
  })

  return NextResponse.json(categoria, { status: 201 })
}
