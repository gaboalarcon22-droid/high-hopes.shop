import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  searchParams: Promise<{ pedido?: string }>
}

export default async function GraciasPage({ searchParams }: Props) {
  const { pedido } = await searchParams

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        ¡Pedido recibido!
      </h1>
      {pedido && (
        <p className="text-gray-500 mb-2">
          Número de pedido: <span className="font-semibold text-gray-900">#{pedido}</span>
        </p>
      )}
      <p className="text-gray-500 mb-8">
        Te vamos a contactar a la brevedad para confirmar los detalles de envío y pago. ¡Gracias por elegirnos!
      </p>
      <Link href="/tienda">
        <Button size="lg">Seguir comprando</Button>
      </Link>
    </div>
  )
}
