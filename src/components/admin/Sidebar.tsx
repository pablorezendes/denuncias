import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Home
} from 'lucide-react'
import logoPNG from '@/assets/logos/logo.png'
import type { User } from '@/types/database'

interface SidebarProps {
  user: User
  onLogout: () => void
}

interface MenuItem {
  label: string
  path: string
  icon: React.ElementType
  badge?: number
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Denúncias',
    path: '/admin/denuncias',
    icon: FileText,
  },
  {
    label: 'Usuários',
    path: '/admin/usuarios',
    icon: Users,
  },
  {
    label: 'Relatórios',
    path: '/admin/relatorios',
    icon: BarChart3,
  },
]

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.path)
    const Icon = item.icon

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all group
          ${active 
            ? 'bg-hsfa-primary text-white shadow-md' 
            : 'text-hsfa-text hover:bg-hsfa-soft hover:text-hsfa-primary'
          }
        `}
      >
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-lg transition-colors
          ${active 
            ? 'bg-white/20' 
            : 'bg-hsfa-soft group-hover:bg-hsfa-primary/10'
          }
        `}>
          <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-hsfa-primary'}`} />
        </div>
        <span className={`font-medium flex-1 ${isOpen ? 'block' : 'hidden'}`}>
          {item.label}
        </span>
        {item.badge && isOpen && (
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
            active ? 'bg-white text-hsfa-primary' : 'bg-hsfa-primary text-white'
          }`}>
            {item.badge}
          </span>
        )}
        {active && isOpen && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-hsfa-muted z-50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-20'}
          lg:relative lg:z-auto
        `}
      >
        {/* Header */}
        <div className="h-16 border-b border-hsfa-muted flex items-center justify-between px-4 bg-hsfa-secondary">
          {isOpen && (
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <img 
                src={logoPNG} 
                alt="HSFA" 
                className="h-8 w-auto object-contain"
              />
              <span className="text-white font-bold text-sm">Painel Admin</span>
            </Link>
          )}
          {!isOpen && (
            <Link to="/admin/dashboard" className="flex items-center justify-center w-full">
              <img 
                src={logoPNG} 
                alt="HSFA" 
                className="h-8 w-auto object-contain"
              />
            </Link>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white hover:text-hsfa-soft transition-colors"
            title={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <X className="w-6 h-6" />
          </button>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="hidden lg:block text-white hover:text-hsfa-soft transition-colors ml-auto"
              title="Recolher menu"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Info */}
        {isOpen && (
          <div className="p-4 border-b border-hsfa-muted bg-hsfa-bg-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-hsfa-primary flex items-center justify-center text-white font-semibold">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-hsfa-text truncate">
                  {user.nome}
                </p>
                <p className="text-xs text-hsfa-text-soft truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Home Link */}
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-hsfa-text hover:bg-hsfa-soft hover:text-hsfa-primary transition-all group mb-4"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-hsfa-soft group-hover:bg-hsfa-primary/10 transition-colors">
              <Home className="w-5 h-5 text-hsfa-primary" />
            </div>
            <span className={`font-medium ${isOpen ? 'block' : 'hidden'}`}>
              Voltar ao Site
            </span>
          </Link>

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map(item => (
              <div key={item.path} className="relative">
                {renderMenuItem(item)}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-hsfa-muted p-4">
          <button
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-red-600 hover:bg-red-50 transition-all
              ${isOpen ? 'justify-start' : 'justify-center'}
            `}
          >
            <LogOut className="w-5 h-5" />
            <span className={`font-medium ${isOpen ? 'block' : 'hidden'}`}>
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-hsfa-primary text-white p-3 rounded-lg shadow-lg hover:bg-hsfa-primary-dark transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  )
}

