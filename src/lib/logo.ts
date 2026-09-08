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
// "hero" es el tamaño grande que se usa en la portada de la tienda (arriba del título).
export const LOGO_SIZE_PX: Record<LogoTamano, {
  header: number; headerMobile: number; footer: number
  maxWidth: number; maxWidthMobile: number
  hero: number; heroMobile: number; heroMaxWidth: number; heroMaxWidthMobile: number
}> = {
  chico:   { header: 32, headerMobile: 26, footer: 44, maxWidth: 180, maxWidthMobile: 140, hero: 90,  heroMobile: 60,  heroMaxWidth: 340, heroMaxWidthMobile: 240 },
  mediano: { header: 46, headerMobile: 36, footer: 62, maxWidth: 260, maxWidthMobile: 180, hero: 160, heroMobile: 100, heroMaxWidth: 520, heroMaxWidthMobile: 320 },
  grande:  { header: 64, headerMobile: 48, footer: 84, maxWidth: 340, maxWidthMobile: 240, hero: 240, heroMobile: 140, heroMaxWidth: 700, heroMaxWidthMobile: 420 },
}

// Alto del header (nav fijo) que hay que reservar arriba de la página para
// que el contenido no quede tapado, según el tamaño de logo elegido.
export function headerOffsetPx(tamano: LogoTamano, tieneLogo: boolean): number {
  if (!tieneLogo) return 72
  return LOGO_SIZE_PX[tamano].header + 40
}

export function parseLogoTamano(raw: string | undefined | null): LogoTamano {
  return raw === 'chico' || raw === 'grande' ? raw : 'mediano'
}
