'use client'

import dynamic from 'next/dynamic'
import type { Mockup3DConfig } from './Mockup3DModal'

const ProductMockupScene = dynamic(() => import('./ProductMockupScene'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#888', background: '#e9e9e9' }}>
      Cargando vista 3D…
    </div>
  ),
})

interface Props {
  config: Mockup3DConfig
}

export function ProductMockupViewer({ config }: Props) {
  return <ProductMockupScene config={config} />
}
