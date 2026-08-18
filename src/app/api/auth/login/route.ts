import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signToken, setSessionCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

// 5 intentos por 15 minutos por IP
const RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 }

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'

  const limit = rateLimit(`login:${ip}`, RATE_LIMIT)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT.max),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la solicitud inválido' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  // Mensaje genérico para no revelar si el email existe
  const INVALID_MSG = 'Credenciales inválidas'

  const usuario = await db.usuario.findUnique({ where: { email } })

  // Siempre ejecutar bcrypt aunque no haya usuario para prevenir timing attacks
  const fakeHash = '$2b$12$invalidhashtopreventtimingattacks000000000000000000000'
  const valid = await bcrypt.compare(password, usuario?.password ?? fakeHash)

  if (!usuario || !usuario.activo || !valid) {
    return NextResponse.json({ error: INVALID_MSG }, { status: 401 })
  }

  const token = await signToken({
    sub: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    iat: Math.floor(Date.now() / 1000),
  })
  await setSessionCookie(token)

  return NextResponse.json({ ok: true, rol: usuario.rol })
}
