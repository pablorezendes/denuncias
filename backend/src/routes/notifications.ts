import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { notificacoes } from '../db/schema/index.js'
import { camelToSnake } from '../lib/case.js'

const listQuery = z.object({
  userId: z.coerce.number().int().positive(),
  apenasNaoLidas: z.coerce.boolean().optional(),
})

export const notificationsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/notifications
  app.get('/', { onRequest: [app.authenticate] }, async (req) => {
    const q = listQuery.parse(req.query)

    // Só pode ver as próprias notificações
    if (q.userId !== req.user.id) return []

    const filters = [eq(notificacoes.userId, q.userId)]
    if (q.apenasNaoLidas) filters.push(eq(notificacoes.lida, false))

    const data = await db
      .select()
      .from(notificacoes)
      .where(and(...filters))
      .orderBy(desc(notificacoes.dataCriacao))
    return camelToSnake(data)
  })

  // GET /api/notifications/count-nao-lidas
  app.get(
    '/count-nao-lidas',
    { onRequest: [app.authenticate] },
    async (req) => {
      const q = z.object({ userId: z.coerce.number().int().positive() }).parse(req.query)
      if (q.userId !== req.user.id) return { count: 0 }

      const res = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificacoes)
        .where(and(eq(notificacoes.userId, q.userId), eq(notificacoes.lida, false)))
      return { count: res[0]?.count ?? 0 }
    },
  )

  // PATCH /api/notifications/:id/lida
  app.patch<{ Params: { id: string } }>(
    '/:id/lida',
    { onRequest: [app.authenticate] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })

      // Garante que é notificação do próprio usuário
      const result = await db
        .update(notificacoes)
        .set({ lida: true })
        .where(and(eq(notificacoes.id, id), eq(notificacoes.userId, req.user.id)))
        .returning({ id: notificacoes.id })

      if (result.length === 0) return reply.code(404).send({ error: 'NotFound' })
      return { ok: true }
    },
  )

  // PATCH /api/notifications/marcar-todas
  app.patch(
    '/marcar-todas',
    { onRequest: [app.authenticate] },
    async (req) => {
      const body = z.object({ userId: z.number().int().positive() }).parse(req.body)
      if (body.userId !== req.user.id) return { ok: true }

      await db
        .update(notificacoes)
        .set({ lida: true })
        .where(and(eq(notificacoes.userId, body.userId), eq(notificacoes.lida, false)))
      return { ok: true }
    },
  )
}
