import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ConfiguracionForm } from '@/components/admin/configuracion-form'
import { redirect } from 'next/navigation'

const CLAVES_PERMITIDAS = [
  'STORE_NAME',
  'STORE_DESCRIPTION',
  'STORE_EMAIL',
  'STORE_ADDRESS',
  'STORE_PROVINCE',
  'WHATSAPP_NUMBER',
  'WHATSAPP_MESSAGE',
  'FOOTER_TEXT',
  'BANNER_ACTIVO',
  'BANNER_TEXTO',
  'ENVIO_GRATIS_DESDE',
  'MONEDA',
  'INSTAGRAM_URL',
  'FACEBOOK_URL',
]

export default async function ConfiguracionPage() {
  const session = await getSession()

  if (!session || session.rol !== 'ADMIN') {
    redirect('/admin')
  }

  const configs = await db.configuracion.findMany()

  const config: Record<string, string> = {}
  for (const clave of CLAVES_PERMITIDAS) {
    config[clave] = ''
  }
  for (const c of configs) {
    if (CLAVES_PERMITIDAS.includes(c.clave)) {
      config[c.clave] = c.valor
    }
  }

  return <ConfiguracionForm config={config} />
}
