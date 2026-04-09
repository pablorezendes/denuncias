/**
 * Cliente HTTP central — todas as chamadas do frontend para o backend
 * passam por aqui. Encapsula:
 *  - Base URL (VITE_API_URL)
 *  - JWT no Authorization header (lido de sessionStorage)
 *  - Error handling consistente (lança Error com mensagem do backend)
 *  - JSON serialization automática
 *  - Redirect para /admin/login quando 401
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'hsfa_token'

// ------------------------------------------------------------
// Token management (sessionStorage, não persiste ao fechar o browser)
// ------------------------------------------------------------
export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* navegador em modo privado, etc. */
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* noop */
  }
}

// ------------------------------------------------------------
// Tipos de erro
// ------------------------------------------------------------
export class HttpError extends Error {
  public readonly status: number
  public readonly details?: unknown
  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

// ------------------------------------------------------------
// Fetch wrapper
// ------------------------------------------------------------
export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  // se true, o retorno é o Response cru (para downloads, por exemplo)
  raw?: boolean
  // não envia Authorization header mesmo com token presente (rotas públicas)
  skipAuth?: boolean
  // query params
  params?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, params?: FetchOptions['params']): string {
  const base = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  if (!params) return base
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `${base}?${qs}` : base
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const { body, raw, skipAuth, params, headers, ...rest } = opts
  const token = skipAuth ? null : getToken()

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  }

  let finalBody: BodyInit | undefined = undefined
  if (body !== undefined) {
    if (body instanceof FormData) {
      finalBody = body // browser define Content-Type com boundary
    } else {
      finalHeaders['Content-Type'] = 'application/json'
      finalBody = JSON.stringify(body)
    }
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, params), {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    })
  } catch (err) {
    throw new HttpError(0, 'Falha de rede. Verifique sua conexão.', err)
  }

  // 401: token inválido/expirado — limpa e redireciona
  if (res.status === 401) {
    clearToken()
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
      window.location.href = '/admin/login'
    }
    throw new HttpError(401, 'Sessão expirada. Faça login novamente.')
  }

  if (raw) {
    if (!res.ok) {
      throw new HttpError(res.status, `Erro ${res.status}`)
    }
    return res as unknown as T
  }

  // Resposta sem corpo
  if (res.status === 204) {
    return undefined as T
  }

  let data: any
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  } else {
    data = await res.text()
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      `Erro ${res.status}`
    throw new HttpError(res.status, String(message), data)
  }

  return data as T
}

// ------------------------------------------------------------
// Helpers de conveniência
// ------------------------------------------------------------
export const api = {
  get: <T = unknown>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),
  patch: <T = unknown>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T = unknown>(path: string, body?: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T = unknown>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { ...opts, method: 'DELETE' }),
}
