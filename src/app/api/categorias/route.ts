import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const categorias = await db.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: 'asc' },
  })
  return NextResponse.json(categorias)
}
