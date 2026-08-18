'use client'

import Link from 'next/link'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/lib/cart-store'

const NAV_LINKS = [
  { href: '/tienda', label: 'Tienda' },
  { href: '/tienda?cat=remeras', label: 'Remeras' },
  { href: '/tienda?cat=buzos', label: 'Buzos' },
  { href: '/tienda?cat=oversize', label: 'Oversize' },
  { href: '/tienda?cat=personalizados', label: 'Personalizados' },
]

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const totalItems = useCartStore(s => s.items.reduce((acc, i) => acc + i.cantidad, 0))

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <style>{`
        .store-nav { position:fixed; top:0; left:0; right:0; z-index:1000; transition:all 0.3s ease; }
        .store-nav.scrolled {
          background: rgba(10,10,10,0.94);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 12px 0 !important;
        }
        .store-nav-inner { max-width:1200px; margin:0 auto; padding:0 28px; display:flex; align-items:center; justify-content:space-between; }
        .store-nav-logo { display:flex; align-items:center; gap:10px; text-decoration:none; font-weight:800; font-size:1.15rem; letter-spacing:-0.01em; }
        .store-nav-links { display:flex; align-items:center; gap:28px; }
        @media(max-width:768px){ .store-nav-links{ display:none; } .hamburger-btn{ display:flex !important; } }
        .hamburger-btn { display:none; padding:8px; background:none; border:none; color:#ccc; cursor:pointer; }
        .mobile-nav { border-top:1px solid rgba(255,255,255,0.07); margin-top:12px; padding-top:12px; display:flex; flex-direction:column; gap:4px; }
        .mobile-nav-link { padding:10px 12px; font-size:0.9rem; color:#ccc; text-decoration:none; border-radius:8px; display:block; transition:background 0.2s; }
        .mobile-nav-link:hover { background:rgba(255,255,255,0.06); color:#fff; }
        .nav-link { font-size:0.87rem; color:#888; text-decoration:none; transition:color 0.2s; font-weight:500; }
        .nav-link:hover { color:#fff; }
        .cart-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          color: #ccc;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .cart-btn:hover { background: rgba(198,255,26,0.12); border-color: rgba(198,255,26,0.3); color: #c6ff1a; }
        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 18px;
          height: 18px;
          background: #c6ff1a;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #0a0a0a;
          line-height: 1;
        }
      `}</style>

      <header className={`store-nav${scrolled ? ' scrolled' : ''}`} style={{ padding: '18px 0' }}>
        <div className="store-nav-inner">

          <Link href="/tienda" className="store-nav-logo">
            <span style={{ color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>High<span style={{ color: '#c6ff1a' }}> Hopes</span></span>
          </Link>

          <nav className="store-nav-links">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/carrito" className="cart-btn" aria-label="Carrito">
              <ShoppingCart style={{ width: 18, height: 18 }} />
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
            <nav className="mobile-nav">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <Link href="/carrito" className="mobile-nav-link" onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart style={{ width: 16, height: 16 }} />
                Carrito {totalItems > 0 && `(${totalItems})`}
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
