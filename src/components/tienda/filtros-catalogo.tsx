'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Categoria } from '@prisma/client'

interface Props {
  categorias: Categoria[]
  categoriaActiva?: string
  ordenActivo?: string
}

const OPCIONES_ORDEN = [
  { value: '', label: 'Relevancia' },
  { value: 'nuevo', label: 'Más nuevos' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
]

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: '#555',
  marginBottom: 12,
  display: 'block',
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '9px 12px',
        borderRadius: 9,
        fontSize: '0.87rem',
        fontWeight: active ? 600 : 400,
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s, color 0.2s',
        background: active ? '#c6ff1a' : 'transparent',
        color: active ? '#0a0a0a' : '#888',
      }}
    >
      {children}
    </button>
  )
}

export function FiltrosCatalogo({ categorias, categoriaActiva, ordenActivo }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) { params.set(key, value) } else { params.delete(key) }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Búsqueda */}
      <div>
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
              width: '100%',
              background: '#181818',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: '0.87rem',
              color: '#fff',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#c6ff1a')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          />
        </form>
      </div>

      {/* Categorías */}
      <div>
        <span style={labelStyle}>Categorías</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FilterBtn active={!categoriaActiva} onClick={() => setParam('cat', undefined)}>
            Todos los productos
          </FilterBtn>
          {categorias.map(cat => (
            <FilterBtn
              key={cat.id}
              active={categoriaActiva === cat.slug}
              onClick={() => setParam('cat', cat.slug)}
            >
              {cat.icono && <span style={{ marginRight: 8 }}>{cat.icono}</span>}
              {cat.nombre}
            </FilterBtn>
          ))}
        </div>
      </div>

      {/* Orden */}
      <div>
        <span style={labelStyle}>Ordenar por</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {OPCIONES_ORDEN.map(op => (
            <FilterBtn
              key={op.value}
              active={(ordenActivo ?? '') === op.value}
              onClick={() => setParam('orden', op.value || undefined)}
            >
              {op.label}
            </FilterBtn>
          ))}
        </div>
      </div>
    </div>
  )
}
