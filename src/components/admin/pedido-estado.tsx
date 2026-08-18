'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ESTADOS_PEDIDO } from '@/lib/utils'

const ESTADOS = Object.keys(ESTADOS_PEDIDO) as Array<keyof typeof ESTADOS_PEDIDO>

interface Props { pedidoId: string; estadoActual: string }

export function PedidoEstado({ pedidoId, estadoActual }: Props) {
  const [estado, setEstado] = useState(estadoActual)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const info = ESTADOS_PEDIDO[estado as keyof typeof ESTADOS_PEDIDO]

  async function cambiar(nuevoEstado: string) {
    setEstado(nuevoEstado)
    await fetch(`/api/admin/pedidos/${pedidoId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    startTransition(() => router.refresh())
  }

  return (
    <select
      value={estado}
      onChange={e => cambiar(e.target.value)}
      disabled={pending}
      className={`rounded-full px-3 py-1 text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer ${info?.color ?? 'bg-gray-100 text-gray-700'}`}
    >
      {ESTADOS.map(e => (
        <option key={e} value={e}>{ESTADOS_PEDIDO[e].label}</option>
      ))}
    </select>
  )
}
