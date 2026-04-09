import { api } from '../http'
import type { DenunciaStatus } from '@/types/database'

export interface RelatorioFilters {
  dataInicio?: string
  dataFim?: string
  status?: DenunciaStatus
  categoriaId?: number
  prioridade?: string
  incluirAnexos?: boolean
  incluirHistorico?: boolean
  incluirRespostas?: boolean
}

export interface DenunciaCompleta {
  id: number
  protocolo: string
  descricao: string
  status: DenunciaStatus
  prioridade: string
  data_criacao: string
  data_atualizacao: string
  data_conclusao: string | null
  data_ocorrencia: string | null
  local_ocorrencia: string | null
  pessoas_envolvidas: string | null
  conclusao_descricao: string | null
  categorias: string[]
  anexos: Array<{
    id: number
    nome_arquivo: string
    url: string
    tipo: string
  }>
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

/**
 * Busca denúncias completas para relatórios (admin).
 */
export async function buscarDenunciasParaRelatorio(
  filtros: RelatorioFilters,
): Promise<DenunciaCompleta[]> {
  return api.get<DenunciaCompleta[]>('/relatorios/denuncias', {
    params: {
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      status: filtros.status,
      categoriaId: filtros.categoriaId,
      prioridade: filtros.prioridade,
      incluirAnexos: filtros.incluirAnexos,
      incluirHistorico: filtros.incluirHistorico,
      incluirRespostas: filtros.incluirRespostas,
    },
  })
}

/**
 * Busca uma denúncia completa por protocolo (admin).
 */
export async function buscarDenunciaCompletaPorProtocolo(
  protocolo: string,
): Promise<DenunciaCompleta | null> {
  try {
    return await api.get<DenunciaCompleta>(
      `/relatorios/denuncias/${encodeURIComponent(protocolo)}`,
    )
  } catch (err: unknown) {
    if ((err as { status?: number })?.status === 404) return null
    throw err
  }
}
