'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, X, Shield, UserCheck, UserX } from 'lucide-react'
import { formatFecha } from '@/lib/utils'

interface UsuarioItem {
  id: string
  email: string
  nombre: string
  rol: string
  activo: boolean
  creadoEn: string
}

interface Props {
  usuarios: UsuarioItem[]
  sesionId: string // ID del usuario logueado para no dejarlo desactivarse a sí mismo
}

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

export function UsuariosManager({ usuarios: inicial, sesionId }: Props) {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState(inicial)
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null)
  const [editando, setEditando] = useState<UsuarioItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rol: 'OPERADOR' as 'ADMIN' | 'OPERADOR',
    password: '',
    confirmar: '',
    activo: true,
  })

  function abrirCrear() {
    setForm({ nombre: '', email: '', rol: 'OPERADOR', password: '', confirmar: '', activo: true })
    setError('')
    setModal('crear')
  }

  function abrirEditar(u: UsuarioItem) {
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol as 'ADMIN' | 'OPERADOR', password: '', confirmar: '', activo: u.activo })
    setEditando(u)
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

    if (modal === 'crear' && form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (form.password && form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre,
        rol: form.rol,
      }

      if (modal === 'crear') {
        body.email = form.email
        body.password = form.password
      } else {
        body.activo = form.activo
        if (form.password) body.password = form.password
      }

      const url = modal === 'editar' ? `/api/admin/usuarios/${editando!.id}` : '/api/admin/usuarios'
      const method = modal === 'editar' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')

      if (modal === 'crear') {
        setUsuarios(prev => [...prev, data])
      } else {
        setUsuarios(prev => prev.map(u => (u.id === editando!.id ? data : u)))
      }

      cerrar()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActivo(u: UsuarioItem) {
    try {
      const res = await fetch(`/api/admin/usuarios/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error ?? 'Error')
        return
      }
      setUsuarios(prev => prev.map(usr => (usr.id === u.id ? data : usr)))
    } catch {}
  }

  const rolColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    OPERADOR: 'bg-blue-100 text-blue-800',
  }

  const FormContent = (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      <Input
        label="Nombre completo *"
        value={form.nombre}
        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
        placeholder="Juan García"
      />

      {modal === 'crear' && (
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="juan@highhopes.store"
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
        <select
          value={form.rol}
          onChange={e => setForm(f => ({ ...f, rol: e.target.value as 'ADMIN' | 'OPERADOR' }))}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="OPERADOR">OPERADOR — Gestiona productos y pedidos</option>
          <option value="ADMIN">ADMIN — Acceso completo</option>
        </select>
      </div>

      <Input
        label={modal === 'crear' ? 'Contraseña *' : 'Nueva contraseña (dejar vacío para no cambiar)'}
        type="password"
        value={form.password}
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        placeholder={modal === 'crear' ? 'Mínimo 8 caracteres' : '••••••••'}
      />

      {form.password && (
        <Input
          label="Confirmar contraseña"
          type="password"
          value={form.confirmar}
          onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
          placeholder="Repetir contraseña"
        />
      )}

      {modal === 'editar' && (
        <div className="flex items-center gap-3">
          <input
            id="usr-activo"
            type="checkbox"
            checked={form.activo}
            onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            disabled={editando?.id === sesionId}
          />
          <label htmlFor="usr-activo" className="text-sm text-gray-700">
            Usuario activo
            {editando?.id === sesionId && <span className="ml-1 text-gray-400">(no podés desactivarte a vos mismo)</span>}
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={cerrar}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          loading={loading}
          onClick={guardar}
          disabled={!form.nombre.trim() || (modal === 'crear' && (!form.email.trim() || !form.password))}
        >
          {modal === 'editar' ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} del panel admin</p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {usuarios.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Sin usuarios.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4">
                {/* Avatar */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold text-sm flex-shrink-0">
                  {u.nombre.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{u.nombre}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolColors[u.rol] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.rol}
                    </span>
                    {!u.activo && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactivo</span>
                    )}
                    {u.id === sesionId && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Vos</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {u.email} · Creado {formatFecha(u.creadoEn)}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActivo(u)}
                    disabled={u.id === sesionId}
                    title={u.activo ? 'Desactivar' : 'Activar'}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {u.activo ? <UserCheck className="h-4 w-4 text-green-600" /> : <UserX className="h-4 w-4 text-red-400" />}
                  </button>
                  <button
                    onClick={() => abrirEditar(u)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota de roles */}
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
          <Shield className="h-4 w-4" />
          Diferencia de roles
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>ADMIN:</strong> Acceso completo — productos, pedidos, categorías, usuarios, configuración. Puede eliminar.</p>
          <p><strong>OPERADOR:</strong> Puede crear/editar productos y gestionar pedidos. No puede eliminar ni acceder a usuarios/config.</p>
        </div>
      </div>

      {modal && (
        <Modal titulo={modal === 'crear' ? 'Nuevo usuario' : 'Editar usuario'} onClose={cerrar}>
          {FormContent}
        </Modal>
      )}
    </>
  )
}
