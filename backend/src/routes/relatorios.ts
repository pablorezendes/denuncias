import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import {
  denuncias,
  denunciaCategoria,
  categorias,
  anexos,
  historicoStatus,
  respostas,
  users,
} from '../db/schema/index.js'
import { getSignedUrl } from '../services/storage.js'

const STATUS = ['Pendente', 'Em Análise', 'Em Investigação', 'Concluída', 'Arquivada'] as const
const PRIO = ['Baixa', 'Média', 'Alta', 'Urgente'] as const

const filterSchema = z.object({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  status: z.enum(STATUS).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  prioridade: z.enum(PRIO).optional(),
  incluirAnexos: z.coerce.boolean().optional().default(true),
  incluirHistorico: z.coerce.boolean().optional().default(true),
  incluirRespostas: z.coerce.boolean().optional().default(true),
})

type DenunciaCompleta = {
  id: number
  protocolo: string
  descricao: string
  status: string
  prioridade: string
  data_criacao: string
  data_atualizacao: string
  data_conclusao: string | null
  data_ocorrencia: string | null
  local_ocorrencia: string | null
  pessoas_envolvidas: string | null
  conclusao_descricao: string | null
  categorias: string[]
  anexos: Array<{ id: number; nome_arquivo: string; url: string; tipo: string }>
  historico: Array<{
    id: number
    status_anterior: string | null
    status_novo: string
    data_alteracao: string
    observacao: string | null
    admin_nome: string | null
  }>
  respostas: Array<{
    id: number
    resposta: string
    data_resposta: string
    admin_nome: string | null
  }>
  responsavel: string | null
}

async function montarDenunciaCompleta(
  denunciaRow: typeof denuncias.$inferSelect,
  adminResponsavelNome: string | null,
  opts: {
    incluirAnexos: boolean
    incluirHistorico: boolean
    incluirRespostas: boolean
  },
): Promise<DenunciaCompleta> {
  const cats = await db
    .select({ nome: categorias.nome })
    .from(denunciaCategoria)
    .innerJoin(categorias, eq(categorias.id, denunciaCategoria.categoriaId))
    .where(eq(denunciaCategoria.denunciaId, denunciaRow.id))

  let anexosList: DenunciaCompleta['anexos'] = []
  if (opts.incluirAnexos) {
    const rows = await db.select().from(anexos).where(eq(anexos.denunciaId, denunciaRow.id))
    anexosList = await Promise.all(
      rows.map(async (a) => ({
        id: a.id,
        nome_arquivo: a.nomeArquivo,
        url: await getSignedUrl(a.storagePath, 600),
        tipo: a.tipoArquivo || 'application/octet-stream',
      })),
    )
  }

  let historicoList: DenunciaCompleta['historico'] = []
  if (opts.incluirHistorico) {
    const rows = await db
      .select({
        id: historicoStatus.id,
        status_anterior: historicoStatus.statusAnterior,
        status_novo: historicoStatus.statusNovo,
        data_alteracao: historicoStatus.dataAlteracao,
        observacao: historicoStatus.observacao,
        admin_nome: users.nome,
      })
      .from(historicoStatus)
      .leftJoin(users, eq(users.id, historicoStatus.adminId))
      .where(eq(historicoStatus.denunciaId, denunciaRow.id))
      .orderBy(asc(historicoStatus.dataAlteracao))
    historicoList = rows.map((h) => ({
      id: h.id,
      status_anterior: h.status_anterior,
      status_novo: h.status_novo,
      data_alteracao: h.data_alteracao?.toISOString() ?? '',
      observacao: h.observacao,
      admin_nome: h.admin_nome,
    }))
  }

  let respostasList: DenunciaCompleta['respostas'] = []
  if (opts.incluirRespostas) {
    const rows = await db
      .select({
        id: respostas.id,
        resposta: respostas.resposta,
        data_resposta: respostas.dataCriacao,
        admin_nome: users.nome,
      })
      .from(respostas)
      .leftJoin(users, eq(users.id, respostas.adminId))
      .where(eq(respostas.denunciaId, denunciaRow.id))
      .orderBy(asc(respostas.dataCriacao))
    respostasList = rows.map((r) => ({
      id: r.id,
      resposta: r.resposta,
      data_resposta: r.data_resposta?.toISOString() ?? '',
      admin_nome: r.admin_nome,
    }))
  }

  return {
    id: denunciaRow.id,
    protocolo: denunciaRow.protocolo,
    descricao: denunciaRow.descricao,
    status: denunciaRow.status,
    prioridade: denunciaRow.prioridade,
    data_criacao: denunciaRow.dataCriacao?.toISOString() ?? '',
    data_atualizacao: denunciaRow.dataAtualizacao?.toISOString() ?? '',
    data_conclusao: denunciaRow.dataConclusao?.toISOString() ?? null,
    data_ocorrencia: denunciaRow.dataOcorrencia || null,
    local_ocorrencia: denunciaRow.localOcorrencia,
    pessoas_envolvidas: denunciaRow.pessoasEnvolvidas,
    conclusao_descricao: denunciaRow.conclusaoDescricao,
    categorias: cats.map((c) => c.nome),
    anexos: anexosList,
    historico: historicoList,
    respostas: respostasList,
    responsavel: adminResponsavelNome,
  }
}

export const relatoriosRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/relatorios/denuncias
  app.get(
    '/denuncias',
    { onRequest: [app.requirePermission('reports.view')] },
    async (req) => {
      const q = filterSchema.parse(req.query)

      const filters = []
      if (q.status) filters.push(eq(denuncias.status, q.status))
      if (q.prioridade) filters.push(eq(denuncias.prioridade, q.prioridade))
      if (q.dataInicio) filters.push(gte(denuncias.dataCriacao, new Date(q.dataInicio)))
      if (q.dataFim) filters.push(lte(denuncias.dataCriacao, new Date(q.dataFim)))

      const where = filters.length > 0 ? and(...filters) : undefined

      const rows = await db
        .select({
          denuncia: denuncias,
          adminNome: users.nome,
        })
        .from(denuncias)
        .leftJoin(users, eq(users.id, denuncias.adminResponsavelId))
        .where(where)
        .orderBy(desc(denuncias.dataCriacao))

      const results: DenunciaCompleta[] = []
      for (const r of rows) {
        results.push(
          await montarDenunciaCompleta(r.denuncia, r.adminNome, {
            incluirAnexos: q.incluirAnexos,
            incluirHistorico: q.incluirHistorico,
            incluirRespostas: q.incluirRespostas,
          }),
        )
      }
      return results
    },
  )

  // GET /api/relatorios/denuncias/:protocolo
  app.get<{ Params: { protocolo: string } }>(
    '/denuncias/:protocolo',
    { onRequest: [app.requirePermission('reports.view')] },
    async (req, reply) => {
      const rows = await db
        .select({
          denuncia: denuncias,
          adminNome: users.nome,
        })
        .from(denuncias)
        .leftJoin(users, eq(users.id, denuncias.adminResponsavelId))
        .where(eq(denuncias.protocolo, req.params.protocolo.toUpperCase()))
        .limit(1)

      if (rows.length === 0) return reply.code(404).send({ error: 'NotFound' })

      return montarDenunciaCompleta(rows[0].denuncia, rows[0].adminNome, {
        incluirAnexos: true,
        incluirHistorico: true,
        incluirRespostas: true,
      })
    },
  )
}

// silence unused
void sql
