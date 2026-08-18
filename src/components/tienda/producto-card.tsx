'use client'

import Link from 'next/link'
import { formatPrecio } from '@/lib/utils'
import type { Producto, Categoria } from '@prisma/client'

interface Props {
  producto: Producto & { categoria: Categoria }
}

export function ProductoCard({ producto }: Props) {
  const imagenes: string[] = JSON.parse(producto.imagenes || '[]')
  const imagen = imagenes[0] ?? null
  const descuento = producto.precioAnterior
    ? Math.round((1 - producto.precio / producto.precioAnterior) * 100)
    : null

  return (
    <Link href={`/tienda/${producto.slug}`} className="pcard">
      <div className="pcard-img-wrap">
        {imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagen} alt={producto.nombre} className="pcard-img" />
        ) : (
          <div className="pcard-empty">
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {descuento && <span className="pcard-badge-off">-{descuento}%</span>}
        {producto.destacado && <span className="pcard-badge-top">★ TOP</span>}
        {producto.stock === 0 && (
          <div className="pcard-nostock">
            <span style={{ fontSize: 12, fontWeight: 600, color: '#666', letterSpacing: '0.05em' }}>SIN STOCK</span>
          </div>
        )}
      </div>

      <div className="pcard-info">
        <p className="pcard-cat">
          {producto.categoria.icono && <span style={{ marginRight: 4 }}>{producto.categoria.icono}</span>}
          {producto.categoria.nombre}
        </p>
        <h3 className="pcard-name">{producto.nombre}</h3>
        {producto.descripcionCorta && (
          <p className="pcard-desc">{producto.descripcionCorta}</p>
        )}
        <div className="pcard-footer">
          <div>
            <div className="pcard-price">{formatPrecio(producto.precio)}</div>
            {producto.precioAnterior && (
              <div className="pcard-price-old">{formatPrecio(producto.precioAnterior)}</div>
            )}
          </div>
          <span className="pcard-cta">Ver producto</span>
        </div>
      </div>
    </Link>
  )
}
