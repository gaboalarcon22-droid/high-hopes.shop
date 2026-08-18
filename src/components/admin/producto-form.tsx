'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { slugify } from '@/lib/utils'
import { Plus, Trash2, Sparkles, Loader2, Upload, ImagePlus, Shirt } from 'lucide-react'
import type { Categoria, Producto, Variante } from '@prisma/client'
import { Mockup3DModal, type Mockup3DConfig } from '@/components/mockup3d/Mockup3DModal'

interface VarianteForm {
  id?: string
  nombre: string
  valor: string
  precio: string
  stock: string
  sku: string
}

interface Props {
  categorias: Categoria[]
  producto?: Producto & { variantes: Variante[] }
}

export function ProductoForm({ categorias, producto }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // ── Asistente IA ───────────────────────────────────────────────
  const [aiUrl, setAiUrl] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiSuccess, setAiSuccess] = useState(false)

  // ── Formulario ─────────────────────────────────────────────────
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? '',
    slug: producto?.slug ?? '',
    descripcion: producto?.descripcion ?? '',
    descripcionCorta: producto?.descripcionCorta ?? '',
    precio: String(producto?.precio ?? ''),
    precioAnterior: String(producto?.precioAnterior ?? ''),
    stock: String(producto?.stock ?? '0'),
    stockMinimo: String(producto?.stockMinimo ?? '5'),
    sku: producto?.sku ?? '',
    marca: producto?.marca ?? '',
    categoriaId: producto?.categoriaId ?? (categorias[0]?.id ?? ''),
    destacado: producto?.destacado ?? false,
    activo: producto?.activo ?? true,
    peso: String(producto?.peso ?? ''),
    imagenes: (JSON.parse(producto?.imagenes ?? '[]') as string[]),
    tags: (JSON.parse(producto?.tags ?? '[]') as string[]).join(', '),
  })

  const [variantes, setVariantes] = useState<VarianteForm[]>(
    producto?.variantes.map(v => ({
      id: v.id,
      nombre: v.nombre,
      valor: v.valor,
      precio: String(v.precio ?? ''),
      stock: String(v.stock),
      sku: v.sku ?? '',
    })) ?? []
  )

  const [nuevaImagen, setNuevaImagen] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Mockup 3D ───────────────────────────────────────────────────
  const [showMockup3D, setShowMockup3D] = useState(false)
  const [mockup3dConfig, setMockup3dConfig] = useState<Mockup3DConfig | null>(
    producto?.mockup3d ? (JSON.parse(producto.mockup3d) as Mockup3DConfig) : null
  )

  function agregarImagenDesdeMockup(dataUrl: string, config: Mockup3DConfig | null) {
    setForm(f => f.imagenes.length >= 5 ? f : { ...f, imagenes: [...f.imagenes, dataUrl] })
    if (config) setMockup3dConfig(config)
  }

  function autoSlug(nombre: string) {
    if (!producto) setForm(f => ({ ...f, slug: slugify(nombre) }))
  }

  function agregarImagen() {
    if (!nuevaImagen.trim()) return
    setForm(f => ({ ...f, imagenes: [...f.imagenes, nuevaImagen.trim()] }))
    setNuevaImagen('')
  }

  function quitarImagen(i: number) {
    setForm(f => ({ ...f, imagenes: f.imagenes.filter((_, idx) => idx !== i) }))
  }

  function agregarVariante() {
    setVariantes(v => [...v, { nombre: 'Variante', valor: '', precio: '', stock: '0', sku: '' }])
  }

  function actualizarVariante(i: number, field: keyof VarianteForm, value: string) {
    setVariantes(v => v.map((vi, idx) => idx === i ? { ...vi, [field]: value } : vi))
  }

  function quitarVariante(i: number) {
    setVariantes(v => v.filter((_, idx) => idx !== i))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const remaining = 5 - form.imagenes.length
    if (remaining <= 0) {
      setUploadError('Ya tenés 5 imágenes. Eliminá alguna antes de agregar más.')
      return
    }

    const toUpload = files.slice(0, remaining)
    setUploadError('')
    setUploadLoading(true)

    try {
      const fd = new FormData()
      toUpload.forEach(f => fd.append('images', f))

      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir')

      setForm(f => ({ ...f, imagenes: [...f.imagenes, ...data.urls] }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir imágenes')
    } finally {
      setUploadLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Generar con IA ─────────────────────────────────────────────
  async function generarConIA() {
    setAiError('')
    setAiSuccess(false)

    if (!form.nombre.trim() && !aiUrl.trim()) {
      setAiError('Escribí el nombre del producto o pegá una URL de referencia.')
      return
    }

    setAiLoading(true)
    try {
      const res = await fetch('/api/admin/ai/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim() || undefined,
          url: aiUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al generar')

      setForm(f => ({
        ...f,
        nombre: data.nombre || f.nombre,
        slug: data.slug || f.slug,
        descripcionCorta: data.descripcionCorta || f.descripcionCorta,
        descripcion: data.descripcion || f.descripcion,
        marca: data.marca || f.marca,
        precio: data.precio ? String(data.precio) : f.precio,
        tags: data.tags || f.tags,
        categoriaId: data.categoriaId || f.categoriaId,
        imagenes: data.imagenes?.length > 0 ? data.imagenes : f.imagenes,
      }))

      setAiSuccess(true)
      setTimeout(() => setAiSuccess(false), 4000)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al generar con IA')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const body = {
      ...form,
      precio: parseFloat(form.precio),
      precioAnterior: form.precioAnterior ? parseFloat(form.precioAnterior) : null,
      stock: parseInt(form.stock),
      stockMinimo: parseInt(form.stockMinimo),
      peso: form.peso ? parseFloat(form.peso) : null,
      imagenes: JSON.stringify(form.imagenes),
      tags: JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)),
      mockup3d: mockup3dConfig ? JSON.stringify(mockup3dConfig) : null,
      variantes,
    }

    const url = producto ? `/api/admin/productos/${producto.id}` : '/api/admin/productos'
    const method = producto ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      startTransition(() => router.push('/admin/productos'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ── Panel Asistente IA ─────────────────────────────────── */}
      <div className="rounded-xl border-2 border-dashed border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-green-900 text-sm">Asistente IA</h2>
            <p className="text-xs text-green-700">Completado automático con Claude — ingresá el nombre o pegá una URL del producto</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={aiUrl}
            onChange={e => setAiUrl(e.target.value)}
            placeholder="https://... URL del producto (opcional)"
            className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); generarConIA() } }}
          />
          <button
            type="button"
            onClick={generarConIA}
            disabled={aiLoading || (!form.nombre.trim() && !aiUrl.trim())}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {aiLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generar con IA</>
            )}
          </button>
        </div>

        {aiError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{aiError}</p>
        )}
        {aiSuccess && (
          <p className="text-xs text-green-700 bg-green-100 border border-green-200 rounded-lg px-3 py-2">
            ✓ Datos generados y completados — revisá y ajustá lo que necesites antes de guardar.
          </p>
        )}
        {aiLoading && (
          <p className="text-xs text-green-600 animate-pulse">
            Analizando el producto y generando datos...  esto puede tardar unos segundos.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Col principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos básicos */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Datos del producto</h2>
            <Input
              label="Nombre *"
              required
              value={form.nombre}
              onChange={e => {
                setForm(f => ({ ...f, nombre: e.target.value }))
                autoSlug(e.target.value)
              }}
            />
            <Input
              label="Slug (URL)"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generado-del-nombre"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción corta</label>
              <input
                type="text"
                value={form.descripcionCorta}
                onChange={e => setForm(f => ({ ...f, descripcionCorta: e.target.value }))}
                placeholder="Resumen en 1-2 oraciones para las cards"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción completa</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={6}
                placeholder="Descripción detallada, características técnicas, instrucciones..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Marca" value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} />
              <Input label="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="grow tent, interior, hidroponia"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Imágenes */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Imágenes</h2>
              <span className="text-xs text-gray-400">{form.imagenes.length}/5</span>
            </div>

            {/* Mockup 3D */}
            <div>
              <button
                type="button"
                onClick={() => setShowMockup3D(true)}
                disabled={form.imagenes.length >= 5}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 py-6 text-sm text-green-800 hover:border-green-500 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Shirt className="h-6 w-6" />
                <span className="font-medium">{mockup3dConfig ? 'Editar mockup 3D' : 'Crear mockup 3D de remera'}</span>
                <span className="text-xs text-green-600">Diseñá la estampa en 3D y usala como imagen del producto</span>
              </button>
              {mockup3dConfig && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                  <span className="text-xs text-green-700">✓ Vista 3D interactiva habilitada para este producto</span>
                  <button
                    type="button"
                    onClick={() => setMockup3dConfig(null)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>

            {/* Upload desde computadora */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadLoading || form.imagenes.length >= 5}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading || form.imagenes.length >= 5}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-6 text-sm text-gray-500 hover:border-green-400 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploadLoading ? (
                  <><Loader2 className="h-6 w-6 animate-spin" /><span>Subiendo...</span></>
                ) : (
                  <><ImagePlus className="h-6 w-6" /><span>Seleccionar imágenes desde la computadora</span><span className="text-xs">JPG, PNG o WebP · máx. 2 MB cada una · hasta {5 - form.imagenes.length} más</span></>
                )}
              </button>
              {uploadError && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
              )}
            </div>

            {/* O agregar por URL */}
            <div className="flex gap-2">
              <input
                type="url"
                value={nuevaImagen}
                onChange={e => setNuevaImagen(e.target.value)}
                placeholder="O pegá una URL de imagen"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarImagen() } }}
                disabled={form.imagenes.length >= 5}
              />
              <Button type="button" variant="outline" onClick={agregarImagen} disabled={form.imagenes.length >= 5}>
                <Plus className="h-4 w-4" /> URL
              </Button>
            </div>

            {/* Preview */}
            {form.imagenes.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {form.imagenes.map((img, i) => (
                  <div key={i} className="relative group aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full rounded-lg object-cover bg-gray-50 border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => quitarImagen(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-xs bg-green-700 text-white px-1.5 py-0.5 rounded">Principal</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">La primera imagen es la principal. Podés reordenar eliminando y volviendo a subir.</p>
          </div>

          {/* Variantes */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Variantes</h2>
              <Button type="button" variant="outline" size="sm" onClick={agregarVariante}>
                <Plus className="h-3.5 w-3.5" /> Agregar variante
              </Button>
            </div>
            {variantes.length === 0 ? (
              <p className="text-sm text-gray-400">Sin variantes — el producto se vende en una sola versión.</p>
            ) : (
              <div className="space-y-3">
                {variantes.map((v, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-end rounded-lg border border-gray-100 p-3 bg-gray-50">
                    <Input
                      label={i === 0 ? 'Tipo' : ''}
                      value={v.nombre}
                      onChange={e => actualizarVariante(i, 'nombre', e.target.value)}
                      placeholder="Ej: Potencia"
                    />
                    <Input
                      label={i === 0 ? 'Valor' : ''}
                      value={v.valor}
                      onChange={e => actualizarVariante(i, 'valor', e.target.value)}
                      placeholder="Ej: 600W"
                    />
                    <Input
                      label={i === 0 ? 'Sobreprecio' : ''}
                      type="number"
                      value={v.precio}
                      onChange={e => actualizarVariante(i, 'precio', e.target.value)}
                      placeholder="0"
                    />
                    <Input
                      label={i === 0 ? 'Stock' : ''}
                      type="number"
                      value={v.stock}
                      onChange={e => actualizarVariante(i, 'stock', e.target.value)}
                    />
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => quitarVariante(i)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar del form */}
        <div className="space-y-6">
          {/* Precio y stock */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Precio y stock</h2>
            <Input label="Precio (ARS) *" type="number" required min="0" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
            <Input label="Precio anterior (tachado)" type="number" min="0" step="0.01" value={form.precioAnterior} onChange={e => setForm(f => ({ ...f, precioAnterior: e.target.value }))} />
            <Input label="Stock disponible" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            <Input label="Stock mínimo (alerta)" type="number" min="0" value={form.stockMinimo} onChange={e => setForm(f => ({ ...f, stockMinimo: e.target.value }))} />
            <Input label="Peso (kg)" type="number" min="0" step="0.01" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} />
          </div>

          {/* Organización */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Organización</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                required
                value={form.categoriaId}
                onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Producto destacado</label>
              <input type="checkbox" checked={form.destacado} onChange={e => setForm(f => ({ ...f, destacado: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Activo en tienda</label>
              <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            </div>
          </div>

          {/* Guardar */}
          <Button type="submit" size="lg" className="w-full" loading={pending}>
            {producto ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </div>

      {showMockup3D && (
        <Mockup3DModal
          onClose={() => setShowMockup3D(false)}
          onUseImage={agregarImagenDesdeMockup}
        />
      )}
    </form>
  )
}
