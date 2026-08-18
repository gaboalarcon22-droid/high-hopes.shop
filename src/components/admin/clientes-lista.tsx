'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatPrecio, formatFecha, ESTADOS_PEDIDO } from '@/lib/utils'
import { Search, ChevronRight } from 'lucide-react'

interface ClienteItem {
  id: string
  email: string
  nombre: string
  telefono: string | null
  empresa: string | null
  creadoEn: string
  _count: { pedidos: number }
  totalGastado: number
  ultimoPedido: {
    creadoEn: string
    total: number
    estado: string
  } | null
}

interface Props {
  clientes: ClienteItem[]
}

export function ClientesLista({ clientes }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return clientes
    return clientes.filter(
      c =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.empresa?.toLowerCase().includes(q) ||
        c.telefono?.includes(q)
    )
  }, [clientes, busqueda])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrados
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email, empresa..."
          className="block w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedidos</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total gastado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Último pedido</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                  {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin clientes todavía.'}
                </td>
              </tr>
            ) : filtrados.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-xs flex-shrink-0">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{c.nombre}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                      {c.empresa && <div className="text-xs text-gray-400">{c.empresa}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                    {c._count.pedidos}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-semibold text-gray-900">
                  {c.totalGastado > 0 ? formatPrecio(c.totalGastado) : <span className="text-gray-400 font-normal">—</span>}
                </td>
                <td className="px-4 py-4">
                  {c.ultimoPedido ? (
                    <div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ESTADOS_PEDIDO[c.ultimoPedido.estado as keyof typeof ESTADOS_PEDIDO]?.color ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {ESTADOS_PEDIDO[c.ultimoPedido.estado as keyof typeof ESTADOS_PEDIDO]?.label ?? c.ultimoPedido.estado}
                      </span>
                      <div className="text-xs text-gray-400 mt-0.5">{formatFecha(c.ultimoPedido.creadoEn)}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Sin pedidos</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/admin/clientes/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
                  >
                    Ver <ChevronRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
