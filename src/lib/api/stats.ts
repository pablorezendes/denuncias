import { api } from '../http'
import type { DenunciaStatus } from '@/types/database'

export interface DashboardStats {
  total: number
  porStatus: { status: DenunciaStatus; count: number }[]
  porCategoria: { categoria: string; count: number }[]
  porMes: { mes: string; count: number }[]
  porPrioridade: { prioridade: string; count: number }[]
  recentes: number
  pendentesUrgentes: number
  tempoMedioResolucao: number | null
}

export interface DashboardFilters {
  dataInicio?: string
  dataFim?: string
  status?: DenunciaStatus
  categoriaId?: number
}

/**
 * Busca estatísticas do dashboard via endpoint do backend.
 */
export async function buscarEstatisticasDashboard(
  filtros?: DashboardFilters,
): Promise<DashboardStats> {
  return api.get<DashboardStats>('/stats/dashboard', {
    params: {
      dataInicio: filtros?.dataInicio,
      dataFim: filtros?.dataFim,
      status: filtros?.status,
      categoriaId: filtros?.categoriaId,
    },
  })
}
