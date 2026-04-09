import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { verificarPermissao } from '@/lib/api/auth'
import type { User } from '@/types/database'

interface ProtectedRouteProps {
  user: User | null
  permission?: string
  children: React.ReactNode
}

/**
 * Componente que protege rotas baseado em autenticação e permissões
 */
export default function ProtectedRoute({ 
  user, 
  permission, 
  children 
}: ProtectedRouteProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkPermission() {
      if (!user) {
        setHasPermission(false)
        return
      }

      if (!permission) {
        // Se não há permissão específica, apenas verifica autenticação
        setHasPermission(true)
        return
      }

      const has = await verificarPermissao(user.id, permission)
      setHasPermission(has)
    }

    checkPermission()
  }, [user, permission])

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

