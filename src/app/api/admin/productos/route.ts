import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { productoSchema } from '@/lib/validations'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) {
    return null
  }
  return session
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }

    const parsed = productoSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos del producto inválidos'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { variantes, ...productoData } = parsed.data

    // Verificar que la categoría existe
    const categoria = await db.categoria.findUnique({ where: { id: productoData.categoriaId } })
    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
    }

    // Verificar slug único
    const existente = await db.producto.findUnique({ where: { slug: productoData.slug } })
    if (existente) {
      return NextResponse.json({ error: 'Ya existe un producto con ese slug' }, { status: 409 })
    }

    // Verificar SKU único (solo si se proporcionó uno)
    const skuLimpio = productoData.sku || null
    if (skuLimpio) {
      const skuExistente = await db.producto.findUnique({ where: { sku: skuLimpio } })
      if (skuExistente) {
        return NextResponse.json({ error: 'Ya existe un producto con ese SKU' }, { status: 409 })
      }
    }

    const producto = await db.producto.create({
      data: {
        nombre: productoData.nombre,
        slug: productoData.slug,
        descripcion: productoData.descripcion || null,
        descripcionCorta: productoData.descripcionCorta || null,
        precio: productoData.precio,
        precioAnterior: productoData.precioAnterior ?? null,
        stock: productoData.stock,
        stockMinimo: productoData.stockMinimo,
        sku: skuLimpio,
        marca: productoData.marca || null,
        imagenes: productoData.imagenes,
        destacado: productoData.destacado ?? false,
        activo: productoData.activo ?? true,
        categoriaId: productoData.categoriaId,
        peso: productoData.peso ?? null,
        tags: productoData.tags,
        dimensiones: productoData.dimensiones || null,
        mockup3d: productoData.mockup3d || null,
        fondo: productoData.fondo || null,
        variantes: variantes?.length ? {
          create: variantes.map(v => ({
            nombre: v.nombre,
            valor: v.valor,
            precio: v.precio ? parseFloat(v.precio) : null,
            stock: parseInt(v.stock || '0'),
            sku: v.sku || null,
          })),
        } : undefined,
      },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/admin/productos]', msg)

    // Mensajes más claros para errores comunes de Prisma/PostgreSQL
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      if (msg.includes('sku')) return NextResponse.json({ error: 'Ya existe un producto con ese SKU' }, { status: 409 })
      if (msg.includes('slug')) return NextResponse.json({ error: 'Ya existe un producto con ese slug' }, { status: 409 })
      return NextResponse.json({ error: 'Datos duplicados: ' + msg }, { status: 409 })
    }
    if (msg.includes('connect') || msg.includes('Connection')) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 503 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
