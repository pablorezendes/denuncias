import type { FastifyPluginAsync } from 'fastify'
import { asc } from 'drizzle-orm'
import { db } from '../db/client.js'
import { permissions } from '../db/schema/index.js'
import { camelToSnake } from '../lib/case.js'

export const permissionsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/permissions — lista todas (somente leitura, seed fornece)
  app.get('/', { onRequest: [app.requirePermission('users.manage')] }, async () => {
    const data = await db.select().from(permissions).orderBy(asc(permissions.nome))
    return camelToSnake(data)
  })
}
