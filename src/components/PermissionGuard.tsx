import { useEffect, useState } from 'react'
import { verificarPermissao } from '@/lib/api/auth'
import type { User } from '@/types/database'

interface PermissionGuardProps {
  user: User
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Componente que renderiza children apenas se o usuário tiver a permissão especificada
 */
export default function PermissionGuard({ 
  user, 
  permission, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkPermission() {
      const has = await verificarPermissao(user.id, permission)
      setHasPermission(has)
    }

    checkPermission()
  }, [user.id, permission])

  if (hasPermission === null) {
    return null // Ou um loading spinner
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

