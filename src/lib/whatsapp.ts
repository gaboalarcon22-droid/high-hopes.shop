import { db } from '@/lib/db'

// Número de WhatsApp de la tienda: primero el que se edita en Admin → Configuración,
// después la variable de entorno y por último un valor de ejemplo.
export async function getWhatsappNumber(): Promise<string> {
  const cfg = await db.configuracion.findUnique({ where: { clave: 'WHATSAPP_NUMBER' } })
  const limpio = (cfg?.valor ?? '').replace(/\D/g, '')
  return limpio || process.env.WHATSAPP_NUMBER || '5491100000000'
}
