'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatPrecio } from '@/lib/utils'
import type { Producto, Categoria } from '@prisma/client'

// Ancho que ocupa la remera dentro de la tarjeta (medido sobre el mockup del gato).
const ANCHO_REMERA = 0.92

// Mide el recuadro que ocupa la prenda en la captura y devuelve la transformación
// que la deja del mismo tamaño y centrada en todas las tarjetas.
function useNormalizar(src: string | null, activo: boolean) {
  const [transform, setTransform] = useState<string | undefined>()
  useEffect(() => {
    if (!src || !activo) return
    let cancelado = false
    const img = new Image()
    img.onload = () => {
      if (cancelado) return
      const W = 160
      const H = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * W))
      const c = document.createElement('canvas')
      c.width = W; c.height = H
      const ctx = c.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(img, 0, 0, W, H)
      const d = ctx.getImageData(0, 0, W, H).data
      const bg = [d[0], d[1], d[2]]
      const transparente = d[3] < 10
      let x0 = W, x1 = -1, y0 = H, y1 = -1
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4
        const diff = Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2])
        const hay = transparente ? d[i + 3] > 40 : diff > 90
        if (hay) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
      }
      if (x1 < 0 || x1 - x0 < W * 0.2) return
      const bw = (x1 - x0 + 1) / W
      const cx = (x0 + x1 + 1) / 2 / W
      // La captura no es 4:5: se muestra con object-fit:contain, centrada verticalmente.
      const ocupaAlto = (img.naturalHeight / img.naturalWidth) / 1.25
      const cy = 0.5 + ((y0 + y1 + 1) / 2 / H - 0.5) * ocupaAlto
      const sc = Math.min(1.8, Math.max(0.6, ANCHO_REMERA / bw))
      setTransform(`translate(${((0.5 - cx * sc) * 100).toFixed(2)}%, ${((0.5 - cy * sc) * 100).toFixed(2)}%) scale(${sc.toFixed(3)})`)
    }
    img.src = src
    return () => { cancelado = true }
  }, [src, activo])
  return transform
}

interface Props {
  producto: Producto & { categoria: Categoria }
}

export function ProductoCard({ producto }: Props) {
  const imagenes: string[] = JSON.parse(producto.imagenes || '[]')
  const imagen = imagenes[0] ?? null
  const normalizar = useNormalizar(imagen, !!producto.mockup3d)
  const descuento = producto.precioAnterior
    ? Math.round((1 - producto.precio / producto.precioAnterior) * 100)
    : null

  return (
    <Link href={`/tienda/${producto.slug}`} className="pcard">
      <div className="pcard-img-wrap" style={producto.mockup3d ? { background: '#e9e9e9' } : undefined}>
        {imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <div style={{ width: '100%', height: '100%', transformOrigin: '0 0', transform: normalizar }}>
            <img src={imagen} alt={producto.nombre} className="pcard-img" style={producto.mockup3d ? { objectFit: 'contain' } : undefined} />
          </div>
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
