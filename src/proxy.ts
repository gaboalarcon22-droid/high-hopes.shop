import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

if (!process.env.JWT_SECRET) {
  throw new Error('[SEGURIDAD] JWT_SECRET no está configurado — el servidor no puede arrancar sin él')
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // La página de login no requiere autenticación
  if (pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get('highhopes_session')?.value

  if (!token) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)

    // Verificar que el payload tiene los campos esperados
    if (!payload.sub || !payload.rol) {
      throw new Error('Token malformado')
    }

    // Solo ADMIN y OPERADOR pueden acceder al panel
    if (payload.rol !== 'ADMIN' && payload.rol !== 'OPERADOR') {
      const loginUrl = new URL('/admin/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('highhopes_session')
      return response
    }

    return NextResponse.next()
  } catch {
    // Token inválido, expirado o manipulado
    const loginUrl = new URL('/admin/login', request.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('highhopes_session') // limpiar token inválido
    return response
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
