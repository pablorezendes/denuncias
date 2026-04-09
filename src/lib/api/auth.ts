import { api, setToken, clearToken, getToken } from '../http'
import type { User } from '@/types/database'

interface LoginResponse {
  token: string
  user: User & { permissions?: string[] }
}

/**
 * Autentica um usuário no backend e armazena o JWT.
 */
export async function login(usuario: string, senha: string): Promise<User> {
  const data = await api.post<LoginResponse>(
    '/auth/login',
    { usuario, senha },
    { skipAuth: true },
  )
  setToken(data.token)
  return data.user
}

/**
 * Faz logout — invalida o token local.
 * Chamada ao backend é opcional (JWT stateless).
 */
export async function logout() {
  try {
    if (getToken()) {
      await api.post('/auth/logout').catch(() => {})
    }
  } finally {
    clearToken()
  }
}

/**
 * Verifica se o token atual é válido e retorna o usuário.
 * Usado no boot da aplicação para restaurar sessão.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!getToken()) return null
  try {
    const { user } = await api.get<{ user: User }>('/auth/me')
    return user
  } catch {
    clearToken()
    return null
  }
}

/**
 * Verifica se o usuário tem uma permissão específica.
 * Usa a lista de permissões que já vem no JWT/me.
 */
export async function verificarPermissao(
  _userId: number,
  permissionSlug: string,
): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  const perms = (user as unknown as { permissions?: string[] }).permissions || []
  return perms.includes(permissionSlug)
}

/**
 * Busca permissões do usuário.
 */
export async function buscarPermissoesUsuario(_userId: number): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  return (user as unknown as { permissions?: string[] }).permissions || []
}
