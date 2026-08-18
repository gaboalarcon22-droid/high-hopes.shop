'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, ShoppingBag, Tag, Users, Settings,
  Shirt, LogOut, UserRound, AlertTriangle,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  badge?: number
}

interface Props {
  stockAlerta?: number
}

export function AdminSidebar({ stockAlerta = 0 }: Props) {
  const pathname = usePathname()

  const NAV_ITEMS: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/productos', label: 'Productos', icon: Package },
    { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
    { href: '/admin/clientes', label: 'Clientes', icon: UserRound },
    { href: '/admin/stock', label: 'Stock', icon: AlertTriangle, badge: stockAlerta },
    { href: '/admin/categorias', label: 'Categorías', icon: Tag },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
          <Shirt className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm">High Hopes</div>
          <div className="text-xs text-gray-400">Panel Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-green-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-700">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
