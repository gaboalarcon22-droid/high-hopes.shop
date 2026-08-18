'use client'

import dynamic from 'next/dynamic'

const ProductMockupScene = dynamic(() => import('./ProductMockupScene'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#888', background: '#e9e9e9' }}>
      Cargando vista 3D…
    </div>
  ),
})

interface Props {
  imageUrl: string
  garmentColor?: string
}

export function ProductMockupViewer({ imageUrl, garmentColor }: Props) {
  return <ProductMockupScene imageUrl={imageUrl} garmentColor={garmentColor} />
}
