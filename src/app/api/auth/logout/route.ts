import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

export async function POST() {
  await clearSessionCookie()
  // Redirigir sin exponer URL interna del servidor
  const response = NextResponse.redirect(
    new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001')
  )
  // Limpiar cualquier cookie residual
  response.cookies.delete('highhopes_session')
  return response
}

// Prevenir acceso GET a logout
export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
}
