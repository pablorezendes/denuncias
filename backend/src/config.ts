import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL obrigatório'),

  REDIS_URL: z.string().min(1, 'REDIS_URL obrigatório'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('2h'),

  MINIO_ENDPOINT: z.string().default('minio'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.coerce.boolean().default(false),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().default('anexos-denuncias'),

  CORS_ORIGIN: z.string().default('http://localhost'),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@hsfasaude.com.br'),
  EMAIL_FROM_NAME: z.string().default('Canal de Denuncias HSFA'),

  RATE_LIMIT_LOGIN_MAX: z.coerce.number().default(5),
  RATE_LIMIT_LOGIN_WINDOW_MIN: z.coerce.number().default(15),
  RATE_LIMIT_DENUNCIA_MAX: z.coerce.number().default(3),
  RATE_LIMIT_DENUNCIA_WINDOW_MIN: z.coerce.number().default(60),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
export type Config = typeof config
