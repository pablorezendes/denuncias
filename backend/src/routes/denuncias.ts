import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { and, desc, eq, gte, lte, sql, inArray } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  denuncias,
  denunciaCategoria,
  categorias,
  historicoStatus,
  anexos,
  users,
} from '../db/schema/index.js'
import { gerarProtocolo } from '../services/protocolo.js'
import { getSignedUrl, removeObject } from '../services/storage.js'
import { config } from '../config.js'

const createSchema = z.object({
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  categorias: z.array(z.number().int().positive()).min(1, 'Selecione ao menos uma categoria'),
  data_ocorrencia: z.string().optional(),
  local_ocorrencia: z.string().max(500).optional(),
  pessoas_envolvidas: z.string().max(1000).optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['Pendente', 'Em Análise', 'Em Investigação', 'Concluída', 'Arquivada']),
  observacao: z.string().optional(),
})

const listQuerySchema = z.object({
  status: z.enum(['Pendente', 'Em Análise', 'Em Investigação', 'Concluída', 'Arquivada']).optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const denunciasRoutes: FastifyPluginAsync = async (app) => {
  // ---------------- POST /api/denuncias (público) ----------------
  app.post(
    '/',
    {
      config: {
        rateLimit: {
          max: config.RATE_LIMIT_DENUNCIA_MAX,
          timeWindow: `${config.RATE_LIMIT_DENUNCIA_WINDOW_MIN} minutes`,
        },
      },
    },
    async (req, reply) => {
      const body = createSchema.parse(req.body)
      const ip = req.ip
      const userAgent = req.headers['user-agent'] || null

      const protocolo = gerarProtocolo()

      const [nova] = await db
        .insert(denuncias)
        .values({
          protocolo,
          descricao: body.descricao,
          status: 'Pendente',
          prioridade: 'Média',
          ipDenunciante: ip,
          userAgent,
          dataOcorrencia: body.data_ocorrencia || null,
          localOcorrencia: body.local_ocorrencia || null,
          pessoasEnvolvidas: body.pessoas_envolvidas || null,
        })
        .returning()

      if (body.categorias.length > 0) {
        await db.insert(denunciaCategoria).values(
          body.categorias.map((categoriaId) => ({
            denunciaId: nova.id,
            categoriaId,
          })),
        )
      }

      // Registrar criação no histórico
      await db.insert(historicoStatus).values({
        denunciaId: nova.id,
        statusAnterior: null,
        statusNovo: 'Pendente',
        observacao: 'Denúncia registrada',
      })

      return reply.code(201).send({ protocolo, id: nova.id })
    },
  )

  // ---------------- GET /api/denuncias/:protocolo (público) ----------------
  app.get<{ Params: { protocolo: string } }>('/:protocolo', async (req, reply) => {
    const protocolo = req.params.protocolo.toUpperCase()

    const denuncia = await db.query.denuncias.findFirst({
      where: eq(denuncias.protocolo, protocolo),
    })

    if (!denuncia) {
      return reply.code(404).send({ error: 'NotFound', message: 'Denúncia não encontrada' })
    }

    const cats = await db
      .select({ nome: categorias.nome })
      .from(denunciaCategoria)
      .innerJoin(categorias, eq(categorias.id, denunciaCategoria.categoriaId))
      .where(eq(denunciaCategoria.denunciaId, denuncia.id))

    // Buscar histórico (visão pública - sem nome do admin)
    const historico = await db
      .select()
      .from(historicoStatus)
      .where(eq(historicoStatus.denunciaId, denuncia.id))
      .orderBy(historicoStatus.dataAlteracao)

    return {
      denuncia: {
        ...denuncia,
        ipDenunciante: undefined, // esconde IP na consulta pública
        userAgent: undefined,
        categorias: cats.map((c) => c.nome),
      },
      historico,
    }
  })

  // ---------------- GET /api/denuncias (admin - lista) ----------------
  app.get(
    '/',
    { onRequest: [app.requirePermission('denuncias.view')] },
    async (req) => {
      const q = listQuerySchema.parse(req.query)
      const filters = []

      if (q.status) filters.push(eq(denuncias.status, q.status))
      if (q.dataInicio) filters.push(gte(denuncias.dataCriacao, new Date(q.dataInicio)))
      if (q.dataFim) filters.push(lte(denuncias.dataCriacao, new Date(q.dataFim)))

      const where = filters.length > 0 ? and(...filters) : undefined
      const offset = (q.page - 1) * q.limit

      const [data, countRows] = await Promise.all([
        db
          .select({
            denuncia: denuncias,
            adminNome: users.nome,
          })
          .from(denuncias)
          .leftJoin(users, eq(users.id, denuncias.adminResponsavelId))
          .where(where)
          .orderBy(desc(denuncias.dataCriacao))
          .limit(q.limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(denuncias).where(where),
      ])

      const total = countRows[0]?.count ?? 0

      // Buscar categorias de todas as denúncias de uma vez
      const ids = data.map((d) => d.denuncia.id)
      const cats = ids.length
        ? await db
            .select({
              denunciaId: denunciaCategoria.denunciaId,
              nome: categorias.nome,
            })
            .from(denunciaCategoria)
            .innerJoin(categorias, eq(categorias.id, denunciaCategoria.categoriaId))
            .where(inArray(denunciaCategoria.denunciaId, ids))
        : []

      const catsByDenuncia = cats.reduce<Record<number, string[]>>((acc, c) => {
        acc[c.denunciaId] = acc[c.denunciaId] || []
        acc[c.denunciaId].push(c.nome)
        return acc
      }, {})

      return {
        data: data.map((d) => ({
          ...d.denuncia,
          responsavel: d.adminNome,
          categorias: catsByDenuncia[d.denuncia.id] || [],
        })),
        total,
        page: q.page,
        totalPages: Math.ceil(total / q.limit),
      }
    },
  )

  // ---------------- PATCH /api/denuncias/:id/status (admin) ----------------
  app.patch<{ Params: { id: string } }>(
    '/:id/status',
    { onRequest: [app.requirePermission('denuncias.edit')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })

      const body = updateStatusSchema.parse(req.body)

      const atual = await db.query.denuncias.findFirst({ where: eq(denuncias.id, id) })
      if (!atual) return reply.code(404).send({ error: 'NotFound' })

      await db.transaction(async (tx) => {
        await tx
          .update(denuncias)
          .set({
            status: body.status,
            dataAtualizacao: new Date(),
            dataConclusao: body.status === 'Concluída' ? new Date() : atual.dataConclusao,
            adminResponsavelId: req.user.id,
          })
          .where(eq(denuncias.id, id))

        await tx.insert(historicoStatus).values({
          denunciaId: id,
          statusAnterior: atual.status,
          statusNovo: body.status,
          adminId: req.user.id,
          observacao: body.observacao || null,
        })
      })

      return { ok: true }
    },
  )

  // ---------------- DELETE /api/denuncias/:id (admin) ----------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [app.requirePermission('denuncias.delete')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })

      // Remover arquivos do MinIO antes de deletar (FKs com CASCADE cuidam do resto)
      const arquivos = await db.select().from(anexos).where(eq(anexos.denunciaId, id))
      await Promise.allSettled(arquivos.map((a) => removeObject(a.storagePath)))

      const deleted = await db.delete(denuncias).where(eq(denuncias.id, id)).returning({ id: denuncias.id })
      if (deleted.length === 0) return reply.code(404).send({ error: 'NotFound' })

      return { ok: true }
    },
  )

  // ---------------- GET /api/denuncias/:id/historico (admin) ----------------
  app.get<{ Params: { id: string } }>(
    '/:id/historico',
    { onRequest: [app.requirePermission('denuncias.view')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })

      const rows = await db
        .select({
          id: historicoStatus.id,
          denunciaId: historicoStatus.denunciaId,
          statusAnterior: historicoStatus.statusAnterior,
          statusNovo: historicoStatus.statusNovo,
          adminId: historicoStatus.adminId,
          observacao: historicoStatus.observacao,
          dataAlteracao: historicoStatus.dataAlteracao,
          adminNome: users.nome,
        })
        .from(historicoStatus)
        .leftJoin(users, eq(users.id, historicoStatus.adminId))
        .where(eq(historicoStatus.denunciaId, id))
        .orderBy(historicoStatus.dataAlteracao)

      return rows.map((h) => ({
        id: h.id,
        denuncia_id: h.denunciaId,
        status_anterior: h.statusAnterior,
        status_novo: h.statusNovo,
        admin_id: h.adminId,
        observacao: h.observacao,
        data_alteracao: h.dataAlteracao,
        admin_nome: h.adminNome,
      }))
    },
  )

  // ---------------- GET /api/denuncias/:id/anexos (admin) ----------------
  // Retorna URLs assinadas temporárias para visualização
  app.get<{ Params: { id: string } }>(
    '/:id/anexos',
    { onRequest: [app.requirePermission('denuncias.view')] },
    async (req, reply) => {
      const id = Number(req.params.id)
      if (!Number.isFinite(id)) return reply.code(400).send({ error: 'ID inválido' })

      const arquivos = await db.select().from(anexos).where(eq(anexos.denunciaId, id))
      const withUrls = await Promise.all(
        arquivos.map(async (a) => ({
          ...a,
          url: await getSignedUrl(a.storagePath, 300),
        })),
      )
      return { anexos: withUrls }
    },
  )
}
