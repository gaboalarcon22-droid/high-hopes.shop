// Tamaño del logo del sitio — 3 opciones fijas, siempre proporcionales
// (ancho automático vía object-fit:contain, nunca se deforma ni rompe el header).

export type LogoTamano = 'chico' | 'mediano' | 'grande'

export const LOGO_TAMANOS: { value: LogoTamano; label: string }[] = [
  { value: 'chico', label: 'Chico' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
]

// Alturas en px por contexto — el ancho se ajusta solo, siempre relativas al sitio.
export const LOGO_SIZE_PX: Record<LogoTamano, { header: number; headerMobile: number; footer: number }> = {
  chico:   { header: 24, headerMobile: 20, footer: 24 },
  mediano: { header: 34, headerMobile: 28, footer: 32 },
  grande:  { header: 48, headerMobile: 38, footer: 44 },
}

export function parseLogoTamano(raw: string | undefined | null): LogoTamano {
  return raw === 'chico' || raw === 'grande' ? raw : 'mediano'
}
