import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import type { User } from '@/types/database'

interface AdminLayoutProps {
  children: ReactNode
  user: User
  onLogout: () => void
}

export default function AdminLayout({ children, user, onLogout }: AdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-hsfa-bg-soft">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

