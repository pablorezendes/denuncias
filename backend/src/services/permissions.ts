import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { userRole, rolePermission, roles, permissions } from '../db/schema/index.js'

/**
 * Busca lista de permission slugs do usuário.
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const rows = await db
    .select({ slug: permissions.slug })
    .from(userRole)
    .innerJoin(roles, eq(roles.id, userRole.roleId))
    .innerJoin(rolePermission, eq(rolePermission.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermission.permissionId))
    .where(eq(userRole.userId, userId))

  return [...new Set(rows.map((r) => r.slug))]
}

/**
 * Busca lista de roles (nomes) do usuário.
 */
export async function getUserRoles(userId: number): Promise<string[]> {
  const rows = await db
    .select({ nome: roles.nome })
    .from(userRole)
    .innerJoin(roles, eq(roles.id, userRole.roleId))
    .where(eq(userRole.userId, userId))

  return rows.map((r) => r.nome)
}
