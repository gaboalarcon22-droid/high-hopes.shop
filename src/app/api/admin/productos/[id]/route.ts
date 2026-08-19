import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { productoSchema } from '@/lib/validations'
import { z } from 'zod'

async function requireAdmin() {
  const session = await getSession()
  if (!session || (session.rol !== 'ADMIN' && session.rol !== 'OPERADOR')) return null
  return session
}

const idSchema = z.string().min(1, 'ID inválido')

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const existente = await db.producto.findUnique({ where: { id } })
    if (!existente) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
    }

    const parsed = productoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { variantes, ...productoData } = parsed.data
    const skuLimpio = productoData.sku || null

    // Verificar slug único (si cambió)
    if (productoData.slug !== existente.slug) {
      const slugEnUso = await db.producto.findFirst({
        where: { slug: productoData.slug, id: { not: id } },
      })
      if (slugEnUso) return NextResponse.json({ error: 'Slug ya en uso' }, { status: 409 })
    }

    // Verificar SKU único (si cambió y no es nulo)
    if (skuLimpio && skuLimpio !== existente.sku) {
      const skuEnUso = await db.producto.findFirst({
        where: { sku: skuLimpio, id: { not: id } },
      })
      if (skuEnUso) return NextResponse.json({ error: 'SKU ya en uso por otro producto' }, { status: 409 })
    }

    // Eliminar variantes que ya no están en la lista
    const varianteIdsActuales = variantes?.filter(v => v.id).map(v => v.id as string) ?? []
    await db.variante.deleteMany({
      where: { productoId: id, id: { notIn: varianteIdsActuales } },
    })

    const producto = await db.producto.update({
      where: { id },
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
        variantes: {
          upsert: variantes?.map(v => ({
            where: { id: v.id ?? 'non-existent-id' },
            update: {
              nombre: v.nombre,
              valor: v.valor,
              precio: v.precio ? parseFloat(v.precio) : null,
              stock: parseInt(v.stock || '0'),
              sku: v.sku || null,
            },
            create: {
              nombre: v.nombre,
              valor: v.valor,
              precio: v.precio ? parseFloat(v.precio) : null,
              stock: parseInt(v.stock || '0'),
              sku: v.sku || null,
            },
          })) ?? [],
        },
      },
    })
    return NextResponse.json(producto)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PUT /api/admin/productos/:id]', msg)

    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      if (msg.includes('sku')) return NextResponse.json({ error: 'SKU ya en uso' }, { status: 409 })
      if (msg.includes('slug')) return NextResponse.json({ error: 'Slug ya en uso' }, { status: 409 })
      return NextResponse.json({ error: 'Datos duplicados: ' + msg }, { status: 409 })
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    if (session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })
    }

    const { id } = await params
    if (!idSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const producto = await db.producto.findUnique({
      where: { id },
      include: { _count: { select: { itemsPedido: true } } },
    })
    if (!producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

    // Si el producto ya fue vendido, no se puede borrar sin romper el
    // historial de pedidos — se desactiva en su lugar.
    if (producto._count.itemsPedido > 0) {
      return NextResponse.json(
        { error: 'Este producto tiene pedidos asociados y no se puede eliminar. Desactivalo desde el interruptor de la lista en su lugar.' },
        { status: 409 }
      )
    }

    await db.variante.deleteMany({ where: { productoId: id } })
    await db.producto.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[DELETE /api/admin/productos/:id]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
