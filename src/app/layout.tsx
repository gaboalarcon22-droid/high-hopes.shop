import type { Metadata } from 'next'
import { Gabarito, Bebas_Neue } from 'next/font/google'
import './globals.css'

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-gabarito',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
})

export const metadata: Metadata = {
  title: 'High Hopes — Remeras y diseños personalizados',
  description: 'Remeras, buzos y estampas personalizadas con mockup 3D en tiempo real.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${gabarito.variable} ${bebasNeue.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
