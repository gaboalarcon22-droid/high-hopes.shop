import { db } from '@/lib/db'
import { cleanEmail, cleanWhatsapp, EMAIL_DEFAULT, WHATSAPP_DEFAULT } from '@/lib/contacto'

// Número de WhatsApp de la tienda: primero el que se edita en Admin → Configuración,
// después la variable de entorno y por último el número de High Hopes.
export async function getWhatsappNumber(): Promise<string> {
  const cfg = await db.configuracion.findUnique({ where: { clave: 'WHATSAPP_NUMBER' } })
  return cleanWhatsapp(cfg?.valor) ?? cleanWhatsapp(process.env.WHATSAPP_NUMBER) ?? WHATSAPP_DEFAULT
}

// Mail de contacto: Admin → Configuración, después la variable de entorno y por último el de High Hopes.
export async function getStoreEmail(): Promise<string> {
  const cfg = await db.configuracion.findUnique({ where: { clave: 'STORE_EMAIL' } })
  return cleanEmail(cfg?.valor) ?? cleanEmail(process.env.STORE_EMAIL) ?? EMAIL_DEFAULT
}
