// Tamaño del logo del sitio — 3 opciones fijas, siempre proporcionales
// (ancho automático vía object-fit:contain, nunca se deforma ni rompe el header).

export type LogoTamano = 'chico' | 'mediano' | 'grande'

export const LOGO_TAMANOS: { value: LogoTamano; label: string }[] = [
  { value: 'chico', label: 'Chico' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
]

// Alturas y ancho máximo en px por contexto. maxWidth es generoso para que
// un logo horizontal (wordmark) no se recorte antes de llegar a la altura
// configurada — el ancho real siempre se ajusta solo vía object-fit:contain.
export const LOGO_SIZE_PX: Record<LogoTamano, { header: number; headerMobile: number; footer: number; maxWidth: number; maxWidthMobile: number }> = {
  chico:   { header: 24, headerMobile: 20, footer: 24, maxWidth: 150, maxWidthMobile: 120 },
  mediano: { header: 36, headerMobile: 28, footer: 34, maxWidth: 220, maxWidthMobile: 160 },
  grande:  { header: 52, headerMobile: 38, footer: 48, maxWidth: 300, maxWidthMobile: 200 },
}

export function parseLogoTamano(raw: string | undefined | null): LogoTamano {
  return raw === 'chico' || raw === 'grande' ? raw : 'mediano'
}
