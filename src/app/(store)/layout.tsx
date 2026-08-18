import { StoreHeader } from '@/components/layout/store-header'

export const dynamic = 'force-dynamic'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      <StoreHeader />
      <main style={{ flex: 1, paddingTop: '72px' }}>
        {children}
      </main>

      {/* Footer HC style */}
      <footer style={{ background: '#111111', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '64px 0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>

            {/* Brand */}
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', marginBottom: 12 }}>
                High<span style={{ color: '#2ea05a' }}> Hopes</span>
              </div>
              <p style={{ fontSize: '0.87rem', color: '#888', lineHeight: 1.7 }}>
                Remeras, buzos y estampas personalizadas — diseñá tu mockup 3D en tiempo real.
              </p>
            </div>

            {/* Categorías */}
            <div>
              <h4 className="footer-section-title">Categorías</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { href: '/tienda?cat=remeras',        label: '👕 Remeras' },
                  { href: '/tienda?cat=buzos',           label: '🧥 Buzos' },
                  { href: '/tienda?cat=oversize',        label: '👔 Oversize' },
                  { href: '/tienda?cat=personalizados',  label: '🎨 Personalizados' },
                  { href: '/tienda?cat=accesorios',      label: '🔧 Accesorios' },
                ].map(l => (
                  <li key={l.href}>
                    <a href={l.href} className="footer-link">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="footer-section-title">Empresa</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li><a href="/tienda" className="footer-link">Tienda</a></li>
                <li><a href="/carrito" className="footer-link">Mi carrito</a></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="footer-section-title">Contacto</h4>
              <p style={{ fontSize: '0.87rem', color: '#888', marginBottom: 14 }}>¿Dudas sobre un producto?</p>
              <a
                href={`https://wa.me/5491100000000?text=Hola,%20quiero%20consultar%20sobre%20un%20producto`}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-wa-btn"
              >
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: '0.8rem', color: '#555' }}>
              © {new Date().getFullYear()} High Hopes
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="#" className="footer-legal-link">Privacidad</a>
              <a href="#" className="footer-legal-link">Términos</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Botón flotante WhatsApp */}
      <a
        href="https://wa.me/5491100000000?text=Hola%2C%20quiero%20consultar%20sobre%20un%20producto"
        target="_blank"
        rel="noopener noreferrer"
        className="wa-float-btn"
        aria-label="Contactar por WhatsApp"
      >
        <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      <style>{`
        .footer-section-title {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 16px;
        }
        .footer-link {
          font-size: 0.87rem;
          color: #888;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: #2ea05a; }
        .footer-legal-link {
          font-size: 0.8rem;
          color: #555;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-legal-link:hover { color: #888; }
        .wa-float-btn {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #25d366;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 24px rgba(37,211,102,0.35), 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          text-decoration: none;
        }
        .wa-float-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 32px rgba(37,211,102,0.5), 0 2px 8px rgba(0,0,0,0.3);
        }
        .wa-float-btn::before {
          content: '';
          position: absolute;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(37,211,102,0.35);
          animation: wa-pulse 2s ease-out infinite;
        }
        @keyframes wa-pulse {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @media (max-width: 768px) {
          .wa-float-btn { bottom: 20px; right: 16px; width: 52px; height: 52px; }
          .wa-float-btn::before { width: 52px; height: 52px; }
        }
        .footer-wa-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 10px;
          background: #1a6b3f;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s;
        }
        .footer-wa-btn:hover { background: #2ea05a; }
      `}</style>
    </div>
  )
}
