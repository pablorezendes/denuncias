/**
 * Passo 4 — Valida a migração comparando contagens entre Supabase e Postgres local.
 */
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const { Pool } = pg

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const pool = new Pool({ connectionString: DATABASE_URL })

const TABLES = [
  'roles',
  'permissions',
  'categorias',
  'users',
  'denuncias',
  'denuncia_categoria',
  'anexos',
  'historico_status',
  'respostas',
]

async function countSupabase(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

async function countLocal(table: string): Promise<number> {
  const { rows } = await pool.query(`SELECT COUNT(*)::int as c FROM ${table}`)
  return rows[0]?.c ?? 0
}

async function checkIntegrity() {
  // Denúncias com admin_responsavel_id apontando para usuário inexistente
  const orphans = await pool.query(`
    SELECT d.id, d.protocolo
      FROM denuncias d
      LEFT JOIN users u ON u.id = d.admin_responsavel_id
     WHERE d.admin_responsavel_id IS NOT NULL AND u.id IS NULL
  `)
  if (orphans.rowCount && orphans.rowCount > 0) {
    console.log(`\n⚠ ${orphans.rowCount} denúncias com admin_responsavel_id órfão:`)
    orphans.rows.forEach((r) => console.log(`   - ID ${r.id} / protocolo ${r.protocolo}`))
  }
}

async function main() {
  console.log('🔍 Validando migração...\n')
  console.log('Tabela                    | Supabase | Local    | Status')
  console.log('--------------------------+----------+----------+--------')

  let allOk = true
  for (const table of TABLES) {
    try {
      const [sup, loc] = await Promise.all([countSupabase(table), countLocal(table)])
      const status = sup === loc ? '✓' : '✗'
      if (sup !== loc) allOk = false
      console.log(
        `${table.padEnd(26)}| ${String(sup).padStart(8)} | ${String(loc).padStart(8)} | ${status}`,
      )
    } catch (err) {
      console.log(`${table.padEnd(26)}| ERRO: ${(err as Error).message}`)
      allOk = false
    }
  }

  await checkIntegrity()
  await pool.end()

  console.log('\n' + (allOk ? '✅ Validação passou' : '❌ Há divergências'))
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
