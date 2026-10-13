// Utilidades de seguimiento que corren tanto en servidor como en cliente.

// El ID de contenedor se interpola dentro de un <script>, por eso se valida con
// una lista cerrada de caracteres antes de usarlo en cualquier lado.
const GTM_ID_RE = /^GTM-[A-Z0-9]{4,12}$/

export function parseGtmId(raw?: string | null): string | null {
  const v = (raw ?? '').trim().toUpperCase()
  return GTM_ID_RE.test(v) ? v : null
}

// Clave de localStorage donde se guarda la elección de cookies.
export const CONSENT_KEY = 'hh_consent'
export const CONSENT_VERSION = 1
