'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productoId: string
  varianteId?: string
  nombre: string
  precio: number
  imagen: string
  cantidad: number
  variante?: string
}

interface CartStore {
  items: CartItem[]
  agregar: (item: CartItem) => void
  quitar: (productoId: string, varianteId?: string) => void
  actualizar: (productoId: string, cantidad: number, varianteId?: string) => void
  vaciar: () => void
  totalItems: () => number
  totalPrecio: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (item) => {
        set(state => {
          const idx = state.items.findIndex(
            i => i.productoId === item.productoId && i.varianteId === item.varianteId
          )
          if (idx >= 0) {
            const updated = [...state.items]
            updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + item.cantidad }
            return { items: updated }
          }
          return { items: [...state.items, item] }
        })
      },

      quitar: (productoId, varianteId) => {
        set(state => ({
          items: state.items.filter(
            i => !(i.productoId === productoId && i.varianteId === varianteId)
          ),
        }))
      },

      actualizar: (productoId, cantidad, varianteId) => {
        if (cantidad <= 0) {
          get().quitar(productoId, varianteId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.productoId === productoId && i.varianteId === varianteId
              ? { ...i, cantidad }
              : i
          ),
        }))
      },

      vaciar: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, i) => acc + i.cantidad, 0),
      totalPrecio: () => get().items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    }),
    { name: 'highhopes-cart' }
  )
)
