import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/client.js'
import { roles, rolePermission, permissions, userRole } from '../db/schema/index.js'
import { camelToSnake } from '../lib/case.js'

const createSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  nivel: z.number().int().min(1).max(100),
  permissions: z.array(z.number().int().positive()).optional(),
})

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  nivel: z.number().int().min(1).max(100).optional(),
  ativo: z.boolean().optional(),
  permissions: z.array(z.number().int().positive()).optional(),
})

export const rolesRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/roles — lista todas com permissões aninhadas
  app.get('/', { onRequest: [app.requirePermission('users.manage')] }, async () => {
    const allRoles = await db.select().from(roles).orderBy(desc(roles.nivel))

    const permRows = await db
      .select({
        roleId: rolePermission.roleId,
        id: permissions.id,
        nome: permissions.nome,
        slug: permissions.slug,
        descricao: permissions.descricao,
      })
      .from(rolePermission)
      .innerJoin(permissions, eq(permissions.id, rolePermission.permissionId))

    const permsByRole = permRows.reduce<Record<number, typeof permRows>>((acc, p) => {
      acc[p.roleId] = acc[p.roleId] || []
      acc[p.roleId].push(p)
      return acc
    }, {})

    return camelToSnake(
      allRoles.map((r) => ({
        ...r,
        permissions: (permsByRole[r.id] || []).map(({ id, nome, slug, descricao }) => ({
          id,
          nome,
          slug,
          descricao,
        })),
      })),
    )
  })

  // POST /api/roles — criar
  app.post('/', { onRequest: [app.requirePermission('users.manage')] }, async (req, reply) => {
    const body = createSchema.parse(req.body)
    const [created] = await db
      .insert(roles)
      .values({
        nome: body.nome,
        descricao: body.descricao,
        nivel: body.nivel,
        ativo: true,
      })
      .returning({ id: roles.id })

    if (body.permissions && body.permissions.length > 0) {
      await db
        .insert(rolePermission)
        .values(body.permissions.map((pid) => ({ roleId: created.id, permissionId: pid })))
    }
    return reply.code(201).send({ id: created.id })
  })

  // PATCH /api/roles/:id — atualizar
  app.patch<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [app.requirePermission('users.manage')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })
      const body = updateSchema.parse(req.body)

      const updateData: Record<string, unknown> = {}
      if (body.nome !== undefined) updateData.nome = body.nome
      if (body.descricao !== undefined) updateData.descricao = body.descricao
      if (body.nivel !== undefined) updateData.nivel = body.nivel
      if (body.ativo !== undefined) updateData.ativo = body.ativo

      if (Object.keys(updateData).length > 0) {
        await db.update(roles).set(updateData).where(eq(roles.id, id))
      }

      if (body.permissions !== undefined) {
        await db.delete(rolePermission).where(eq(rolePermission.roleId, id))
        if (body.permissions.length > 0) {
          await db
            .insert(rolePermission)
            .values(body.permissions.map((pid) => ({ roleId: id, permissionId: pid })))
        }
      }
      return { ok: true }
    },
  )

  // DELETE /api/roles/:id
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [app.requirePermission('users.manage')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })

      // Remove vínculos e depois a role
      await db.delete(rolePermission).where(eq(rolePermission.roleId, id))
      await db.delete(userRole).where(eq(userRole.roleId, id))
      const deleted = await db.delete(roles).where(eq(roles.id, id)).returning({ id: roles.id })
      if (deleted.length === 0) return reply.code(404).send({ error: 'NotFound' })
      return { ok: true }
    },
  )
}
