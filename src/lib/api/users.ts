import { api } from '../http'
import type { User, Role as DbRole, Permission as DbPermission } from '@/types/database'

export interface UserListItem {
  id: number
  nome: string
  email: string
  usuario: string
  ativo: boolean
  tentativas_login: number
  bloqueado_ate: string | null
  ultimo_acesso: string | null
  force_password_change: boolean
  created_at: string
  updated_at: string | null
  roles?: DbRole[]
}

/**
 * Lista todos os usuários com seus perfis/roles.
 */
export async function listarUsuarios(): Promise<UserListItem[]> {
  return api.get<UserListItem[]>('/users')
}

/**
 * Busca um usuário por ID (inclui roles e permissões).
 */
export async function buscarUsuarioPorId(userId: number): Promise<User & { roles: DbRole[] }> {
  return api.get<User & { roles: DbRole[] }>(`/users/${userId}`)
}

/**
 * Cria um novo usuário.
 */
export async function criarUsuario(dados: {
  nome: string
  email: string
  usuario: string
  senha: string
  roles?: number[]
  ativo?: boolean
}) {
  return api.post<{ id: number }>('/users', {
    nome: dados.nome,
    email: dados.email,
    usuario: dados.usuario,
    senha: dados.senha,
    roles: dados.roles || [],
    ativo: dados.ativo !== false,
  })
}

/**
 * Atualiza um usuário.
 */
export async function atualizarUsuario(
  userId: number,
  dados: {
    nome?: string
    email?: string
    usuario?: string
    senha?: string
    ativo?: boolean
    roles?: number[]
  },
) {
  return api.patch(`/users/${userId}`, dados)
}

/**
 * Remove um usuário.
 */
export async function removerUsuario(userId: number) {
  return api.delete(`/users/${userId}`)
}

// ============================================================
// Roles
// ============================================================

// Re-exporta os tipos principais de types/database para manter compatibilidade
export type Role = DbRole & {
  permissions?: DbPermission[]
}

/**
 * Lista todas as roles (com permissões aninhadas).
 */
export async function listarRoles(): Promise<Role[]> {
  return api.get<Role[]>('/roles')
}

export async function criarRole(dados: {
  nome: string
  descricao?: string
  nivel: number
  permissions?: number[]
}) {
  return api.post<{ id: number }>('/roles', dados)
}

export async function atualizarRole(
  roleId: number,
  dados: {
    nome?: string
    descricao?: string
    nivel?: number
    ativo?: boolean
    permissions?: number[]
  },
) {
  return api.patch(`/roles/${roleId}`, dados)
}

export async function removerRole(roleId: number) {
  return api.delete(`/roles/${roleId}`)
}

// ============================================================
// Permissões
// ============================================================

export type Permission = DbPermission

export async function listarPermissoes(): Promise<Permission[]> {
  return api.get<Permission[]>('/permissions')
}
