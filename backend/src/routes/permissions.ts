import type { FastifyPluginAsync } from 'fastify'
import { asc } from 'drizzle-orm'
import { db } from '../db/client.js'
import { permissions } from '../db/schema/index.js'

export const permissionsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/permissions — lista todas (somente leitura, seed fornece)
  app.get('/', { onRequest: [app.requirePermission('users.manage')] }, async () => {
    return db.select().from(permissions).orderBy(asc(permissions.nome))
  })
}
