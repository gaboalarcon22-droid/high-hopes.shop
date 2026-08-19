// Configuración de fondos personalizables por bloque del sitio.
// Se persiste como JSON string en la tabla Configuracion (clave FONDO_<BLOQUE>).

import type { CSSProperties } from 'react'

export type FondoTipo = 'color' | 'gradiente' | 'imagen'

export interface FondoBlock {
  tipo: FondoTipo
  color: string
  color2: string
  angulo: number // grados, solo para gradiente
  imagenUrl: string
  overlay: number // 0-100, oscurecido sobre la imagen para legibilidad
}

export const FONDO_KEYS = ['FONDO_HERO', 'FONDO_GRILLA', 'FONDO_FOOTER'] as const
export type FondoKey = (typeof FONDO_KEYS)[number]

export const FONDO_DEFAULTS: Record<FondoKey, FondoBlock> = {
  FONDO_HERO: { tipo: 'color', color: '#0e0e0e', color2: '#161616', angulo: 135, imagenUrl: '', overlay: 55 },
  FONDO_GRILLA: { tipo: 'color', color: '#0e0e0e', color2: '#161616', angulo: 135, imagenUrl: '', overlay: 55 },
  FONDO_FOOTER: { tipo: 'color', color: '#111111', color2: '#0a0a0a', angulo: 135, imagenUrl: '', overlay: 55 },
}

// Versión genérica: parsea un FondoBlock guardado, con el default que se le pase.
// La usan tanto los bloques del sitio (con su FONDO_DEFAULTS) como cualquier
// otro fondo individual (ej. el de un producto puntual).
export function parseFondoValue(raw: string | undefined | null, fallback: FondoBlock): FondoBlock {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

export function parseFondo(key: FondoKey, raw: string | undefined | null): FondoBlock {
  return parseFondoValue(raw, FONDO_DEFAULTS[key])
}

// Default para el fondo personalizado de un producto individual.
export const FONDO_PRODUCTO_DEFAULT: FondoBlock = {
  tipo: 'color', color: '#131313', color2: '#1c1c1c', angulo: 135, imagenUrl: '', overlay: 40,
}

// Convierte un FondoBlock en estilos CSS listos para usar en un contenedor.
export function fondoToStyle(fondo: FondoBlock): CSSProperties {
  if (fondo.tipo === 'imagen' && fondo.imagenUrl) {
    const overlayAlpha = Math.min(100, Math.max(0, fondo.overlay)) / 100
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,${overlayAlpha}), rgba(0,0,0,${overlayAlpha})), url(${fondo.imagenUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  if (fondo.tipo === 'gradiente') {
    return {
      background: `linear-gradient(${fondo.angulo}deg, ${fondo.color}, ${fondo.color2})`,
    }
  }
  return { background: fondo.color }
}
