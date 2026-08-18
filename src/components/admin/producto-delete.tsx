'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  id: string
  nombre: string
  tienePedidos: boolean
}

export function ProductoDelete({ id, nombre, tienePedidos }: Props) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function eliminar() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/productos/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al eliminar')
      setConfirmando(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmando(true)}
        disabled={tienePedidos}
        title={tienePedidos ? 'Tiene pedidos asociados — desactivalo en su lugar' : 'Eliminar producto'}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmando(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">¿Eliminar producto?</h3>
              <button onClick={() => setConfirmando(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-1">
                Vas a eliminar <strong>{nombre}</strong>. Esta acción no se puede deshacer.
              </p>
              {error && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="flex gap-3 mt-5">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmando(false)}>
                  Cancelar
                </Button>
                <button
                  onClick={eliminar}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
