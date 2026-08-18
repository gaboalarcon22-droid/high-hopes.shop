'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props { id: string; activo: boolean }

export function ProductoToggle({ id, activo: initialActivo }: Props) {
  const [activo, setActivo] = useState(initialActivo)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function toggle() {
    const newVal = !activo
    setActivo(newVal)
    await fetch(`/api/admin/productos/${id}/toggle`, { method: 'PATCH' })
    startTransition(() => router.refresh())
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
        ${activo ? 'bg-green-600' : 'bg-gray-200'} ${pending ? 'opacity-50' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
          ${activo ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}
