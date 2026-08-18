'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { formatPrecio } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { CreditCard, Landmark, MessageCircle, Package } from 'lucide-react'

const METODOS = [
  { id: 'MERCADOPAGO', label: 'MercadoPago', icon: CreditCard, desc: 'Tarjeta, débito, efectivo o saldo MP' },
  { id: 'TRANSFERENCIA', label: 'Transferencia bancaria', icon: Landmark, desc: 'CBU/CVU — el pedido se confirma al acreditar' },
  { id: 'WHATSAPP', label: 'Finalizar por WhatsApp', icon: MessageCircle, desc: 'Coordinás pago y envío directamente con nosotros' },
]

export default function CheckoutPage() {
  const { items, totalPrecio, vaciar } = useCartStore()
  const router = useRouter()
  const [metodoPago, setMetodoPago] = useState('MERCADOPAGO')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', empresa: '', notas: '',
    calle: '', ciudad: '', provincia: '', cp: '',
  })

  if (items.length === 0) {
    router.replace('/carrito')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: { nombre: form.nombre, email: form.email, telefono: form.telefono, empresa: form.empresa },
          direccion: { calle: form.calle, ciudad: form.ciudad, provincia: form.provincia, cp: form.cp },
          notas: form.notas,
          metodoPago,
          items: items.map(i => ({
            productoId: i.productoId,
            varianteId: i.varianteId,
            cantidad: i.cantidad,
            precioUnit: i.precio,
            nombreSnap: i.nombre,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al procesar el pedido')

      if (metodoPago === 'MERCADOPAGO' && data.mpUrl) {
        window.location.href = data.mpUrl
        return
      }

      if (metodoPago === 'WHATSAPP' && data.whatsappUrl) {
        vaciar()
        window.open(data.whatsappUrl, '_blank')
        router.push(`/checkout/gracias?pedido=${data.numero}`)
        return
      }

      vaciar()
      router.push(`/checkout/gracias?pedido=${data.numero}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const total = totalPrecio()

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Formulario */}
          <div className="flex-1 space-y-8">
            {/* Datos del comprador */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Datos del comprador</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre y apellido *"
                  required
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                />
                <Input
                  label="Email *"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                />
                <Input
                  label="Empresa (opcional)"
                  value={form.empresa}
                  onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                />
              </div>
            </div>

            {/* Dirección de envío */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" /> Dirección de envío
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Calle y número *"
                    required
                    value={form.calle}
                    onChange={e => setForm(f => ({ ...f, calle: e.target.value }))}
                  />
                </div>
                <Input
                  label="Ciudad *"
                  required
                  value={form.ciudad}
                  onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                />
                <Input
                  label="Provincia *"
                  required
                  value={form.provincia}
                  onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))}
                />
                <Input
                  label="Código postal"
                  value={form.cp}
                  onChange={e => setForm(f => ({ ...f, cp: e.target.value }))}
                />
              </div>
            </div>

            {/* Método de pago */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Método de pago</h2>
              <div className="space-y-3">
                {METODOS.map(m => {
                  const Icon = m.icon
                  return (
                    <label
                      key={m.id}
                      className={`flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-colors
                        ${metodoPago === m.id
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name="metodo"
                        value={m.id}
                        checked={metodoPago === m.id}
                        onChange={() => setMetodoPago(m.id)}
                        className="mt-1"
                      />
                      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${metodoPago === m.id ? 'text-green-700' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{m.label}</div>
                        <div className="text-xs text-gray-500">{m.desc}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Notas */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas del pedido (opcional)
              </label>
              <textarea
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                rows={3}
                placeholder="Instrucciones especiales, horario de entrega, etc."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>

          {/* Sidebar resumen */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white p-6 sticky top-24 space-y-4">
              <h2 className="font-semibold text-gray-900">Tu pedido</h2>
              <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
                {items.map(i => (
                  <div key={`${i.productoId}-${i.varianteId}`} className="flex justify-between text-gray-600">
                    <span className="truncate flex-1 pr-2">{i.nombre} ×{i.cantidad}</span>
                    <span className="flex-shrink-0">{formatPrecio(i.precio * i.cantidad)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span>{formatPrecio(total)}</span>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
              )}

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {metodoPago === 'MERCADOPAGO' ? 'Pagar con MercadoPago' :
                 metodoPago === 'WHATSAPP' ? 'Confirmar y continuar por WhatsApp' :
                 'Confirmar pedido'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
