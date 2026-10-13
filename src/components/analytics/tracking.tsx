'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { track, getStoredConsent, saveConsent, clearStoredConsent } from '@/lib/analytics'
import { CONSENT_KEY, CONSENT_VERSION } from '@/lib/tracking'

// Consent Mode v2: todo arranca denegado y recién se habilita cuando la persona acepta.
// Va en el mismo script que el contenedor de GTM para que el orden esté garantizado.
function gtmBootstrap(gtmId: string) {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',true);
gtag('set','url_passthrough',true);
try{var c=JSON.parse(localStorage.getItem('${CONSENT_KEY}')||'null');
if(c&&c.v===${CONSENT_VERSION}){gtag('consent','update',{analytics_storage:c.analytics?'granted':'denied',ad_storage:c.ads?'granted':'denied',ad_user_data:c.ads?'granted':'denied',ad_personalization:c.ads?'granted':'denied'});}}catch(e){}
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');
`
}

const OPEN_EVENT = 'hh:open-consent'

export function Tracking({ gtmId }: { gtmId: string | null }) {
  const pathname = usePathname()

  // page_view en cada navegación (la app es de una sola página: GTM no ve los cambios de ruta).
  useEffect(() => {
    if (!gtmId) return
    const t = setTimeout(() => {
      track('page_view', {
        page_location: window.location.href,
        page_path: pathname,
        page_title: document.title,
      })
    }, 60)
    return () => clearTimeout(t)
  }, [pathname, gtmId])

  // Clics en cualquier enlace a WhatsApp (botón flotante, footer, producto, carrito).
  useEffect(() => {
    if (!gtmId) return
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href*="wa.me"]') as HTMLAnchorElement | null
      if (!a) return
      const tagged = a.closest('[data-wa-location]') as HTMLElement | null
      const location =
        tagged?.dataset.waLocation ||
        (a.classList.contains('wa-float-btn') ? 'flotante' : a.classList.contains('footer-wa-btn') ? 'footer' : 'otro')
      track('click_whatsapp', { link_location: location, page_path: window.location.pathname })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [gtmId])

  if (!gtmId) return null

  return (
    <>
      <Script id="hh-gtm" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: gtmBootstrap(gtmId) }} />
      <ConsentBanner />
    </>
  )
}

function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Se evalúa recién en el cliente: el servidor no sabe qué eligió la persona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(getStoredConsent() === null)
    const reopen = () => {
      clearStoredConsent()
      setVisible(true)
    }
    window.addEventListener(OPEN_EVENT, reopen)
    return () => window.removeEventListener(OPEN_EVENT, reopen)
  }, [])

  if (!visible) return null

  const choose = (all: boolean) => {
    saveConsent({ analytics: all, ads: all })
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      style={{
        position: 'fixed', left: 16, bottom: 16, zIndex: 10000,
        width: 'min(460px, calc(100vw - 32px))',
        background: '#161514', color: '#f2ede4',
        border: '1px solid rgba(242,237,228,0.14)', borderRadius: 12,
        padding: '16px 18px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        fontSize: '0.85rem', lineHeight: 1.55,
      }}
    >
      <p style={{ margin: 0, color: '#b8b1a6' }}>
        Usamos cookies para medir cómo se usa el sitio y mostrarte anuncios relevantes. Podés aceptar todas o dejar solo las necesarias.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => choose(true)}
          style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#c4262e', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}
        >
          Aceptar todas
        </button>
        <button
          type="button"
          onClick={() => choose(false)}
          style={{ flex: '1 1 140px', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: '#f2ede4', border: '1px solid rgba(242,237,228,0.3)', fontWeight: 600, fontSize: '0.85rem' }}
        >
          Solo necesarias
        </button>
      </div>
    </div>
  )
}

// Enlace del footer para volver a elegir.
export function CookiePrefsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
    >
      Preferencias de cookies
    </button>
  )
}
