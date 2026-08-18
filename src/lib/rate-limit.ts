// Rate limiter en memoria — para producción usar Upstash Redis
const store = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  windowMs: number  // ventana en ms
  max: number       // máximo de requests por ventana
}

export function rateLimit(key: string, options: RateLimitOptions): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs })
    return { success: true, remaining: options.max - 1, resetAt: now + options.windowMs }
  }

  if (entry.count >= options.max) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: options.max - entry.count, resetAt: entry.resetAt }
}

// Limpia entradas expiradas cada 10 minutos para evitar memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, 10 * 60 * 1000)
}
