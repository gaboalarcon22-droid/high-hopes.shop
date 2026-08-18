'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { slugify } from '@/lib/utils'
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import type { Categoria } from '@prisma/client'

type CategoriaConCount = Categoria & { _count: { productos: number } }

interface Props {
  categorias: CategoriaConCount[]
  esAdmin: boolean
}

const ICONOS_SUGERIDOS = ['🌱', '💡', '⚡', '💨', '🧪', '🚚', '🔒', '🔧', '🌿', '🔬', '📦', '🎯', '💊', '🧬']

function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function CategoriasManager({ categorias: inicial, esAdmin }: Props) {
  const router = useRouter()
  const [categorias, setCategorias] = useState(inicial)
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null)
  const [editando, setEditando] = useState<CategoriaConCount | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    icono: '',
    activa: true,
  })

  function abrirCrear() {
    setForm({ nombre: '', slug: '', descripcion: '', icono: '', activa: true })
    setError('')
    setModal('crear')
  }

  function abrirEditar(cat: CategoriaConCount) {
    setForm({
      nombre: cat.nombre,
      slug: cat.slug,
      descripcion: cat.descripcion ?? '',
      icono: cat.icono ?? '',
      activa: cat.activa,
    })
    setEditando(cat)
    setError('')
    setModal('editar')
  }

  function cerrar() {
    setModal(null)
    setEditando(null)
    setError('')
  }

  async function guardar() {
    setError('')
    setLoading(true)
    try {
      const url = modal === 'editar' ? `/api/admin/categorias/${editando!.id}` : '/api/admin/categorias'
      const method = modal === 'editar' ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      cerrar()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActiva(cat: CategoriaConCount) {
    try {
      const res = await fetch(`/api/admin/categorias/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !cat.activa }),
      })
      if (!res.ok) return
      setCategorias(prev =>
        prev.map(c => (c.id === cat.id ? { ...c, activa: !c.activa } : c))
      )
    } catch {}
  }

  async function moverOrden(cat: CategoriaConCount, direccion: 'up' | 'down') {
    const idx = categorias.findIndex(c => c.id === cat.id)
    if (idx < 0) return
    if (direccion === 'up' && idx === 0) return
    if (direccion === 'down' && idx === categorias.length - 1) return

    const vecino = categorias[direccion === 'up' ? idx - 1 : idx + 1]
    if (!vecino) return

    // Intercambiar órdenes
    await Promise.all([
      fetch(`/api/admin/categorias/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: vecino.orden }),
      }),
      fetch(`/api/admin/categorias/${vecino.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: cat.orden }),
      }),
    ])

    const nuevas = [...categorias]
    ;[nuevas[idx], nuevas[direccion === 'up' ? idx - 1 : idx + 1]] =
      [nuevas[direccion === 'up' ? idx - 1 : idx + 1], nuevas[idx]]
    setCategorias(nuevas)
  }

  async function eliminar(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categorias/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setCategorias(prev => prev.filter(c => c.id !== id))
      setConfirmDelete(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  const FormularioCategoria = (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={e => {
              const nombre = e.target.value
              setForm(f => ({
                ...f,
                nombre,
                slug: modal === 'crear' ? slugify(nombre) : f.slug,
              }))
            }}
            placeholder="Iluminación"
          />
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ícono</label>
          <input
            type="text"
            value={form.icono}
            onChange={e => setForm(f => ({ ...f, icono: e.target.value }))}
            placeholder="💡"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={4}
          />
        </div>
      </div>

      {/* Íconos sugeridos */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Sugerencias:</p>
        <div className="flex flex-wrap gap-1.5">
          {ICONOS_SUGERIDOS.map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setForm(f => ({ ...f, icono: i }))}
              className={`text-lg px-2 py-1 rounded-lg border transition-colors ${
                form.icono === i
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Slug (URL)"
        value={form.slug}
        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
        placeholder="remeras"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          rows={2}
          placeholder="Breve descripción de la categoría..."
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          id="cat-activa"
          type="checkbox"
          checked={form.activa}
          onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label htmlFor="cat-activa" className="text-sm text-gray-700">Categoría activa en tienda</label>
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={cerrar}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          loading={loading}
          onClick={guardar}
          disabled={!form.nombre.trim() || !form.slug.trim()}
        >
          {modal === 'editar' ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">{categorias.length} categorías · Arrastrá las flechas para reordenar</p>
        </div>
        {esAdmin && (
          <Button onClick={abrirCrear}>
            <Plus className="h-4 w-4" /> Nueva categoría
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {categorias.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            Sin categorías. {esAdmin && <button onClick={abrirCrear} className="text-green-700 hover:underline">Crear la primera</button>}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {categorias.map((cat, idx) => (
              <div key={cat.id} className="flex items-center gap-4 px-6 py-4">
                {/* Orden */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moverOrden(cat, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moverOrden(cat, 'down')}
                    disabled={idx === categorias.length - 1}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Ícono */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl flex-shrink-0">
                  {cat.icono || '📦'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{cat.nombre}</span>
                    {!cat.activa && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactiva</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    /{cat.slug} · {cat._count.productos} producto{cat._count.productos !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActiva(cat)}
                    title={cat.activa ? 'Desactivar' : 'Activar'}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {cat.activa ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  {esAdmin && (
                    <>
                      <button
                        onClick={() => abrirEditar(cat)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(cat.id)}
                        disabled={cat._count.productos > 0}
                        title={cat._count.productos > 0 ? 'Tiene productos activos' : 'Eliminar'}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <Modal titulo={modal === 'crear' ? 'Nueva categoría' : 'Editar categoría'} onClose={cerrar}>
          {FormularioCategoria}
        </Modal>
      )}

      {/* Modal confirmar delete */}
      {confirmDelete && (
        <Modal titulo="¿Eliminar categoría?" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-gray-600 mb-5">Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <button
              onClick={() => eliminar(confirmDelete)}
              disabled={loading}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
