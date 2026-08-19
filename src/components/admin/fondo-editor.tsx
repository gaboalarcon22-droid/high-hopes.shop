'use client'

import { useRef, useState } from 'react'
import { Loader2, ImagePlus, X } from 'lucide-react'
import type { FondoBlock, FondoTipo } from '@/lib/fondos'

interface Props {
  titulo: string
  descripcion?: string
  value: FondoBlock
  onChange: (next: FondoBlock) => void
}

const TIPOS: { value: FondoTipo; label: string }[] = [
  { value: 'color', label: 'Color sólido' },
  { value: 'gradiente', label: 'Degradado' },
  { value: 'imagen', label: 'Imagen' },
]

export function FondoEditor({ titulo, descripcion, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set(patch: Partial<FondoBlock>) {
    onChange({ ...value, ...patch })
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('images', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir')
      set({ imagenUrl: data.urls[0] })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir la imagen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const previewStyle =
    value.tipo === 'imagen' && value.imagenUrl
      ? {
          backgroundImage: `linear-gradient(rgba(0,0,0,${Math.min(100, Math.max(0, value.overlay)) / 100}), rgba(0,0,0,${Math.min(100, Math.max(0, value.overlay)) / 100})), url(${value.imagenUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : value.tipo === 'gradiente'
      ? { background: `linear-gradient(${value.angulo}deg, ${value.color}, ${value.color2})` }
      : { background: value.color }

  return (
    <div className="rounded-lg border border-gray-100 p-4 space-y-3 bg-gray-50/50">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
        {descripcion && <p className="text-xs text-gray-400">{descripcion}</p>}
      </div>

      {/* Preview */}
      <div className="h-16 rounded-lg border border-gray-200" style={previewStyle} />

      {/* Tipo */}
      <div className="flex gap-2">
        {TIPOS.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => set({ tipo: t.value })}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              value.tipo === t.value
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-green-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {value.tipo === 'color' && (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value.color}
            onChange={e => set({ color: e.target.value })}
            className="h-9 w-14 rounded border border-gray-200 cursor-pointer"
          />
          <span className="text-xs text-gray-500">{value.color}</span>
        </div>
      )}

      {value.tipo === 'gradiente' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input type="color" value={value.color} onChange={e => set({ color: e.target.value })} className="h-9 w-14 rounded border border-gray-200 cursor-pointer" />
            <span className="text-xs text-gray-500">{value.color}</span>
            <span className="text-xs text-gray-300">→</span>
            <input type="color" value={value.color2} onChange={e => set({ color2: e.target.value })} className="h-9 w-14 rounded border border-gray-200 cursor-pointer" />
            <span className="text-xs text-gray-500">{value.color2}</span>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ángulo: {value.angulo}°</label>
            <input
              type="range"
              min={0}
              max={360}
              value={value.angulo}
              onChange={e => set({ angulo: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {value.tipo === 'imagen' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={e => handleFile(e.target.files?.[0])}
          />
          {value.imagenUrl ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-green-400"
              >
                Cambiar imagen
              </button>
              <button
                type="button"
                onClick={() => set({ imagenUrl: '' })}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white py-4 text-xs text-gray-500 hover:border-green-400 hover:text-green-700 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? 'Subiendo...' : 'Subir imagen de fondo'}
            </button>
          )}
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Oscurecer imagen (para que el texto se lea): {value.overlay}%</label>
            <input
              type="range"
              min={0}
              max={90}
              value={value.overlay}
              onChange={e => set({ overlay: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
