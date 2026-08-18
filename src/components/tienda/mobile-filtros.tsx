'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import type { Categoria } from '@prisma/client'

const OPCIONES_ORDEN = [
  { value: '', label: 'Relevancia' },
  { value: 'nuevo', label: 'Más nuevos' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
]

interface Props {
  categorias: Categoria[]
  categoriaActiva?: string
  ordenActivo?: string
}

export function MobileFiltros({ categorias, categoriaActiva, ordenActivo }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) { params.set(key, value) } else { params.delete(key) }
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  const tieneFiltroCat = !!categoriaActiva
  const tieneOrden = !!(ordenActivo && ordenActivo !== '')

  return (
    <div className="mobile-filtros-wrap">
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 10,
          background: open ? '#c6ff1a' : '#111111',
          border: `1px solid ${open ? '#c6ff1a' : 'rgba(255,255,255,0.1)'}`,
          color: open ? '#0a0a0a' : '#ccc',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <SlidersHorizontal size={16} />
        Filtros
        {(tieneFiltroCat || tieneOrden) && (
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c6ff1a', flexShrink: 0 }} />
        )}
        {open ? <X size={14} /> : <span style={{ fontSize: '0.7rem' }}>▼</span>}
      </button>

      {open && (
        <div style={{
          marginTop: 10,
          padding: '20px 16px',
          borderRadius: 14,
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>

          {/* Búsqueda */}
          <form onSubmit={e => {
            e.preventDefault()
            const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
            setParam('q', q || undefined)
          }}>
            <input
              name="q"
              defaultValue={searchParams.get('q') ?? ''}
              placeholder="Buscar productos..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#181818',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: '0.87rem', color: '#fff', outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#c6ff1a')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            />
          </form>

          {/* Categorías centradas */}
          <div>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#555',
              display: 'block', textAlign: 'center', marginBottom: 14,
            }}>
              Categorías
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              <button
                onClick={() => setParam('cat', undefined)}
                style={{
                  padding: '8px 18px', borderRadius: 999,
                  fontSize: '0.84rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: !categoriaActiva ? '#c6ff1a' : '#1c1c1c',
                  color: !categoriaActiva ? '#0a0a0a' : '#888',
                  transition: 'all 0.15s',
                }}
              >
                Todos
              </button>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setParam('cat', cat.slug)}
                  style={{
                    padding: '8px 18px', borderRadius: 999,
                    fontSize: '0.84rem', fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: categoriaActiva === cat.slug ? '#c6ff1a' : '#1c1c1c',
                    color: categoriaActiva === cat.slug ? '#0a0a0a' : '#888',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat.icono && <span style={{ marginRight: 5 }}>{cat.icono}</span>}
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Ordenar */}
          <div>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: '#555',
              display: 'block', textAlign: 'center', marginBottom: 14,
            }}>
              Ordenar por
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {OPCIONES_ORDEN.map(op => (
                <button
                  key={op.value}
                  onClick={() => setParam('orden', op.value || undefined)}
                  style={{
                    padding: '8px 18px', borderRadius: 999,
                    fontSize: '0.84rem', fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: (ordenActivo ?? '') === op.value ? '#c6ff1a' : '#1c1c1c',
                    color: (ordenActivo ?? '') === op.value ? '#0a0a0a' : '#888',
                    transition: 'all 0.15s',
                  }}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
