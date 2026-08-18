'use client'

import dynamic from 'next/dynamic'
import { X } from 'lucide-react'

const Mockup3DStudio = dynamic(() => import('./Mockup3DStudio'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#93a0ad', background: '#0c0f12' }}>
      Cargando estudio 3D…
    </div>
  ),
})

interface Props {
  onClose: () => void
  onUseImage: (dataUrl: string) => void
  initialColor?: string
}

export function Mockup3DModal({ onClose, onUseImage, initialColor }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%', maxWidth: 1180, height: '88vh',
          borderRadius: 16, overflow: 'hidden', position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(22,27,33,0.9)', border: '1px solid #2a323b',
            color: '#e8edf2', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
        <Mockup3DStudio onUseImage={onUseImage} initialColor={initialColor} />
      </div>
    </div>
  )
}
