import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { config } from '../config.js'
import * as schema from './schema/index.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do Postgres', err)
})

export const db = drizzle(pool, { schema })
export type DB = typeof db
