import { CarritoView } from '@/components/tienda/carrito-view'
import { getWhatsappNumber } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export default async function CarritoPage() {
  return <CarritoView whatsappNumber={await getWhatsappNumber()} />
}
