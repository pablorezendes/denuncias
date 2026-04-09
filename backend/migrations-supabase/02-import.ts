/**
 * Passo 2 — Importa JSONs exportados para o PostgreSQL local.
 *
 * - Respeita ordem de dependências (FKs)
 * - Usa ON CONFLICT DO NOTHING (idempotente)
 * - Ajusta sequências SERIAL após inserção
 *
 * Variáveis necessárias:
 *   DATABASE_URL
 *
 * Uso: tsx migrations-supabase/02-import.ts
 */
import pg from 'pg'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const { Pool } = pg

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida')
  process.exit(1)
}

const DUMP_DIR = path.resolve('./dump')

// Ordem respeita dependências de chave estrangeira
const IMPORT_ORDER: Array<{ table: string; conflict?: string[] }> = [
  { table: 'roles', conflict: ['nome'] },
  { table: 'permissions', conflict: ['slug'] },
  { table: 'categorias', conflict: ['nome'] },
  { table: 'users', conflict: ['usuario'] },
  { table: 'user_role', conflict: ['user_id', 'role_id'] },
  { table: 'role_permission', conflict: ['role_id', 'permission_id'] },
  { table: 'denuncias', conflict: ['protocolo'] },
  { table: 'denuncia_categoria', conflict: ['denuncia_id', 'categoria_id'] },
  { table: 'anexos' },
  { table: 'historico_status' },
  { table: 'respostas' },
]

const pool = new Pool({ connectionString: DATABASE_URL })

async function tableColumns(table: string): Promise<string[]> {
  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1`,
    [table],
  )
  return res.rows.map((r) => r.column_name as string)
}

async function importTable(table: string, conflict?: string[]) {
  let rows: Record<string, unknown>[]
  try {
    const raw = await readFile(path.join(DUMP_DIR, `${table}.json`), 'utf-8')
    rows = JSON.parse(raw)
  } catch {
    console.log(`⚠ ${table.padEnd(25)} → arquivo não encontrado, pulando`)
    return
  }

  if (!rows || rows.length === 0) {
    console.log(`- ${table.padEnd(25)} → vazio`)
    return
  }

  // Garante apenas colunas que existem no destino
  const destCols = new Set(await tableColumns(table))
  const srcCols = Object.keys(rows[0]).filter((c) => destCols.has(c))

  if (srcCols.length === 0) {
    console.log(`⚠ ${table.padEnd(25)} → nenhuma coluna compatível`)
    return
  }

  // Insert em lotes de 500
  const BATCH = 500
  let total = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)

    const placeholders = chunk
      .map((_, idx) => {
        const base = idx * srcCols.length
        return `(${srcCols.map((_, j) => `$${base + j + 1}`).join(',')})`
      })
      .join(',')

    const values = chunk.flatMap((row) =>
      srcCols.map((c) => {
        const v = row[c]
        // Supabase retorna datas como ISO string - deixa o PG converter
        return v === undefined ? null : v
      }),
    )

    const conflictClause = conflict
      ? `ON CONFLICT (${conflict.join(',')}) DO NOTHING`
      : 'ON CONFLICT DO NOTHING'

    const sqlText = `INSERT INTO ${table} (${srcCols.map((c) => `"${c}"`).join(',')})
                     VALUES ${placeholders}
                     ${conflictClause}`

    const res = await pool.query(sqlText, values)
    total += res.rowCount || 0
  }

  // Ajusta sequência SERIAL se a tabela tiver coluna id
  if (destCols.has('id')) {
    try {
      await pool.query(`
        SELECT setval(
          pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${table}), 1)
        )
      `)
    } catch {
      /* tabela sem sequência SERIAL em id */
    }
  }

  console.log(`✓ ${table.padEnd(25)} → ${String(total).padStart(6)} inseridos (${rows.length} lidos)`)
}

async function main() {
  console.log('📥 Importando para o PostgreSQL local...\n')
  try {
    for (const { table, conflict } of IMPORT_ORDER) {
      await importTable(table, conflict)
    }
    console.log('\n✅ Import concluído')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
