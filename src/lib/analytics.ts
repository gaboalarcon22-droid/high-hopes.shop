// Capa de datos (dataLayer) para Google Tag Manager.
// Todo lo que se mide pasa por acá: los tags se configuran en GTM, no en el código.
// Formato de comercio: GA4 (items con item_id, item_name, price, quantity...).
import { CONSENT_KEY, CONSENT_VERSION } from '@/lib/tracking'

export const CURRENCY = 'ARS'

export interface TrackItem {
  item_id: string
  item_name: string
  item_category?: string
  item_brand?: string
  item_variant?: string
  price: number
  quantity: number
}

type DataLayerEntry = Record<string, unknown> | IArguments

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[]
  }
}

function layer(): DataLayerEntry[] | null {
  if (typeof window === 'undefined') return null
  window.dataLayer = window.dataLayer || []
  return window.dataLayer
}

export function track(event: string, params: Record<string, unknown> = {}) {
  layer()?.push({ event, ...params })
}

// GA4 pide limpiar el objeto ecommerce anterior antes de cada evento de comercio.
function trackEcommerce(event: string, ecommerce: Record<string, unknown>) {
  const l = layer()
  if (!l) return
  l.push({ ecommerce: null })
  l.push({ event, ecommerce })
}

export function itemFromProducto(
  p: { id: string; sku?: string | null; nombre: string; precio: number; marca?: string | null; categoria?: { nombre: string } | null },
  extra: { variante?: string; cantidad?: number; precio?: number } = {}
): TrackItem {
  return {
    item_id: p.sku || p.id,
    item_name: p.nombre,
    item_category: p.categoria?.nombre,
    item_brand: p.marca || 'High Hopes',
    item_variant: extra.variante,
    price: extra.precio ?? p.precio,
    quantity: extra.cantidad ?? 1,
  }
}

const total = (items: TrackItem[]) => items.reduce((a, i) => a + i.price * i.quantity, 0)

export function trackViewItemList(listName: string, items: TrackItem[]) {
  trackEcommerce('view_item_list', { item_list_name: listName, item_list_id: listName.toLowerCase(), items })
}

export function trackViewItem(item: TrackItem) {
  trackEcommerce('view_item', { currency: CURRENCY, value: item.price, items: [item] })
}

export function trackAddToCart(item: TrackItem) {
  trackEcommerce('add_to_cart', { currency: CURRENCY, value: item.price * item.quantity, items: [item] })
}

export function trackBeginCheckout(items: TrackItem[]) {
  trackEcommerce('begin_checkout', { currency: CURRENCY, value: total(items), items })
}

export function trackPurchase(data: { transaction_id: string; value: number; items: TrackItem[]; payment_type?: string }) {
  trackEcommerce('purchase', { currency: CURRENCY, ...data })
}

// Consulta por WhatsApp desde un producto: es el "lead" principal de la tienda.
export function trackLead(items: TrackItem[]) {
  track('generate_lead', { currency: CURRENCY, value: total(items), items, lead_source: 'whatsapp_producto' })
}

export function trackInteract3D(item: TrackItem) {
  track('interact_3d', { item_id: item.item_id, item_name: item.item_name })
}

// ── Consentimiento (Consent Mode v2) ─────────────────────────────

export interface ConsentChoice {
  v: number
  analytics: boolean
  ads: boolean
  ts: number
}

export function getStoredConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as ConsentChoice
    return c && c.v === CONSENT_VERSION ? c : null
  } catch {
    return null
  }
}

export function clearStoredConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY)
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export function saveConsent(choice: { analytics: boolean; ads: boolean }) {
  const c: ConsentChoice = { v: CONSENT_VERSION, ...choice, ts: Date.now() }
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c))
  } catch {
    /* sin almacenamiento: la elección vale solo para esta visita */
  }
  const l = layer()
  if (!l) return
  // gtag() empuja el objeto `arguments`, no un objeto común; GTM distingue ambos.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function gtag(..._a: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    l!.push(arguments)
  }
  gtag('consent', 'update', {
    analytics_storage: choice.analytics ? 'granted' : 'denied',
    ad_storage: choice.ads ? 'granted' : 'denied',
    ad_user_data: choice.ads ? 'granted' : 'denied',
    ad_personalization: choice.ads ? 'granted' : 'denied',
  })
  track('consent_update', { consent_analytics: choice.analytics, consent_ads: choice.ads })
}
