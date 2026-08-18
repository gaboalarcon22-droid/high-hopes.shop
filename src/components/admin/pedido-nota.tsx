'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus } from 'lucide-react'

interface Props {
  pedidoId: string
  estadoActual: string
}

const ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] as const

export function PedidoNota({ pedidoId, estadoActual }: Props) {
  const router = useRouter()
  const [nota, setNota] = useState('')
  const [estado, setEstado] = useState(estadoActual)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  async function guardar() {
    if (!nota.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}/nota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota, estado: estado !== estadoActual ? estado : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setNota('')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-green-700 hover:text-green-800 font-medium transition-colors"
      >
        <MessageSquarePlus className="h-4 w-4" />
        Agregar nota / cambiar estado
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
      <p className="text-sm font-medium text-green-900">Nueva entrada en el historial</p>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5">{error}</p>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Estado del pedido</label>
        <select
          value={estado}
          onChange={e => setEstado(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        >
          {ESTADOS.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nota interna *</label>
        <textarea
          value={nota}
          onChange={e => setNota(e.target.value)}
          rows={3}
          placeholder="Ej: Llamé al cliente y confirmó la entrega para el viernes..."
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          autoFocus
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setNota(''); setEstado(estadoActual) }}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          loading={loading}
          onClick={guardar}
          disabled={!nota.trim()}
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}
