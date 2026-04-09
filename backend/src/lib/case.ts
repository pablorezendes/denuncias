/**
 * Conversor de camelCase para snake_case para serialização de respostas JSON.
 *
 * Motivação: o Drizzle ORM retorna objetos com chaves em camelCase (conforme
 * definido no schema TypeScript), mas o frontend React do sistema de denúncias
 * foi originalmente escrito para consumir o Supabase, que usa snake_case no
 * PostgREST/API. Para manter compatibilidade sem reescrever o frontend todo,
 * convertemos as respostas aqui no backend.
 */

type Primitive = string | number | boolean | null | undefined

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    !(v instanceof Date) &&
    !(v instanceof Buffer) &&
    Object.getPrototypeOf(v) === Object.prototype
  )
}

function camelKeyToSnake(key: string): string {
  // admin_id -> admin_id (ja snake, nao mexe)
  // adminId  -> admin_id
  // dataCriacao -> data_criacao
  // IPDenunciante -> i_p_denunciante (raro, mas mantemos consistente)
  return key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
}

/**
 * Converte recursivamente as chaves de um objeto (ou array) de camelCase para snake_case.
 * Preserva Date, Buffer e primitivos. Arrays são mapeados item a item.
 */
export function camelToSnake<T = unknown>(input: T): T {
  if (input === null || input === undefined) return input

  if (Array.isArray(input)) {
    return input.map((item) => camelToSnake(item)) as unknown as T
  }

  if (!isPlainObject(input)) {
    return input
  }

  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    output[camelKeyToSnake(key)] = camelToSnake(value)
  }
  return output as T
}

/**
 * Converte uma data (Date ou string ISO) para string ISO ou null.
 * Útil para normalizar saídas antes de enviar ao frontend.
 */
export function toIsoOrNull(v: Date | string | null | undefined): string | null {
  if (v === null || v === undefined) return null
  if (v instanceof Date) return v.toISOString()
  return v
}
