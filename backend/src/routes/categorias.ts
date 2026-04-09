import type { FastifyPluginAsync } from 'fastify'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { categorias } from '../db/schema/index.js'
import { camelToSnake } from '../lib/case.js'

export const categoriasRoutes: FastifyPluginAsync = async (app) => {
  // Público: listar ativas (usado no formulário de nova denúncia)
  app.get('/', async () => {
    const data = await db
      .select()
      .from(categorias)
      .where(eq(categorias.ativo, true))
      .orderBy(asc(categorias.ordem), asc(categorias.nome))
    return camelToSnake(data)
  })
}
