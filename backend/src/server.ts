import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import { Redis } from 'ioredis'

import { config } from './config.js'
import { pool } from './db/client.js'
import { errorHandler } from './middleware/errorHandler.js'
import { registerAuthDecorators } from './middleware/auth.js'

import { authRoutes } from './routes/auth.js'
import { denunciasRoutes } from './routes/denuncias.js'
import { categoriasRoutes } from './routes/categorias.js'
import { usersRoutes } from './routes/users.js'
import { statsRoutes } from './routes/stats.js'
import { uploadsRoutes } from './routes/uploads.js'
import { rolesRoutes } from './routes/roles.js'
import { permissionsRoutes } from './routes/permissions.js'
import { notificationsRoutes } from './routes/notifications.js'
import { relatoriosRoutes } from './routes/relatorios.js'

async function build() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
    trustProxy: true,
    bodyLimit: 15 * 1024 * 1024, // 15MB
  })

  // Redis para rate limiting
  const redis = new Redis(config.REDIS_URL, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  })
  redis.on('error', (err) => app.log.error({ err }, 'Erro no Redis'))

  // Security & infra plugins
  await app.register(helmet, { global: true, contentSecurityPolicy: false })
  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  })
  await app.register(sensible)
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_EXPIRES_IN },
  })
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  })
  await app.register(rateLimit, {
    global: false,
    redis,
    keyGenerator: (req) => req.ip,
  })

  // Decorators de autenticação/autorização
  registerAuthDecorators(app)

  // Error handler global
  app.setErrorHandler(errorHandler)

  // Healthcheck
  app.get('/health', async () => {
    try {
      await pool.query('SELECT 1')
      const redisOk = redis.status === 'ready'
      return { status: 'ok', db: 'ok', redis: redisOk ? 'ok' : 'degraded' }
    } catch (err) {
      app.log.error({ err }, 'Healthcheck falhou')
      return { status: 'error' }
    }
  })

  // Rotas da API (todas sob /api)
  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: '/auth' })
      await api.register(denunciasRoutes, { prefix: '/denuncias' })
      await api.register(categoriasRoutes, { prefix: '/categorias' })
      await api.register(usersRoutes, { prefix: '/users' })
      await api.register(rolesRoutes, { prefix: '/roles' })
      await api.register(permissionsRoutes, { prefix: '/permissions' })
      await api.register(notificationsRoutes, { prefix: '/notifications' })
      await api.register(statsRoutes, { prefix: '/stats' })
      await api.register(relatoriosRoutes, { prefix: '/relatorios' })
      await api.register(uploadsRoutes, { prefix: '/uploads' })
    },
    { prefix: '/api' },
  )

  // Graceful shutdown
  const close = async () => {
    app.log.info('Encerrando servidor...')
    await app.close()
    await pool.end()
    redis.disconnect()
    process.exit(0)
  }
  process.on('SIGTERM', close)
  process.on('SIGINT', close)

  return app
}

async function start() {
  try {
    const app = await build()
    await app.listen({ host: config.HOST, port: config.PORT })
  } catch (err) {
    console.error('Falha ao iniciar o servidor:', err)
    process.exit(1)
  }
}

start()
