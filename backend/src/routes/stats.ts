import type { FastifyPluginAsync } from 'fastify'
import { sql, eq, gte } from 'drizzle-orm'
import { db } from '../db/client.js'
import { denuncias, categorias, denunciaCategoria } from '../db/schema/index.js'

export const statsRoutes: FastifyPluginAsync = async (app) => {
  // Dashboard: contadores + gráficos
  app.get('/dashboard', { onRequest: [app.requirePermission('reports.view')] }, async () => {
    const total = await db.select({ count: sql<number>`count(*)::int` }).from(denuncias)

    const porStatus = await db
      .select({
        status: denuncias.status,
        count: sql<number>`count(*)::int`,
      })
      .from(denuncias)
      .groupBy(denuncias.status)

    // Últimos 12 meses
    const since = new Date()
    since.setMonth(since.getMonth() - 12)
    const porMes = await db
      .select({
        mes: sql<string>`to_char(${denuncias.dataCriacao}, 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(denuncias)
      .where(gte(denuncias.dataCriacao, since))
      .groupBy(sql`to_char(${denuncias.dataCriacao}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${denuncias.dataCriacao}, 'YYYY-MM')`)

    const porCategoria = await db
      .select({
        categoria: categorias.nome,
        count: sql<number>`count(*)::int`,
      })
      .from(denunciaCategoria)
      .innerJoin(categorias, eq(categorias.id, denunciaCategoria.categoriaId))
      .groupBy(categorias.nome)
      .orderBy(sql`count(*) desc`)

    return {
      total: total[0]?.count ?? 0,
      porStatus,
      porMes,
      porCategoria,
    }
  })
}
