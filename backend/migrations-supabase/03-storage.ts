/**
 * Passo 3 — Migra arquivos do Supabase Storage para MinIO.
 *
 * - Lista recursivamente o bucket 'anexos-denuncias' no Supabase
 * - Baixa cada arquivo
 * - Envia para MinIO mantendo o mesmo caminho relativo
 * - Atualiza a tabela `anexos` com storage_path correto
 *
 * Variáveis necessárias:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL
 *   MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET
 */
import { createClient } from '@supabase/supabase-js'
import { Client as MinioClient } from 'minio'
import pg from 'pg'

const { Pool } = pg

const env = (k: string, required = true) => {
  const v = process.env[k]
  if (!v && required) {
    console.error(`❌ Variável ${k} não definida`)
    process.exit(1)
  }
  return v as string
}

const SUPABASE_URL = env('SUPABASE_URL')
const SUPABASE_KEY = env('SUPABASE_SERVICE_ROLE_KEY')
const DATABASE_URL = env('DATABASE_URL')
const MINIO_ENDPOINT = env('MINIO_ENDPOINT', false) || 'localhost'
const MINIO_PORT = Number(env('MINIO_PORT', false) || 9000)
const MINIO_ACCESS_KEY = env('MINIO_ACCESS_KEY')
const MINIO_SECRET_KEY = env('MINIO_SECRET_KEY')
const MINIO_BUCKET = env('MINIO_BUCKET', false) || 'anexos-denuncias'
const SUPABASE_BUCKET = 'anexos-denuncias'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const minio = new MinioClient({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
})

const pool = new Pool({ connectionString: DATABASE_URL })

async function ensureBucket() {
  const exists = await minio.bucketExists(MINIO_BUCKET).catch(() => false)
  if (!exists) {
    await minio.makeBucket(MINIO_BUCKET)
    console.log(`✓ Bucket MinIO '${MINIO_BUCKET}' criado`)
  }
}

async function listRecursively(prefix = ''): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

  if (error) {
    console.error(`Erro ao listar '${prefix}':`, error.message)
    return []
  }
  if (!data) return []

  const files: string[] = []
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name
    if (item.id === null) {
      // É um "diretório" no Supabase Storage (prefixo)
      const nested = await listRecursively(fullPath)
      files.push(...nested)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

async function migrateFile(path: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(path)
    if (error || !data) {
      console.error(`  ✗ download falhou: ${path} - ${error?.message}`)
      return false
    }
    const buffer = Buffer.from(await data.arrayBuffer())
    const contentType = data.type || 'application/octet-stream'

    await minio.putObject(MINIO_BUCKET, path, buffer, buffer.length, {
      'Content-Type': contentType,
    })
    return true
  } catch (err) {
    console.error(`  ✗ erro em ${path}:`, err)
    return false
  }
}

async function main() {
  console.log('🗂  Migrando arquivos do Supabase Storage para MinIO...\n')
  await ensureBucket()

  console.log('📋 Listando arquivos...')
  const files = await listRecursively()
  console.log(`   ${files.length} arquivos encontrados\n`)

  let ok = 0
  let fail = 0
  for (const [i, file] of files.entries()) {
    const success = await migrateFile(file)
    if (success) {
      ok++
      console.log(`✓ [${i + 1}/${files.length}] ${file}`)
    } else {
      fail++
    }
  }

  console.log(`\n📊 Resultado: ${ok} sucesso | ${fail} falhas`)

  // Atualiza tabela anexos com storage_path (se coluna estiver vazia)
  console.log('\n🔧 Atualizando tabela anexos.storage_path...')
  const res = await pool.query(`
    UPDATE anexos
       SET storage_path = denuncia_id || '/' || nome_arquivo
     WHERE storage_path IS NULL OR storage_path = ''
  `)
  console.log(`   ${res.rowCount} registros atualizados`)

  await pool.end()
  console.log('\n✅ Migração de arquivos concluída')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
