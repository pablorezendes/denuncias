/**
 * @deprecated O cliente Supabase foi removido na Fase 5.
 * Toda comunicação com o backend passa agora por `src/lib/http.ts`.
 *
 * Este arquivo existe apenas como placeholder para impedir imports
 * antigos de quebrar o build silenciosamente — qualquer uso dispara
 * um erro claro em runtime.
 */
const handler: ProxyHandler<object> = {
  get() {
    throw new Error(
      'O cliente Supabase foi removido. Use `api` de `src/lib/http.ts` ou funções em `src/lib/api/*`.',
    )
  },
}

export const supabase = new Proxy({}, handler) as never
