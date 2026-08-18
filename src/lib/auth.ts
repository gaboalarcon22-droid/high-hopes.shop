import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'highhopes-fallback-secret-debe-cambiarse'
)

const COOKIE_NAME = 'highhopes_session'
const EXPIRES_IN = 60 * 60 * 8 // 8 horas (sesión de trabajo)

if (process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET === 'highhopes-fallback-secret-debe-cambiarse') {
  console.error('[SEGURIDAD] JWT_SECRET no está configurado en producción!')
}

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .setJti(crypto.randomUUID()) // ID único por token para futura revocación
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: ['HS256'], // solo aceptar HS256
    })
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRES_IN,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // expirar inmediatamente
    path: '/',
  })
}
