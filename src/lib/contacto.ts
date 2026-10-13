// Datos de contacto por defecto de High Hopes. Se usan cuando no hay nada cargado
// en Admin → Configuración. Sin dependencias para poder importarse desde cualquier lado.

export const WHATSAPP_DEFAULT = '5491125514369'
export const EMAIL_DEFAULT = 'info@high-hopes.shop'

// Valores de ejemplo que quedaron de versiones anteriores: se tratan como "sin configurar".
const WHATSAPP_PLACEHOLDERS = ['5491100000000']
const EMAIL_PLACEHOLDERS = ['contacto@highhopes.store']

export function cleanWhatsapp(raw?: string | null): string | null {
  const n = (raw ?? '').replace(/\D/g, '')
  return n.length >= 10 && !WHATSAPP_PLACEHOLDERS.includes(n) ? n : null
}

export function cleanEmail(raw?: string | null): string | null {
  const e = (raw ?? '').trim().toLowerCase()
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e) && !EMAIL_PLACEHOLDERS.includes(e) ? e : null
}

// 5491125514369 -> +54 9 11 2551-4369 (celulares de Argentina); otros números: +<dígitos>.
export function formatWhatsapp(n: string): string {
  const m = /^549(\d{2})(\d{4})(\d{4})$/.exec(n)
  return m ? `+54 9 ${m[1]} ${m[2]}-${m[3]}` : `+${n}`
}
