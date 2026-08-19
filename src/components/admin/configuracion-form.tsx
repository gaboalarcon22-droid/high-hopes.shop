'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Store, MessageCircle, MapPin, Mail, Globe, Megaphone, Palette } from 'lucide-react'
import { FondoEditor } from './fondo-editor'
import { parseFondo, type FondoBlock, type FondoKey } from '@/lib/fondos'

interface Props {
  config: Record<string, string>
}

export function ConfiguracionForm({ config: inicial }: Props) {
  const [form, setForm] = useState(inicial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(clave: string, valor: string) {
    setForm(f => ({ ...f, [clave]: valor }))
  }

  function setFondo(clave: FondoKey, next: FondoBlock) {
    setForm(f => ({ ...f, [clave]: JSON.stringify(next) }))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const Section = ({
    titulo,
    icono: Icon,
    children,
  }: {
    titulo: string
    icono: React.ElementType
    children: React.ReactNode
  }) => (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-green-600" />
        <h2 className="font-semibold text-gray-900 text-sm">{titulo}</h2>
      </div>
      {children}
    </div>
  )

  return (
    <form onSubmit={guardar} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 text-sm mt-1">Ajustes generales de la tienda</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Configuración guardada correctamente.
        </div>
      )}

      {/* Información de la tienda */}
      <Section titulo="Información de la tienda" icono={Store}>
        <Input
          label="Nombre de la tienda"
          value={form.STORE_NAME ?? ''}
          onChange={e => set('STORE_NAME', e.target.value)}
          placeholder="High Hopes"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción breve</label>
          <textarea
            value={form.STORE_DESCRIPTION ?? ''}
            onChange={e => set('STORE_DESCRIPTION', e.target.value)}
            rows={2}
            placeholder="Remeras, buzos y estampas personalizadas con mockup 3D en tiempo real..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>
        <Input
          label="Email de contacto"
          type="email"
          value={form.STORE_EMAIL ?? ''}
          onChange={e => set('STORE_EMAIL', e.target.value)}
          placeholder="contacto@highhopes.store"
        />
      </Section>

      {/* Ubicación */}
      <Section titulo="Ubicación y dirección" icono={MapPin}>
        <Input
          label="Dirección"
          value={form.STORE_ADDRESS ?? ''}
          onChange={e => set('STORE_ADDRESS', e.target.value)}
          placeholder="Av. Corrientes 1234, CABA"
        />
        <Input
          label="Provincia / Ciudad"
          value={form.STORE_PROVINCE ?? ''}
          onChange={e => set('STORE_PROVINCE', e.target.value)}
          placeholder="Buenos Aires, Argentina"
        />
      </Section>

      {/* WhatsApp */}
      <Section titulo="WhatsApp" icono={MessageCircle}>
        <Input
          label="Número de WhatsApp (con código de país, sin +)"
          value={form.WHATSAPP_NUMBER ?? ''}
          onChange={e => set('WHATSAPP_NUMBER', e.target.value)}
          placeholder="5491100000000"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de bienvenida</label>
          <textarea
            value={form.WHATSAPP_MESSAGE ?? ''}
            onChange={e => set('WHATSAPP_MESSAGE', e.target.value)}
            rows={2}
            placeholder="Hola! Me interesa hacer un pedido..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>
      </Section>

      {/* Banner */}
      <Section titulo="Banner de la tienda" icono={Megaphone}>
        <div className="flex items-center gap-3">
          <input
            id="banner-activo"
            type="checkbox"
            checked={form.BANNER_ACTIVO === 'true'}
            onChange={e => set('BANNER_ACTIVO', e.target.checked ? 'true' : 'false')}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="banner-activo" className="text-sm text-gray-700">Mostrar banner de anuncio en la tienda</label>
        </div>
        {form.BANNER_ACTIVO === 'true' && (
          <Input
            label="Texto del banner"
            value={form.BANNER_TEXTO ?? ''}
            onChange={e => set('BANNER_TEXTO', e.target.value)}
            placeholder="🚀 Envío gratis en compras mayores a $50.000"
          />
        )}
        <Input
          label="Envío gratis desde (ARS, 0 = desactivado)"
          type="number"
          min="0"
          value={form.ENVIO_GRATIS_DESDE ?? ''}
          onChange={e => set('ENVIO_GRATIS_DESDE', e.target.value)}
          placeholder="50000"
        />
      </Section>

      {/* Redes sociales */}
      <Section titulo="Redes sociales" icono={Globe}>
        <Input
          label="Instagram URL"
          type="url"
          value={form.INSTAGRAM_URL ?? ''}
          onChange={e => set('INSTAGRAM_URL', e.target.value)}
          placeholder="https://instagram.com/highhopes.store"
        />
        <Input
          label="Facebook URL"
          type="url"
          value={form.FACEBOOK_URL ?? ''}
          onChange={e => set('FACEBOOK_URL', e.target.value)}
          placeholder="https://facebook.com/highhopes"
        />
      </Section>

      {/* Fondos del sitio */}
      <Section titulo="Fondos del sitio" icono={Palette}>
        <p className="text-xs text-gray-400 -mt-2">
          Personalizá el fondo de cada sección: color sólido, degradado o imagen.
        </p>
        <FondoEditor
          titulo="Hero (portada de la tienda)"
          descripcion="El banner de arriba de todo con el título principal."
          value={parseFondo('FONDO_HERO', form.FONDO_HERO)}
          onChange={next => setFondo('FONDO_HERO', next)}
        />
        <FondoEditor
          titulo="Grilla de productos"
          descripcion="El fondo detrás de las tarjetas de producto en la tienda."
          value={parseFondo('FONDO_GRILLA', form.FONDO_GRILLA)}
          onChange={next => setFondo('FONDO_GRILLA', next)}
        />
        <FondoEditor
          titulo="Footer"
          descripcion="El pie de página con los links y contacto."
          value={parseFondo('FONDO_FOOTER', form.FONDO_FOOTER)}
          onChange={next => setFondo('FONDO_FOOTER', next)}
        />
      </Section>

      {/* Footer */}
      <Section titulo="Footer" icono={Mail}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texto del footer</label>
          <textarea
            value={form.FOOTER_TEXT ?? ''}
            onChange={e => set('FOOTER_TEXT', e.target.value)}
            rows={2}
            placeholder="Todos los derechos reservados."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>
      </Section>

      <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
        Guardar configuración
      </Button>
    </form>
  )
}
