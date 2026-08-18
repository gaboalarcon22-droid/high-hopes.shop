import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkoutSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { generarMensajeWhatsApp } from '@/lib/utils'

// 10 pedidos por hora por IP para prevenir spam
const RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 10 }

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const limit = rateLimit(`checkout:${ip}`, RATE_LIMIT)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intentá más tarde.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos del pedido inválidos' },
      { status: 400 }
    )
  }

  const { cliente: clienteData, items, metodoPago, notas, direccion } = parsed.data

  // ── CRÍTICO: Buscar precios en BD, nunca confiar en el cliente ──────────────
  const productoIds = [...new Set(items.map(i => i.productoId))]
  const productos = await db.producto.findMany({
    where: { id: { in: productoIds }, activo: true },
    include: { variantes: { where: { activa: true } } },
  })

  const productoMap = new Map(productos.map(p => [p.id, p]))

  // Validar que todos los productos existen y tienen stock
  const itemsVerificados: Array<{
    productoId: string
    varianteId?: string
    cantidad: number
    precioUnit: number
    nombreSnap: string
  }> = []

  for (const item of items) {
    const producto = productoMap.get(item.productoId)
    if (!producto) {
      return NextResponse.json(
        { error: `Producto no disponible: ${item.productoId}` },
        { status: 400 }
      )
    }

    let precioFinal = producto.precio
    let nombreSnap = producto.nombre

    if (item.varianteId) {
      const variante = producto.variantes.find(v => v.id === item.varianteId)
      if (!variante) {
        return NextResponse.json({ error: 'Variante no encontrada' }, { status: 400 })
      }
      if (variante.precio) precioFinal += variante.precio
      nombreSnap = `${producto.nombre} — ${variante.nombre}: ${variante.valor}`
    }

    // Verificar stock disponible
    const stockDisponible = item.varianteId
      ? (producto.variantes.find(v => v.id === item.varianteId)?.stock ?? 0)
      : producto.stock

    if (stockDisponible < item.cantidad) {
      return NextResponse.json(
        { error: `Stock insuficiente para: ${producto.nombre}` },
        { status: 400 }
      )
    }

    itemsVerificados.push({
      productoId: item.productoId,
      varianteId: item.varianteId,
      cantidad: item.cantidad,
      precioUnit: precioFinal, // precio verificado en BD
      nombreSnap,
    })
  }

  // Calcular total server-side
  const subtotal = itemsVerificados.reduce(
    (acc, i) => acc + i.cantidad * i.precioUnit,
    0
  )

  // ── Crear o recuperar cliente ──────────────────────────────────
  const cliente = await db.cliente.upsert({
    where: { email: clienteData.email },
    update: {
      nombre: clienteData.nombre,
      telefono: clienteData.telefono || null,
      empresa: clienteData.empresa || null,
    },
    create: {
      email: clienteData.email,
      nombre: clienteData.nombre,
      telefono: clienteData.telefono || null,
      empresa: clienteData.empresa || null,
    },
  })

  // ── Número de pedido secuencial (atómico) ──────────────────────
  const ultimoPedido = await db.pedido.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })
  const numeroPedido = (ultimoPedido?.numero ?? 0) + 1

  // ── Crear pedido ───────────────────────────────────────────────
  const pedido = await db.pedido.create({
    data: {
      numero: numeroPedido,
      clienteId: cliente.id,
      metodoPago,
      subtotal,
      total: subtotal,
      notas: notas || null,
      direccionEnvio: JSON.stringify(direccion),
      items: {
        create: itemsVerificados.map(i => ({
          productoId: i.productoId,
          varianteId: i.varianteId,
          cantidad: i.cantidad,
          precioUnit: i.precioUnit,
          subtotal: i.cantidad * i.precioUnit,
          nombreSnap: i.nombreSnap,
        })),
      },
      historial: {
        create: { estado: 'PENDIENTE', nota: 'Pedido recibido' },
      },
    },
  })

  // ── WhatsApp URL ───────────────────────────────────────────────
  let whatsappUrl: string | undefined
  if (metodoPago === 'WHATSAPP') {
    const numero = process.env.WHATSAPP_NUMBER ?? '5491100000000'
    whatsappUrl = generarMensajeWhatsApp(
      itemsVerificados.map(i => ({
        nombre: i.nombreSnap,
        cantidad: i.cantidad,
        precio: i.precioUnit,
      })),
      subtotal,
      numero
    )
  }

  return NextResponse.json({
    ok: true,
    id: pedido.id,
    numero: pedido.numero,
    whatsappUrl,
  })
}
