import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { CategoriasManager } from '@/components/admin/categorias-manager'

export default async function CategoriasPage() {
  const session = await getSession()

  const categorias = await db.categoria.findMany({
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    include: {
      _count: { select: { productos: { where: { activo: true } } } },
    },
  })

  return (
    <CategoriasManager
      categorias={categorias}
      esAdmin={session?.rol === 'ADMIN'}
    />
  )
}
