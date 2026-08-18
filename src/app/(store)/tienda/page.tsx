import { db } from '@/lib/db'
import { ProductoCard } from '@/components/tienda/producto-card'
import { MobileFiltros } from '@/components/tienda/mobile-filtros'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ cat?: string; q?: string; orden?: string }>
}

export default async function TiendaPage({ searchParams }: Props) {
  const params = await searchParams
  const { cat, q, orden } = params

  const categorias = await db.categoria.findMany({
    where: { activa: true },
    orderBy: { orden: 'asc' },
  })

  const productos = await db.producto.findMany({
    where: {
      activo: true,
      ...(cat && { categoria: { slug: cat } }),
      ...(q && {
        OR: [
          { nombre: { contains: q } },
          { descripcionCorta: { contains: q } },
          { marca: { contains: q } },
        ],
      }),
    },
    include: { categoria: true },
    orderBy:
      orden === 'precio-asc'  ? { precio: 'asc' }
      : orden === 'precio-desc' ? { precio: 'desc' }
      : orden === 'nuevo'       ? { creadoEn: 'desc' }
      : { destacado: 'desc' },
  })

  const categoriaActiva = cat ? categorias.find(c => c.slug === cat) : null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <style>{`
        @media (max-width: 768px) {
          .tienda-content { padding: 0 14px 48px !important; }
          .cat-pills-wrap { padding: 0 14px !important; }
        }
        .cat-pills-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
        }
        .cat-pills-scroll::-webkit-scrollbar { display: none; }
        .cat-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          border: 1px solid rgba(255,255,255,0.08);
          color: #888;
          background: rgba(255,255,255,0.04);
        }
        .cat-pill:hover { color: #fff; border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.08); }
        .cat-pill.active { background: #c6ff1a; border-color: #c6ff1a; color: #0a0a0a; }
        .productos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          column-gap: 22px;
          row-gap: 40px;
        }
        @media (max-width: 768px) {
          .productos-grid { grid-template-columns: repeat(2, 1fr) !important; column-gap: 12px !important; row-gap: 24px !important; }
        }
        .sort-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sort-bar-count {
          font-size: 0.82rem;
          color: #555;
        }
      `}</style>

      {/* Hero compacto */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 32, paddingBottom: 28, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(198,255,26,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(198,255,26,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(26,107,63,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
          {categoriaActiva ? (
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              <span style={{ marginRight: 8 }}>{categoriaActiva.icono}</span>{categoriaActiva.nombre}
            </h1>
          ) : (
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Vestí lo que <span style={{ color: '#c6ff1a' }}>imaginás</span>
            </h1>
          )}
          {q && (
            <p style={{ color: '#666', fontSize: '0.88rem', marginTop: 8 }}>
              Resultados para: <span style={{ color: '#ccc', fontWeight: 600 }}>&quot;{q}&quot;</span>
            </p>
          )}
        </div>
      </div>

      {/* Pills categorías — visible en todos los tamaños */}
      <div className="cat-pills-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 28px 0' }}>
        <div className="cat-pills-scroll">
          <Link href="/tienda" className={`cat-pill${!cat ? ' active' : ''}`}>
            Todos
          </Link>
          {categorias.map(c => (
            <Link key={c.id} href={`/tienda?cat=${c.slug}${orden ? `&orden=${orden}` : ''}`} className={`cat-pill${cat === c.slug ? ' active' : ''}`}>
              {c.icono && <span>{c.icono}</span>}{c.nombre}
            </Link>
          ))}
        </div>
      </div>

      {/* Contenido — 100% grilla, sin sidebar */}
      <div className="tienda-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 28px 80px' }}>

        {/* Búsqueda + orden, visible en todos los tamaños */}
        <MobileFiltros
          categorias={categorias}
          categoriaActiva={cat}
          ordenActivo={orden}
        />

        {/* Barra de resultados */}
        <div className="sort-bar">
          <p className="sort-bar-count">
            {productos.length === 0
              ? 'Sin resultados'
              : `${productos.length} producto${productos.length !== 1 ? 's' : ''}`}
            {categoriaActiva && <span style={{ color: '#c6ff1a' }}> · {categoriaActiva.nombre}</span>}
            {q && <span> · &quot;{q}&quot;</span>}
          </p>
          {(cat || q) && (
            <Link href="/tienda" className="limpiar-filtros-link">
              Limpiar filtros ×
            </Link>
          )}
        </div>

        {productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: '1rem', color: '#666', marginBottom: 16 }}>No se encontraron productos.</p>
            <Link href="/tienda" style={{ fontSize: '0.87rem', color: '#c6ff1a', textDecoration: 'none', fontWeight: 600 }}>
              Ver todos los productos →
            </Link>
          </div>
        ) : (
          <div className="productos-grid">
            {productos.map(p => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
