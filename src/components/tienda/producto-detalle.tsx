'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPrecio } from '@/lib/utils'
import { ProductoCard } from '@/components/tienda/producto-card'
import { MessageCircle, ChevronLeft, Minus, Plus, Rotate3d, Image as ImageIcon } from 'lucide-react'
import type { Producto, Categoria, Variante } from '@prisma/client'
import { ProductMockupViewer } from '@/components/mockup3d/ProductMockupViewer'
import type { Mockup3DConfig } from '@/components/mockup3d/Mockup3DModal'
import { parseFondoValue, fondoToStyle, FONDO_PRODUCTO_DEFAULT } from '@/lib/fondos'

interface Props {
  producto: Producto & { categoria: Categoria; variantes: Variante[] }
  imagenes: string[]
  relacionados: (Producto & { categoria: Categoria })[]
}

export function ProductoDetalle({ producto, imagenes, relacionados }: Props) {
  const mockup3d: Mockup3DConfig | null = producto.mockup3d ? JSON.parse(producto.mockup3d) : null
  const fondoProducto = producto.fondo ? parseFondoValue(producto.fondo, FONDO_PRODUCTO_DEFAULT) : null
  const [imagenActiva, setImagenActiva] = useState(0)
  // Si el producto tiene mockup 3D, arranca mostrando el 3D en vez de la foto.
  const [modo3D, setModo3D] = useState(!!mockup3d)
  const [varianteId, setVarianteId] = useState<string | undefined>()
  const [cantidad, setCantidad] = useState(1)

  const varianteActiva = producto.variantes.find(v => v.id === varianteId)
  const precioFinal = varianteActiva?.precio
    ? producto.precio + varianteActiva.precio
    : producto.precio

  const whatsappMsg = encodeURIComponent(
    `Hola! Quiero finalizar la compra de: *${producto.nombre}*${varianteActiva ? ` (${varianteActiva.nombre}: ${varianteActiva.valor})` : ''}. Cantidad: ${cantidad}. Precio: $${precioFinal.toLocaleString('es-AR')}. ¿Cómo seguimos?`
  )
  const whatsappUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5491100000000'}?text=${whatsappMsg}`

  return (
    <div>
      <style>{`
        @media (max-width: 900px) {
          .pdp-grid { grid-template-columns: 1fr !important; }
          .pdp-gallery { position: static !important; flex-direction: column-reverse !important; height: auto !important; }
          .pdp-thumbs { flex-direction: row !important; width: 100% !important; overflow-x: auto !important; }
          .pdp-thumbs button { width: 64px !important; flex-shrink: 0; }
        }
      `}</style>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#888', marginBottom: 32 }}>
        <Link href="/tienda" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#c6ff1a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
          <ChevronLeft style={{ width: 15, height: 15 }} /> Tienda
        </Link>
        <span style={{ color: '#444' }}>/</span>
        <Link href={`/tienda?cat=${producto.categoria.slug}`} style={{ color: '#888', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#c6ff1a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888')}>
          {producto.categoria.nombre}
        </Link>
        <span style={{ color: '#444' }}>/</span>
        <span style={{ color: '#cccccc', fontWeight: 500 }}>{producto.nombre}</span>
      </nav>

      <div className="pdp-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 40, alignItems: 'flex-start' }}>
        {/* Galería — imagen grande + riel de miniaturas, sticky mientras se scrollea la info */}
        <div className="pdp-gallery" style={{ position: 'sticky', top: 88, display: 'flex', gap: 12, height: 'min(62vh, 540px)' }}>
          {imagenes.length > 1 && (
            <div className="pdp-thumbs" style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, width: 76 }}>
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImagenActiva(i)}
                  style={{
                    flexShrink: 0, width: 76, aspectRatio: '4/5', borderRadius: 8, overflow: 'hidden',
                    border: `2px solid ${imagenActiva === i ? '#c6ff1a' : 'rgba(255,255,255,0.1)'}`,
                    background: '#131313', cursor: 'pointer', padding: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
          <div style={{
            position: 'relative', aspectRatio: '4/5', height: '100%', borderRadius: 12,
            ...(fondoProducto ? fondoToStyle(fondoProducto) : { background: modo3D ? '#e9e9e9' : '#131313' }),
            border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {mockup3d && (
              <button
                type="button"
                onClick={() => setModo3D(m => !m)}
                style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 5,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: modo3D ? '#0a0a0a' : '#c6ff1a',
                  color: modo3D ? '#c6ff1a' : '#0a0a0a',
                  fontSize: '0.78rem', fontWeight: 700,
                }}
              >
                {modo3D ? <><ImageIcon size={14} /> Ver foto</> : <><Rotate3d size={14} /> Ver en 3D</>}
              </button>
            )}
            {modo3D && mockup3d ? (
              <ProductMockupViewer config={mockup3d} />
            ) : imagenes[imagenActiva] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagenes[imagenActiva]}
                alt={producto.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <svg style={{ width: 80, height: 80, color: '#333' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {modo3D && (
              <span style={{
                position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                fontSize: '0.72rem', color: '#555', background: 'rgba(255,255,255,0.7)',
                padding: '4px 10px', borderRadius: 999, pointerEvents: 'none', whiteSpace: 'nowrap',
              }}>
                Arrastrá para rotar · Pellizcá para zoom
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Badge categoría */}
          <span style={{
            display: 'inline-block', width: 'fit-content', marginBottom: 12,
            padding: '4px 12px', borderRadius: 999,
            background: 'rgba(198,255,26,0.12)', border: '1px solid rgba(198,255,26,0.25)',
            color: '#c6ff1a', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.03em',
          }}>
            {producto.categoria.nombre}
          </span>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
            {producto.nombre}
          </h1>

          {producto.marca && (
            <p style={{ fontSize: '0.88rem', color: '#888', marginBottom: 16 }}>
              Marca: <span style={{ color: '#cccccc', fontWeight: 500 }}>{producto.marca}</span>
            </p>
          )}

          {/* Precio */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{formatPrecio(precioFinal)}</span>
            {producto.precioAnterior && (
              <span style={{ fontSize: '1.1rem', color: '#555', textDecoration: 'line-through' }}>
                {formatPrecio(producto.precioAnterior)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div style={{ marginBottom: 20 }}>
            {producto.stock > 0 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: '#c6ff1a', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c6ff1a', flexShrink: 0 }} />
                En stock ({producto.stock} disponibles)
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: '#e55', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e55', flexShrink: 0 }} />
                Sin stock
              </span>
            )}
          </div>

          {/* Variantes */}
          {producto.variantes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ccc', marginBottom: 8 }}>
                {producto.variantes[0].nombre}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {producto.variantes.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVarianteId(varianteId === v.id ? undefined : v.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: `2px solid ${varianteId === v.id ? '#c6ff1a' : 'rgba(255,255,255,0.12)'}`,
                      background: varianteId === v.id ? 'rgba(198,255,26,0.12)' : 'transparent',
                      color: varianteId === v.id ? '#c6ff1a' : '#ccc',
                    }}
                  >
                    {v.valor}
                    {v.precio ? <span style={{ marginLeft: 4, fontSize: '0.78rem', color: '#888' }}>+{formatPrecio(v.precio)}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ccc', marginBottom: 8 }}>Cantidad</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                style={{
                  width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#ccc', cursor: 'pointer',
                }}
              >
                <Minus style={{ width: 14, height: 14 }} />
              </button>
              <span style={{ width: 32, textAlign: 'center', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{cantidad}</span>
              <button
                onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                disabled={producto.stock === 0}
                style={{
                  width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#ccc', cursor: 'pointer',
                  opacity: producto.stock === 0 ? 0.4 : 1,
                }}
              >
                <Plus style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* Botón WhatsApp */}
          <div style={{ marginBottom: 32 }}>
            <a
              href={producto.stock === 0 ? undefined : whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', pointerEvents: producto.stock === 0 ? 'none' : 'auto' }}
            >
              <button
                disabled={producto.stock === 0}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '16px 0', borderRadius: 12, cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: producto.stock === 0 ? '#1a1a1a' : '#25D366',
                  color: producto.stock === 0 ? '#555' : '#fff',
                  fontWeight: 700, fontSize: '1rem', transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (producto.stock > 0) (e.currentTarget as HTMLButtonElement).style.background = '#20bd5a' }}
                onMouseLeave={e => { if (producto.stock > 0) (e.currentTarget as HTMLButtonElement).style.background = '#25D366' }}
              >
                <MessageCircle style={{ width: 20, height: 20 }} />
                Finalizar venta via WhatsApp
              </button>
            </a>
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
              <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: 12 }}>Descripción</h3>
              <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {producto.descripcion}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <div style={{ marginTop: 64 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 24 }}>Productos relacionados</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {relacionados.map(p => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
