import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

// 60 requests por minuto por IP
const RATE_LIMIT = { windowMs: 60 * 1000, max: 60 }

const querySchema = z.object({
  cat: z.string().max(100).optional(),
  q: z.string().max(200).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const limit = rateLimit(`productos:${ip}`, RATE_LIMIT)
  if (!limit.success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse({
    cat: searchParams.get('cat') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    take: searchParams.get('take') ?? 50,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { cat, q, take } = parsed.data

  const productos = await db.producto.findMany({
    where: {
      activo: true,
      ...(cat && { categoria: { slug: cat } }),
      ...(q && {
        OR: [
          { nombre: { contains: q } },
          { descripcionCorta: { contains: q } },
        ],
      }),
    },
    include: { categoria: true, variantes: { where: { activa: true } } },
    take,
    orderBy: { destacado: 'desc' },
  })

  return NextResponse.json(productos)
}
