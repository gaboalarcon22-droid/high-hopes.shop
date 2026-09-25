'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/cart-store'
import { formatPrecio, generarMensajeWhatsApp } from '@/lib/utils'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'

export function CarritoView({ whatsappNumber }: { whatsappNumber: string }) {
  const { items, quitar, actualizar, vaciar, totalPrecio } = useCartStore()

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '80px 24px', textAlign: 'center' }}>
        <ShoppingBag style={{ width: 64, height: 64, color: '#333', marginBottom: 20 }} />
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: 10 }}>Tu carrito está vacío</h1>
        <p style={{ color: '#888', marginBottom: 32 }}>Explorá nuestra tienda y agregá productos.</p>
        <Link href="/tienda" className="btn-ver-productos">
          Ver productos <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    )
  }

  const total = totalPrecio()
  const whatsappItems = items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio }))
  const whatsappUrl = generarMensajeWhatsApp(whatsappItems, total, whatsappNumber)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 28px 80px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginBottom: 40 }}>Mi carrito</h1>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Items */}
        <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map(item => (
            <div key={`${item.productoId}-${item.varianteId}`} className="carrito-item">
              <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0, background: '#181818', borderRadius: 10, overflow: 'hidden' }}>
                {item.imagen
                  ? <Image src={item.imagen} alt={item.nombre} fill style={{ objectFit: 'contain', padding: 8 }} />
                  : <div style={{ width: '100%', height: '100%', background: '#222' }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', lineHeight: 1.3, marginBottom: 4 }}>{item.nombre}</p>
                {item.variante && <p style={{ fontSize: '0.8rem', color: '#666' }}>{item.variante}</p>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
                    <button className="qty-btn" onClick={() => actualizar(item.productoId, item.cantidad - 1, item.varianteId)}>
                      <Minus style={{ width: 12, height: 12 }} />
                    </button>
                    <span style={{ width: 36, textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{item.cantidad}</span>
                    <button className="qty-btn" onClick={() => actualizar(item.productoId, item.cantidad + 1, item.varianteId)}>
                      <Plus style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{formatPrecio(item.precio * item.cantidad)}</span>
                    <button className="btn-trash" onClick={() => quitar(item.productoId, item.varianteId)}>
                      <Trash2 style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'right', paddingTop: 4 }}>
            <button className="btn-vaciar" onClick={vaciar}>Vaciar carrito</button>
          </div>
        </div>

        {/* Resumen */}
        <div style={{ width: 320, flexShrink: 0, position: 'sticky', top: 96 }}>
          <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px 22px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: 18 }}>Resumen del pedido</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {items.map(i => (
                <div key={`${i.productoId}-${i.varianteId}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}>
                  <span style={{ flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.nombre} ×{i.cantidad}</span>
                  <span style={{ flexShrink: 0 }}>{formatPrecio(i.precio * i.cantidad)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: 20 }}>
              <span>Total</span>
              <span>{formatPrecio(total)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/checkout" className="btn-checkout">
                Ir al checkout <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-wa-outline">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Finalizar por WhatsApp
              </a>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#555', textAlign: 'center', marginTop: 14 }}>Envío calculado al confirmar el pedido</p>
          </div>
        </div>
      </div>
    </div>
  )
}
