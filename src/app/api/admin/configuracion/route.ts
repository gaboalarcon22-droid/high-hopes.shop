import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { configuracionSchema } from '@/lib/validations'

// Claves permitidas para evitar inyección de claves arbitrarias
const CLAVES_PERMITIDAS = [
  'STORE_NAME',
  'STORE_DESCRIPTION',
  'STORE_EMAIL',
  'STORE_ADDRESS',
  'STORE_PROVINCE',
  'WHATSAPP_NUMBER',
  'WHATSAPP_MESSAGE',
  'FOOTER_TEXT',
  'BANNER_ACTIVO',
  'BANNER_TEXTO',
  'ENVIO_GRATIS_DESDE',
  'MONEDA',
  'INSTAGRAM_URL',
  'FACEBOOK_URL',
  'FONDO_HERO',
  'FONDO_GRILLA',
  'FONDO_FOOTER',
] as const

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const configs = await db.configuracion.findMany()
  const resultado: Record<string, string> = {}

  // Valores por defecto
  for (const clave of CLAVES_PERMITIDAS) {
    resultado[clave] = ''
  }

  for (const c of configs) {
    resultado[c.clave] = c.valor
  }

  return NextResponse.json(resultado)
}

export async function PUT(req: NextRequest) {
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

  const parsed = configuracionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Solo guardar claves permitidas
  const entries = Object.entries(parsed.data).filter(([k]) =>
    (CLAVES_PERMITIDAS as readonly string[]).includes(k)
  )

  // Upsert en paralelo
  await Promise.all(
    entries.map(([clave, valor]) =>
      db.configuracion.upsert({
        where: { clave },
        update: { valor },
        create: { clave, valor },
      })
    )
  )

  return NextResponse.json({ ok: true, guardadas: entries.length })
}
