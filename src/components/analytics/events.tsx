'use client'

import { useEffect, useRef } from 'react'
import { trackViewItemList, trackPurchase, type TrackItem } from '@/lib/analytics'

// Clave donde el checkout deja los datos de la compra para la pantalla de gracias.
export const PURCHASE_KEY = 'hh_purchase'

export function ViewItemList({ listName, items }: { listName: string; items: TrackItem[] }) {
  // La lista solo cambia cuando cambia la categoría o la búsqueda.
  const signature = listName + '|' + items.map(i => i.item_id).join(',')
  const ultima = useRef('')
  useEffect(() => {
    if (items.length === 0 || ultima.current === signature) return
    ultima.current = signature
    trackViewItemList(listName, items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])
  return null
}

// Dispara `purchase` una sola vez por pedido: lee lo que dejó el checkout y lo borra.
export function PurchaseEvent({ pedido }: { pedido?: string }) {
  useEffect(() => {
    if (!pedido) return
    try {
      const raw = sessionStorage.getItem(PURCHASE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as { transaction_id: string; value: number; items: TrackItem[]; payment_type?: string }
      if (data.transaction_id !== pedido) return
      sessionStorage.removeItem(PURCHASE_KEY)
      trackPurchase(data)
    } catch {
      /* sin sessionStorage o dato inválido: no se mide, no se rompe la página */
    }
  }, [pedido])
  return null
}
