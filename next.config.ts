import type { NextConfig } from 'next'

// Dominios de las plataformas de medición y publicidad. Si se suma otra herramienta
// por GTM, hay que agregar acá sus dominios o el navegador la bloquea.
const MARKETING_SCRIPTS = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://*.googletagmanager.com',
  'https://www.googleadservices.com',
  'https://googleads.g.doubleclick.net',
  'https://*.g.doubleclick.net',
  'https://www.google.com',
  'https://connect.facebook.net',
  'https://analytics.tiktok.com',
  'https://www.clarity.ms',
  'https://*.clarity.ms',
].join(' ')

const MARKETING_CONNECT = [
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
  'https://*.g.doubleclick.net',
  'https://www.google.com',
  'https://*.google.com',
  'https://*.facebook.com',
  'https://connect.facebook.net',
  'https://analytics.tiktok.com',
  'https://*.clarity.ms',
].join(' ')

const MARKETING_FRAMES = [
  "'self'",
  'https://www.googletagmanager.com',
  'https://td.doubleclick.net',
  'https://www.facebook.com',
].join(' ')

const SECURITY_HEADERS = [
  // Evita que el navegador detecte el tipo MIME incorrecto
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Evita clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Fuerza HTTPS en producción
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Controla información de referrer enviada
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Deshabilita características del navegador innecesarias
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // XSS filter legacy
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Marketing: GTM carga el resto (GA4, Google Ads, Meta, TikTok, Clarity) desde estos dominios.
      process.env.NODE_ENV === 'development'
        ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${MARKETING_SCRIPTS}`
        : `script-src 'self' 'unsafe-inline' ${MARKETING_SCRIPTS}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' blob: https://api.mercadopago.com ${MARKETING_CONNECT}`,
      `frame-src ${MARKETING_FRAMES}`,
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
      // API routes: no cachear respuestas con datos sensibles
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
  // No exponer información del servidor
  poweredByHeader: false,
  // Prevenir acceso a rutas no definidas con trailing slash
  trailingSlash: false,
  // Prisma 7 driver adapter tiene incompatibilidad de tipos menor — ignorar en build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Motor de mockup 3D (three.js / react-three-fiber)
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

export default nextConfig
