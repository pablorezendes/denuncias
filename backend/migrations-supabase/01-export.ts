/**
 * Passo 1 — Exporta todas as tabelas do Supabase para arquivos JSON locais.
 *
 * Variáveis necessárias no ambiente:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Service Role, NÃO a anon)
 *
 * Uso: tsx migrations-supabase/01-export.ts
 */
import { createClient } from '@supabase/supabase-js'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const TABLES = [
  'roles',
  'permissions',
  'categorias',
  'users',
  'user_role',
  'role_permission',
  'denuncias',
  'denuncia_categoria',
  'anexos',
  'historico_status',
  'respostas',
]

const DUMP_DIR = path.resolve('./dump')

async function exportTable(name: string) {
  let all: unknown[] = []
  let from = 0
  const pageSize = 1000
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.from(name).select('*').range(from, from + pageSize - 1)
    if (error) {
      console.error(`❌ Erro ao exportar ${name}:`, error.message)
      throw error
    }
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }
  const file = path.join(DUMP_DIR, `${name}.json`)
  await writeFile(file, JSON.stringify(all, null, 2))
  console.log(`✓ ${name.padEnd(25)} → ${String(all.length).padStart(6)} registros`)
  return all.length
}

async function main() {
  console.log('📦 Exportando dados do Supabase...\n')
  await mkdir(DUMP_DIR, { recursive: true })

  const resumo: Record<string, number> = {}
  for (const table of TABLES) {
    try {
      resumo[table] = await exportTable(table)
    } catch {
      resumo[table] = -1
    }
  }

  await writeFile(path.join(DUMP_DIR, '_resumo.json'), JSON.stringify(resumo, null, 2))
  console.log('\n✅ Export concluído. Arquivos em ./dump/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
