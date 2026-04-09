import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client.js'
import { users, userRole, roles } from '../db/schema/index.js'
import { hashPassword } from '../services/hash.js'
import { camelToSnake } from '../lib/case.js'

const createSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  usuario: z.string().min(3).max(50),
  senha: z.string().min(8),
  roles: z.array(z.number().int().positive()).min(1),
  ativo: z.boolean().default(true),
})

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(8).optional(),
  roles: z.array(z.number().int().positive()).optional(),
})

export const usersRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/users - listar (com roles)
  app.get('/', { onRequest: [app.requirePermission('users.manage')] }, async () => {
    const all = await db
      .select({
        id: users.id,
        nome: users.nome,
        email: users.email,
        usuario: users.usuario,
        ativo: users.ativo,
        ultimoAcesso: users.ultimoAcesso,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    // Anexa roles de todos os usuários de uma vez
    const rolesRows = await db
      .select({
        userId: userRole.userId,
        id: roles.id,
        nome: roles.nome,
        descricao: roles.descricao,
      })
      .from(userRole)
      .innerJoin(roles, eq(roles.id, userRole.roleId))

    const rolesByUser = rolesRows.reduce<Record<number, Array<{ id: number; nome: string; descricao: string | null }>>>(
      (acc, r) => {
        acc[r.userId] = acc[r.userId] || []
        acc[r.userId].push({ id: r.id, nome: r.nome, descricao: r.descricao })
        return acc
      },
      {},
    )

    return camelToSnake(all.map((u) => ({ ...u, roles: rolesByUser[u.id] || [] })))
  })

  // GET /api/users/:id - detalhes
  app.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [app.requirePermission('users.manage')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })

      const user = await db.query.users.findFirst({ where: eq(users.id, id) })
      if (!user) return reply.code(404).send({ error: 'NotFound' })

      const userRoles = await db
        .select({ id: roles.id, nome: roles.nome, descricao: roles.descricao })
        .from(userRole)
        .innerJoin(roles, eq(roles.id, userRole.roleId))
        .where(eq(userRole.userId, id))

      const { senhaHash: _senhaHash, ...safeUser } = user
      return camelToSnake({ ...safeUser, roles: userRoles })
    },
  )

  // POST /api/users - criar
  app.post('/', { onRequest: [app.requirePermission('users.manage')] }, async (req, reply) => {
    const body = createSchema.parse(req.body)
    const senhaHash = await hashPassword(body.senha)

    const [created] = await db
      .insert(users)
      .values({
        nome: body.nome,
        email: body.email,
        usuario: body.usuario,
        senhaHash,
        ativo: body.ativo,
        forcePasswordChange: true,
      })
      .returning({ id: users.id })

    if (body.roles.length > 0) {
      await db.insert(userRole).values(body.roles.map((roleId) => ({ userId: created.id, roleId })))
    }

    return reply.code(201).send({ id: created.id })
  })

  // PATCH /api/users/:id - editar
  app.patch<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [app.requirePermission('users.manage')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })

      const body = updateSchema.parse(req.body)
      const updateData: Record<string, unknown> = {}
      if (body.nome !== undefined) updateData.nome = body.nome
      if (body.email !== undefined) updateData.email = body.email
      if (body.ativo !== undefined) updateData.ativo = body.ativo
      if (body.senha !== undefined) {
        updateData.senhaHash = await hashPassword(body.senha)
        updateData.forcePasswordChange = false
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, id))
      }

      if (body.roles) {
        await db.delete(userRole).where(eq(userRole.userId, id))
        if (body.roles.length > 0) {
          await db.insert(userRole).values(body.roles.map((roleId) => ({ userId: id, roleId })))
        }
      }

      return { ok: true }
    },
  )

  // DELETE /api/users/:id
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [app.requirePermission('users.manage')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })
      if (id === req.user.id) {
        return reply.code(400).send({ error: 'Não é possível remover o próprio usuário' })
      }
      const deleted = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
      if (deleted.length === 0) return reply.code(404).send({ error: 'NotFound' })
      return { ok: true }
    },
  )
}
