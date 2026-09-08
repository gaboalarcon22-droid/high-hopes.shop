import { db } from '@/lib/db'
import { ProductoCard } from '@/components/tienda/producto-card'
import Link from 'next/link'
import { parseFondo, fondoToStyle } from '@/lib/fondos'
import { LOGO_SIZE_PX, parseLogoTamano } from '@/lib/logo'

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

  const configs = await db.configuracion.findMany({ where: { clave: { in: ['FONDO_HERO', 'FONDO_GRILLA', 'LOGO_URL', 'LOGO_TAMANO'] } } })
  const configMap = Object.fromEntries(configs.map(c => [c.clave, c.valor]))
  const fondoHero = fondoToStyle(parseFondo('FONDO_HERO', configMap.FONDO_HERO))
  const fondoGrilla = fondoToStyle(parseFondo('FONDO_GRILLA', configMap.FONDO_GRILLA))
  const logoUrl = configMap.LOGO_URL || undefined
  const logoTamano = parseLogoTamano(configMap.LOGO_TAMANO)
  const heroLogo = LOGO_SIZE_PX[logoTamano]

  return (
    <div style={{ minHeight: '100vh', ...fondoGrilla }}>
      <style>{`
        @media (max-width: 768px) {
          .tienda-content { padding: 0 14px 48px !important; }
        }
        .productos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          column-gap: 18px;
          row-gap: 48px;
        }
        @media (max-width: 1100px) {
          .productos-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .productos-grid { grid-template-columns: repeat(2, 1fr) !important; column-gap: 12px !important; row-gap: 24px !important; }
        }
        .hero-logo-img { height:var(--hero-logo-h); width:auto; max-width:var(--hero-logo-w); object-fit:contain; margin:0 auto 18px; display:block; }
        @media (max-width: 768px) {
          .hero-logo-img { height:var(--hero-logo-h-mobile); max-width:var(--hero-logo-w-mobile); margin-bottom:14px; }
        }
      `}</style>

      {/* Hero compacto */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 32, paddingBottom: 28, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', ...fondoHero }}>
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
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="High Hopes"
              className="hero-logo-img"
              style={{
                ['--hero-logo-h' as string]: `${heroLogo.hero}px`,
                ['--hero-logo-h-mobile' as string]: `${heroLogo.heroMobile}px`,
                ['--hero-logo-w' as string]: `${heroLogo.heroMaxWidth}px`,
                ['--hero-logo-w-mobile' as string]: `${heroLogo.heroMaxWidthMobile}px`,
              }}
            />
          )}
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

      {/* Contenido — 100% grilla, prioridad total a los productos */}
      <div className="tienda-content" style={{ maxWidth: 1800, margin: '0 auto', padding: '32px 24px 80px' }}>

        {(cat || q) && (
          <div style={{ marginBottom: 20 }}>
            <Link href="/tienda" className="limpiar-filtros-link">
              ← Ver todos los productos
            </Link>
          </div>
        )}

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
