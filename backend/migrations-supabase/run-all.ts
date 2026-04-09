/**
 * Orquestrador: executa todas as etapas de migração em sequência.
 * Usado via: npm run migrate:supabase
 */
import { spawn } from 'node:child_process'
import path from 'node:path'

const steps = [
  { name: '1. Exportar do Supabase', file: '01-export.ts' },
  { name: '2. Importar no Postgres local', file: '02-import.ts' },
  { name: '3. Migrar arquivos Storage → MinIO', file: '03-storage.ts' },
  { name: '4. Validar contagens', file: '04-validate.ts' },
]

async function run(file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('tsx', [path.join('migrations-supabase', file)], {
      stdio: 'inherit',
      shell: true,
    })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${file} falhou`))))
  })
}

async function main() {
  for (const step of steps) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`▶ ${step.name}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    await run(step.file)
  }
  console.log('\n🎉 Todas as etapas concluídas com sucesso')
}

main().catch((err) => {
  console.error('\n❌ Migração falhou:', err.message)
  process.exit(1)
})
