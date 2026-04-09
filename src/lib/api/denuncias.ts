import { api } from '../http'
import type {
  Denuncia,
  DenunciaStatus,
  Categoria,
  HistoricoStatus,
} from '@/types/database'
import { uploadAnexosParaProtocolo } from '../storage'

export interface CreateDenunciaData {
  descricao: string
  categorias: number[]
  data_ocorrencia?: string
  local_ocorrencia?: string
  pessoas_envolvidas?: string
  anexos?: File[]
}

/**
 * Cria uma nova denúncia (endpoint público).
 * Se houver anexos, faz upload após a criação da denúncia.
 */
export async function criarDenuncia(data: CreateDenunciaData): Promise<string> {
  const { protocolo } = await api.post<{ protocolo: string; id: number }>(
    '/denuncias',
    {
      descricao: data.descricao,
      categorias: data.categorias,
      data_ocorrencia: data.data_ocorrencia,
      local_ocorrencia: data.local_ocorrencia,
      pessoas_envolvidas: data.pessoas_envolvidas,
    },
    { skipAuth: true },
  )

  if (data.anexos && data.anexos.length > 0) {
    try {
      await uploadAnexosParaProtocolo(protocolo, data.anexos)
    } catch (err) {
      // Anexos falharam mas a denúncia foi criada — loga e segue
      console.error('Erro no upload de anexos:', err)
    }
  }

  return protocolo
}

/**
 * Busca denúncia pelo protocolo (endpoint público).
 */
export async function buscarDenunciaPorProtocolo(
  protocolo: string,
): Promise<Denuncia | null> {
  try {
    const resp = await api.get<{ denuncia: Denuncia; historico: HistoricoStatus[] }>(
      `/denuncias/${encodeURIComponent(protocolo)}`,
      { skipAuth: true },
    )
    return resp.denuncia
  } catch (err: unknown) {
    if ((err as { status?: number })?.status === 404) return null
    throw err
  }
}

/**
 * Busca histórico de status de uma denúncia.
 * O endpoint público /denuncias/:protocolo já retorna histórico junto,
 * mas mantemos esta função para compatibilidade com código existente.
 */
export async function buscarHistoricoStatus(
  denunciaId: number,
): Promise<HistoricoStatus[]> {
  // Tenta via rota admin primeiro (retorna com nome do admin)
  try {
    return await api.get<HistoricoStatus[]>(`/denuncias/${denunciaId}/historico`)
  } catch {
    return []
  }
}

/**
 * Lista denúncias (admin) — com filtros e paginação.
 */
export async function listarDenuncias(filtros?: {
  status?: DenunciaStatus
  dataInicio?: string
  dataFim?: string
  page?: number
  limit?: number
}) {
  return api.get<{
    data: Denuncia[]
    total: number
    page: number
    totalPages: number
  }>('/denuncias', {
    params: {
      status: filtros?.status,
      dataInicio: filtros?.dataInicio,
      dataFim: filtros?.dataFim,
      page: filtros?.page,
      limit: filtros?.limit,
    },
  })
}

/**
 * Atualiza o status de uma denúncia (admin).
 */
export async function atualizarStatusDenuncia(
  denunciaId: number,
  novoStatus: DenunciaStatus,
  observacao?: string,
  _adminId?: number, // adminId é inferido do JWT no backend
): Promise<void> {
  await api.patch(`/denuncias/${denunciaId}/status`, {
    status: novoStatus,
    observacao,
  })
}

/**
 * Lista categorias ativas (público).
 */
export async function listarCategorias(): Promise<Categoria[]> {
  return api.get<Categoria[]>('/categorias', { skipAuth: true })
}

/**
 * Exclui uma denúncia (admin).
 */
export async function excluirDenuncia(denunciaId: number): Promise<void> {
  await api.delete(`/denuncias/${denunciaId}`)
}

/**
 * Exclui múltiplas denúncias (admin).
 */
export async function excluirDenunciasEmMassa(
  denunciaIds: number[],
): Promise<{
  sucesso: number[]
  falhas: Array<{ id: number; erro: string }>
}> {
  const sucesso: number[] = []
  const falhas: Array<{ id: number; erro: string }> = []
  for (const id of denunciaIds) {
    try {
      await excluirDenuncia(id)
      sucesso.push(id)
    } catch (err: unknown) {
      falhas.push({ id, erro: (err as Error)?.message || 'Erro desconhecido' })
    }
  }
  return { sucesso, falhas }
}

/**
 * Busca URLs assinadas dos anexos de uma denúncia (admin).
 */
export async function buscarAnexosDenuncia(denunciaId: number) {
  return api.get<{
    anexos: Array<{
      id: number
      nomeArquivo: string
      tipoArquivo: string | null
      tamanho: number | null
      storagePath: string
      url: string
    }>
  }>(`/denuncias/${denunciaId}/anexos`)
}
