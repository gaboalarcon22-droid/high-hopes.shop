import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UsuariosManager } from '@/components/admin/usuarios-manager'
import { redirect } from 'next/navigation'

export default async function UsuariosPage() {
  const session = await getSession()

  // Solo ADMIN puede acceder
  if (!session || session.rol !== 'ADMIN') {
    redirect('/admin')
  }

  const usuarios = await db.usuario.findMany({
    orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
    select: {
      id: true,
      email: true,
      nombre: true,
      rol: true,
      activo: true,
      creadoEn: true,
    },
  })

  return (
    <UsuariosManager
      usuarios={usuarios.map(u => ({
        ...u,
        creadoEn: u.creadoEn.toISOString(),
      }))}
      sesionId={session.sub ?? ''}
    />
  )
}
